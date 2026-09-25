using Microsoft.Extensions.Configuration;
using System.Globalization;
using System.Net;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using TDK.Application.DTOs.Auth;
using TDK.Application.Interfaces;

namespace TDK.Infrastructure.Services;

public sealed class CloudinaryProfileImageService : IProfileImageService
{
    private static readonly HttpClient Client = new() { Timeout = TimeSpan.FromSeconds(30) };
    private readonly string _cloudName;
    private readonly string _apiKey;
    private readonly string _apiSecret;
    private readonly string _folder;

    public CloudinaryProfileImageService(IConfiguration configuration)
    {
        _cloudName = configuration["Cloudinary:CloudName"]?.Trim() ?? "";
        _apiKey = configuration["Cloudinary:ApiKey"]?.Trim() ?? "";
        _apiSecret = configuration["Cloudinary:ApiSecret"]?.Trim() ?? "";
        var configuredFolder = configuration["Cloudinary:Folder"]?.Trim().Trim('/');
        _folder = string.IsNullOrWhiteSpace(configuredFolder) ? "tdk/users" : configuredFolder;
    }

    public async Task<ProfileImageUploadResult> UploadAsync(Stream content, string fileName, string contentType, CancellationToken cancellationToken = default)
    {
        EnsureConfigured();
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(CultureInfo.InvariantCulture);
        var parameters = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["folder"] = _folder,
            ["timestamp"] = timestamp
        };

        using var form = new MultipartFormDataContent();
        foreach (var parameter in parameters)
            form.Add(new StringContent(parameter.Value), parameter.Key);
        form.Add(new StringContent(_apiKey), "api_key");
        form.Add(new StringContent(Sign(parameters)), "signature");

        using var fileContent = new StreamContent(content);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        form.Add(fileContent, "file", Path.GetFileName(fileName));

        using var response = await Client.PostAsync(UploadUrl("image/upload"), form, cancellationToken);
        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException(await GetUploadErrorAsync(response, cancellationToken));

        await using var responseStream = await response.Content.ReadAsStreamAsync(cancellationToken);
        var payload = await JsonSerializer.DeserializeAsync<UploadResponse>(responseStream, cancellationToken: cancellationToken);
        if (string.IsNullOrWhiteSpace(payload?.SecureUrl) || string.IsNullOrWhiteSpace(payload.PublicId))
            throw new InvalidOperationException("Cloudinary returned an invalid upload response");

        return new ProfileImageUploadResult(payload.SecureUrl, payload.PublicId);
    }

    public async Task DeleteAsync(string publicId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(publicId)) return;
        EnsureConfigured();
        Exception? lastError = null;
        for (var attempt = 1; attempt <= 3; attempt++)
        {
            try
            {
                var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(CultureInfo.InvariantCulture);
                var parameters = new SortedDictionary<string, string>(StringComparer.Ordinal)
                {
                    ["public_id"] = publicId,
                    ["timestamp"] = timestamp
                };
                using var form = new FormUrlEncodedContent(parameters.Concat(new[]
                {
                    new KeyValuePair<string, string>("api_key", _apiKey),
                    new KeyValuePair<string, string>("signature", Sign(parameters))
                }));
                using var response = await Client.PostAsync(UploadUrl("image/destroy"), form, cancellationToken);
                response.EnsureSuccessStatusCode();
                await using var responseStream = await response.Content.ReadAsStreamAsync(cancellationToken);
                var result = await JsonSerializer.DeserializeAsync<DestroyResponse>(responseStream, cancellationToken: cancellationToken);
                if (result?.Result is "ok" or "not found") return;
                throw new InvalidOperationException("Cloudinary did not delete the previous image");
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception ex)
            {
                lastError = ex;
                if (attempt < 3) await Task.Delay(TimeSpan.FromMilliseconds(200 * attempt), cancellationToken);
            }
        }

        throw new InvalidOperationException("Cloudinary could not delete the image after three attempts", lastError);
    }

    private string UploadUrl(string action) =>
        $"https://api.cloudinary.com/v1_1/{Uri.EscapeDataString(_cloudName)}/{action}";

    private string Sign(IEnumerable<KeyValuePair<string, string>> parameters)
    {
        var unsigned = string.Join("&", parameters.Select(x => $"{x.Key}={x.Value}"));
        var hash = SHA1.HashData(Encoding.UTF8.GetBytes(unsigned + _apiSecret));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    private void EnsureConfigured()
    {
        if (IsMissingOrPlaceholder(_cloudName) || IsMissingOrPlaceholder(_apiKey) || IsMissingOrPlaceholder(_apiSecret))
            throw new InvalidOperationException("Cloudinary is not configured. Set Cloudinary__CloudName, Cloudinary__ApiKey, and Cloudinary__ApiSecret");
    }

    private static bool IsMissingOrPlaceholder(string value) =>
        string.IsNullOrWhiteSpace(value) || value.StartsWith("YOUR_", StringComparison.OrdinalIgnoreCase) || value.StartsWith("your-", StringComparison.OrdinalIgnoreCase);

    private static async Task<string> GetUploadErrorAsync(HttpResponseMessage response, CancellationToken cancellationToken)
    {
        string? cloudinaryMessage = null;
        try
        {
            await using var responseStream = await response.Content.ReadAsStreamAsync(cancellationToken);
            var payload = await JsonSerializer.DeserializeAsync<CloudinaryErrorResponse>(responseStream, cancellationToken: cancellationToken);
            cloudinaryMessage = payload?.Error?.Message;
        }
        catch (JsonException)
        {
            // Cloudinary normally returns JSON, but callers should still get a safe,
            // actionable message if an upstream proxy replaces the response body.
        }

        if (response.StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden ||
            cloudinaryMessage?.Contains("signature", StringComparison.OrdinalIgnoreCase) == true)
        {
            return "Cloudinary rejected the credentials. Re-copy the cloud name, API key, and API secret from the same Cloudinary product environment";
        }

        if (response.StatusCode == HttpStatusCode.NotFound)
            return "Cloudinary could not find the configured cloud. Check the Cloudinary cloud name";

        if ((int)response.StatusCode == 420 || response.StatusCode == HttpStatusCode.TooManyRequests)
            return "Cloudinary temporarily rate-limited image uploads. Wait a moment and try again";

        return "Cloudinary rejected the profile image. Confirm that JPEG, PNG, and WebP uploads are enabled, then try again";
    }

    private sealed record UploadResponse(
        [property: JsonPropertyName("secure_url")] string SecureUrl,
        [property: JsonPropertyName("public_id")] string PublicId);

    private sealed record DestroyResponse([property: JsonPropertyName("result")] string Result);

    private sealed record CloudinaryErrorResponse([property: JsonPropertyName("error")] CloudinaryError? Error);

    private sealed record CloudinaryError([property: JsonPropertyName("message")] string? Message);
}
