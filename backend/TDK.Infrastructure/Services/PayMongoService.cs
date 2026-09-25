using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using TDK.Application.Interfaces;

namespace TDK.Infrastructure.Services;

public class PayMongoService : IPayMongoService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<PayMongoService> _logger;
    private readonly string? _secretKey;
    private readonly string? _webhookSecret;

    public PayMongoService(HttpClient httpClient, IConfiguration configuration, ILogger<PayMongoService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
        _secretKey = _configuration["PayMongo:SecretKey"];
        _webhookSecret = _configuration["PayMongo:WebhookSecret"];

        _httpClient.BaseAddress = new Uri("https://api.paymongo.com/v1/");
        
        if (!string.IsNullOrEmpty(_secretKey))
        {
            var authBytes = Encoding.ASCII.GetBytes($"{_secretKey}:");
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", Convert.ToBase64String(authBytes));
        }
    }

    public async Task<string> CreateLinkAsync(decimal amount, string description, string referenceNumber, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrEmpty(_secretKey))
        {
            _logger.LogWarning("PayMongo:SecretKey is not configured. Simulating a checkout link.");
            return $"https://simulate.paymongo.com/checkout?ref={referenceNumber}";
        }

        var amountInCents = (int)Math.Round(amount * 100, MidpointRounding.AwayFromZero);

        var payload = new
        {
            data = new
            {
                attributes = new
                {
                    amount = amountInCents,
                    description,
                    remarks = referenceNumber
                }
            }
        };

        var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        var response = await _httpClient.PostAsync("links", content, cancellationToken);
        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("PayMongo link creation failed: {Body}", responseBody);
            throw new Exception("Failed to generate payment link.");
        }

        using var doc = JsonDocument.Parse(responseBody);
        var checkoutUrl = doc.RootElement.GetProperty("data").GetProperty("attributes").GetProperty("checkout_url").GetString();
        
        return checkoutUrl ?? throw new Exception("Checkout URL missing in response.");
    }

    public bool VerifyWebhookSignature(string payload, string signatureHeader)
    {
        if (string.IsNullOrEmpty(_webhookSecret))
        {
            _logger.LogWarning("PayMongo:WebhookSecret is not configured. Allowing webhook simulation.");
            return true; // Allow simulation if secret is not set
        }

        try
        {
            // PayMongo signature header format: t=1612345678,te=test_signature,li=live_signature
            var parts = signatureHeader.Split(',');
            var timestamp = "";
            var testSignature = "";
            var liveSignature = "";

            foreach (var part in parts)
            {
                var kvp = part.Split('=', 2);
                if (kvp.Length == 2)
                {
                    switch (kvp[0].Trim())
                    {
                        case "t": timestamp = kvp[1].Trim(); break;
                        case "te": testSignature = kvp[1].Trim(); break;
                        case "li": liveSignature = kvp[1].Trim(); break;
                    }
                }
            }

            var signatureToVerify = !string.IsNullOrEmpty(testSignature) ? testSignature : liveSignature;
            if (string.IsNullOrEmpty(timestamp) || string.IsNullOrEmpty(signatureToVerify)) return false;

            var signedPayload = $"{timestamp}.{payload}";
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_webhookSecret));
            var hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(signedPayload));
            var expectedSignature = BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();

            return expectedSignature == signatureToVerify;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to verify PayMongo webhook signature.");
            return false;
        }
    }
}
