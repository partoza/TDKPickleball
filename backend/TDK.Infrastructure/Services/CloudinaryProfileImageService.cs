using Microsoft.Extensions.Configuration;
using System.Globalization;
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
            throw new InvalidOperationException("Cloudinary rejected the profile image upload");

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
        if (string.IsNullOrWhiteSpace(_cloudName) || string.IsNullOrWhiteSpace(_apiKey) || string.IsNullOrWhiteSpace(_apiSecret))
            throw new InvalidOperationException("Cloudinary is not configured. Set Cloudinary__CloudName, Cloudinary__ApiKey, and Cloudinary__ApiSecret");
    }

    private sealed record UploadResponse(
        [property: JsonPropertyName("secure_url")] string SecureUrl,
        [property: JsonPropertyName("public_id")] string PublicId);
}
