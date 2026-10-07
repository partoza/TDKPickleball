using System.Globalization;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TDK.Infrastructure.Data;

namespace TDK.Infrastructure.Services;

/// <summary>
/// Periodically mirrors database records to two Google Sheets tabs. The database remains the
/// source of truth; rewriting each tab makes inserts, updates, and deletions converge reliably.
/// </summary>
public sealed class GoogleSheetsExportHostedService : BackgroundService
{
    public const string HttpClientName = "GoogleSheetsExport";
    private const string SheetsScope = "https://www.googleapis.com/auth/spreadsheets";
    private const string TokenEndpoint = "https://oauth2.googleapis.com/token";

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GoogleSheetsExportHostedService> _logger;
    private string? _accessToken;
    private DateTimeOffset _accessTokenExpiresAt;

    public GoogleSheetsExportHostedService(
        IServiceScopeFactory scopeFactory,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<GoogleSheetsExportHostedService> logger)
    {
        _scopeFactory = scopeFactory;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var options = GoogleSheetsExportOptions.FromConfiguration(_configuration);
        if (!options.Enabled)
        {
            _logger.LogInformation("Google Sheets export is disabled");
            return;
        }

        var configurationError = options.Validate();
        if (configurationError is not null)
        {
            _logger.LogError("Google Sheets export is enabled but not configured: {ConfigurationError}", configurationError);
            return;
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ExportAsync(options, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "Google Sheets export failed; the database was not changed");
            }

            await Task.Delay(TimeSpan.FromSeconds(options.SyncIntervalSeconds), stoppingToken);
        }
    }

    private async Task ExportAsync(GoogleSheetsExportOptions options, CancellationToken cancellationToken)
    {
        await using var scope = _scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<TdkDbContext>();

        var bookings = await db.Bookings.AsNoTracking()
            .Include(booking => booking.Court)
            .Include(booking => booking.Customer)
            .Include(booking => booking.Promo)
            .Include(booking => booking.InternalCoachProfile)
            .OrderByDescending(booking => booking.CreatedAt)
            .ToListAsync(cancellationToken);
        var customers = await db.Customers.AsNoTracking()
            .OrderBy(customer => customer.FullName)
            .ThenBy(customer => customer.Id)
            .ToListAsync(cancellationToken);

        var bookingRows = GoogleSheetsRows.Bookings(bookings);
        var customerRows = GoogleSheetsRows.Customers(customers);

        var client = _httpClientFactory.CreateClient(HttpClientName);
        var token = await GetAccessTokenAsync(options, cancellationToken);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var existingTabs = await GetTabsAsync(client, options.SpreadsheetId, cancellationToken);
        var bookingsSheetId = await EnsureTabAsync(client, options.SpreadsheetId, options.BookingsTabName, existingTabs, cancellationToken);
        var customersSheetId = await EnsureTabAsync(client, options.SpreadsheetId, options.CustomersTabName, existingTabs, cancellationToken);

        await ReplaceTabAsync(client, options.SpreadsheetId, options.BookingsTabName, bookingRows, cancellationToken);
        await ReplaceTabAsync(client, options.SpreadsheetId, options.CustomersTabName, customerRows, cancellationToken);
        await FormatTabAsync(client, options.SpreadsheetId, bookingsSheetId, bookingRows.Count, bookingRows[0].Count, true, cancellationToken);
        await FormatTabAsync(client, options.SpreadsheetId, customersSheetId, customerRows.Count, customerRows[0].Count, false, cancellationToken);
        _logger.LogInformation("Google Sheets export completed with {BookingCount} bookings and {CustomerCount} customers",
            bookings.Count, customers.Count);
    }

    private async Task<string> GetAccessTokenAsync(GoogleSheetsExportOptions options, CancellationToken cancellationToken)
    {
        if (_accessToken is not null && _accessTokenExpiresAt > DateTimeOffset.UtcNow.AddMinutes(2))
            return _accessToken;

        var now = DateTimeOffset.UtcNow;
        var header = Base64Url(JsonSerializer.SerializeToUtf8Bytes(new { alg = "RS256", typ = "JWT" }));
        var payload = Base64Url(JsonSerializer.SerializeToUtf8Bytes(new
        {
            iss = options.ServiceAccountEmail,
            scope = SheetsScope,
            aud = TokenEndpoint,
            iat = now.ToUnixTimeSeconds(),
            exp = now.AddMinutes(55).ToUnixTimeSeconds()
        }));
        var unsignedToken = $"{header}.{payload}";

        using var rsa = RSA.Create();
        rsa.ImportFromPem(options.PrivateKey.Replace("\\n", "\n", StringComparison.Ordinal));
        var signature = rsa.SignData(Encoding.ASCII.GetBytes(unsignedToken), HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);
        var assertion = $"{unsignedToken}.{Base64Url(signature)}";

        using var tokenClient = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
        using var response = await tokenClient.PostAsync(TokenEndpoint, new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["grant_type"] = "urn:ietf:params:oauth:grant-type:jwt-bearer",
            ["assertion"] = assertion
        }), cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException($"Google service-account authentication failed ({(int)response.StatusCode})");

        using var document = JsonDocument.Parse(body);
        _accessToken = document.RootElement.GetProperty("access_token").GetString()
            ?? throw new InvalidOperationException("Google did not return an access token");
        var expiresIn = document.RootElement.TryGetProperty("expires_in", out var expiry) ? expiry.GetInt32() : 3600;
        _accessTokenExpiresAt = now.AddSeconds(expiresIn);
        return _accessToken;
    }

    private static async Task<Dictionary<string, int>> GetTabsAsync(HttpClient client, string spreadsheetId, CancellationToken cancellationToken)
    {
        using var response = await client.GetAsync($"spreadsheets/{Uri.EscapeDataString(spreadsheetId)}?fields=sheets.properties(sheetId,title)", cancellationToken);
        await EnsureSuccessAsync(response, "read spreadsheet metadata", cancellationToken);
        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
        return document.RootElement.GetProperty("sheets").EnumerateArray()
            .Select(sheet => sheet.GetProperty("properties"))
            .ToDictionary(properties => properties.GetProperty("title").GetString()!,
                properties => properties.GetProperty("sheetId").GetInt32(), StringComparer.Ordinal);
    }

    private static async Task<int> EnsureTabAsync(HttpClient client, string spreadsheetId, string tabName,
        Dictionary<string, int> existingTabs, CancellationToken cancellationToken)
    {
        if (existingTabs.TryGetValue(tabName, out var existingSheetId)) return existingSheetId;
        using var content = JsonContent.Create(new
        {
            requests = new[] { new { addSheet = new { properties = new { title = tabName } } } }
        });
        using var response = await client.PostAsync($"spreadsheets/{Uri.EscapeDataString(spreadsheetId)}:batchUpdate", content, cancellationToken);
        await EnsureSuccessAsync(response, $"create the {tabName} tab", cancellationToken);
        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
        var sheetId = document.RootElement.GetProperty("replies")[0].GetProperty("addSheet").GetProperty("properties").GetProperty("sheetId").GetInt32();
        existingTabs[tabName] = sheetId;
        return sheetId;
    }

    private static async Task ReplaceTabAsync(HttpClient client, string spreadsheetId, string tabName,
        IReadOnlyList<IReadOnlyList<object?>> rows, CancellationToken cancellationToken)
    {
        var escapedId = Uri.EscapeDataString(spreadsheetId);
        var range = Uri.EscapeDataString($"'{tabName.Replace("'", "''", StringComparison.Ordinal)}'");

        using (var clearResponse = await client.PostAsync($"spreadsheets/{escapedId}/values/{range}:clear",
                   JsonContent.Create(new { }), cancellationToken))
        {
            await EnsureSuccessAsync(clearResponse, $"clear the {tabName} tab", cancellationToken);
        }

        using var updateContent = JsonContent.Create(new { range = $"'{tabName.Replace("'", "''", StringComparison.Ordinal)}'!A1", majorDimension = "ROWS", values = rows });
        using var updateResponse = await client.PutAsync(
            $"spreadsheets/{escapedId}/values/{range}!A1?valueInputOption=RAW", updateContent, cancellationToken);
        await EnsureSuccessAsync(updateResponse, $"write the {tabName} tab", cancellationToken);
    }

    private static async Task FormatTabAsync(HttpClient client, string spreadsheetId, int sheetId, int rowCount,
        int columnCount, bool isBookingsTab, CancellationToken cancellationToken)
    {
        var tabColor = isBookingsTab
            ? new { red = 0.82, green = 0.08, blue = 0.12 }
            : new { red = 0.95, green = 0.58, blue = 0.10 };
        var requests = new List<object>
        {
            new
            {
                updateSheetProperties = new
                {
                    properties = new
                    {
                        sheetId,
                        tabColorStyle = new { rgbColor = tabColor },
                        gridProperties = new { frozenRowCount = 1, frozenColumnCount = 2 }
                    },
                    fields = "tabColorStyle,gridProperties.frozenRowCount,gridProperties.frozenColumnCount"
                }
            },
            new
            {
                repeatCell = new
                {
                    range = new { sheetId, startRowIndex = 0, endRowIndex = 1, startColumnIndex = 0, endColumnIndex = columnCount },
                    cell = new
                    {
                        userEnteredFormat = new
                        {
                            backgroundColorStyle = new { rgbColor = new { red = 0.12, green = 0.14, blue = 0.18 } },
                            textFormat = new { foregroundColorStyle = new { rgbColor = new { red = 1.0, green = 1.0, blue = 1.0 } }, bold = true, fontSize = 10 },
                            horizontalAlignment = "CENTER",
                            verticalAlignment = "MIDDLE",
                            wrapStrategy = "WRAP"
                        }
                    },
                    fields = "userEnteredFormat(backgroundColorStyle,textFormat,horizontalAlignment,verticalAlignment,wrapStrategy)"
                }
            },
            new
            {
                repeatCell = new
                {
                    range = new { sheetId, startRowIndex = 1, endRowIndex = Math.Max(2, rowCount), startColumnIndex = 0, endColumnIndex = columnCount },
                    cell = new { userEnteredFormat = new { verticalAlignment = "MIDDLE", textFormat = new { fontSize = 10 } } },
                    fields = "userEnteredFormat(verticalAlignment,textFormat.fontSize)"
                }
            },
            new
            {
                updateDimensionProperties = new
                {
                    range = new { sheetId, dimension = "ROWS", startIndex = 0, endIndex = 1 },
                    properties = new { pixelSize = 42 },
                    fields = "pixelSize"
                }
            },
            new
            {
                autoResizeDimensions = new
                {
                    dimensions = new { sheetId, dimension = "COLUMNS", startIndex = 0, endIndex = columnCount }
                }
            },
            new
            {
                setBasicFilter = new
                {
                    filter = new { range = new { sheetId, startRowIndex = 0, endRowIndex = Math.Max(1, rowCount), startColumnIndex = 0, endColumnIndex = columnCount } }
                }
            }
        };

        foreach (var (columnIndex, width) in isBookingsTab
                     ? new[] { (0, 70), (1, 155), (6, 180), (7, 220), (25, 260) }
                     : new[] { (0, 70), (1, 130), (2, 180), (4, 220), (12, 220), (13, 260) })
        {
            requests.Add(new
            {
                updateDimensionProperties = new
                {
                    range = new { sheetId, dimension = "COLUMNS", startIndex = columnIndex, endIndex = columnIndex + 1 },
                    properties = new { pixelSize = width },
                    fields = "pixelSize"
                }
            });
        }

        using var content = JsonContent.Create(new { requests });
        using var response = await client.PostAsync($"spreadsheets/{Uri.EscapeDataString(spreadsheetId)}:batchUpdate", content, cancellationToken);
        await EnsureSuccessAsync(response, "format an exported tab", cancellationToken);
    }

    private static async Task EnsureSuccessAsync(HttpResponseMessage response, string operation, CancellationToken cancellationToken)
    {
        if (response.IsSuccessStatusCode) return;
        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        var safeBody = body.Length > 1000 ? body[..1000] : body;
        throw new InvalidOperationException($"Google Sheets could not {operation} ({(int)response.StatusCode}): {safeBody}");
    }

    private static string Base64Url(byte[] value) => Convert.ToBase64String(value).TrimEnd('=').Replace('+', '-').Replace('/', '_');
}

internal sealed record GoogleSheetsExportOptions(
    bool Enabled,
    string SpreadsheetId,
    string ServiceAccountEmail,
    string PrivateKey,
    string BookingsTabName,
    string CustomersTabName,
    int SyncIntervalSeconds)
{
    public static GoogleSheetsExportOptions FromConfiguration(IConfiguration configuration)
    {
        var section = configuration.GetSection("GoogleSheets");
        return new(
            section.GetValue("Enabled", false),
            section["SpreadsheetId"]?.Trim() ?? "",
            section["ServiceAccountEmail"]?.Trim() ?? "",
            section["PrivateKey"] ?? "",
            section["BookingsTabName"]?.Trim() ?? "Bookings",
            section["CustomersTabName"]?.Trim() ?? "Customers",
            Math.Clamp(section.GetValue("SyncIntervalSeconds", 60), 15, 3600));
    }

    public string? Validate()
    {
        if (string.IsNullOrWhiteSpace(SpreadsheetId)) return "GoogleSheets:SpreadsheetId is required";
        if (string.IsNullOrWhiteSpace(ServiceAccountEmail)) return "GoogleSheets:ServiceAccountEmail is required";
        if (string.IsNullOrWhiteSpace(PrivateKey)) return "GoogleSheets:PrivateKey is required";
        if (!PrivateKey.Replace("\\n", "\n", StringComparison.Ordinal).Contains("BEGIN PRIVATE KEY", StringComparison.Ordinal))
            return "GoogleSheets:PrivateKey is not a PEM private key";
        if (!ValidTabName(BookingsTabName) || !ValidTabName(CustomersTabName)) return "Google Sheets tab names are invalid";
        if (BookingsTabName.Equals(CustomersTabName, StringComparison.Ordinal)) return "Bookings and customers must use different tab names";
        return null;
    }

    private static bool ValidTabName(string value) => value.Length is > 0 and <= 100 && value.IndexOfAny([':', '\\', '/', '?', '*', '[', ']']) < 0;
}

internal static class GoogleSheetsRows
{
    public static IReadOnlyList<IReadOnlyList<object?>> Bookings(IEnumerable<TDK.Domain.Entities.Booking> bookings)
    {
        var rows = new List<IReadOnlyList<object?>>
        {
            new object?[] { "ID", "Booking Reference", "Court ID", "Court", "Customer ID", "Customer Number", "Customer Name", "Email", "Phone", "Booking Date", "Start Time", "End Time", "Subtotal", "Discount", "Paddle Quantity", "Paddle Fee", "Voided Paddle Quantity", "Voided Paddle Fee", "Paddle Voided At (UTC)", "Paddle Voided By User ID", "Paddle Voided By", "Total", "Amount Paid", "Balance", "Status", "Notes", "Promo ID", "Promo Code", "Coach ID", "Coach", "Listed By User ID", "Listed By", "Confirmed At (UTC)", "Confirmed By User ID", "Confirmed By", "Rescheduled At (UTC)", "Rescheduled By User ID", "Rescheduled By", "Cancelled At (UTC)", "Cancelled By User ID", "Cancelled By", "Reminder Sent At (UTC)", "Created At (UTC)", "Updated At (UTC)", "Receipt File", "Receipt Content Type" }
        };
        rows.AddRange(bookings.Select(booking => (IReadOnlyList<object?>)new object?[]
        {
            booking.Id, booking.BookingReference, booking.CourtId, booking.Court?.Name ?? "", booking.CustomerId,
            booking.CustomerId.HasValue ? $"TDK-{booking.CustomerId.Value:D6}" : "", booking.CustomerName, booking.Email,
            booking.Phone ?? "", Date(booking.BookingDate), Time(booking.StartTime), Time(booking.EndTime), Number(booking.Subtotal),
            Number(booking.DiscountAmount), booking.PaddleRentalQuantity, Number(booking.PaddleRentalFee), booking.VoidedPaddleRentalQuantity,
            Number(booking.VoidedPaddleRentalFee), Timestamp(booking.PaddleRentalVoidedAt), booking.PaddleRentalVoidedByUserId ?? "",
            booking.PaddleRentalVoidedByName ?? "", Number(booking.TotalAmount), Number(booking.AmountPaid),
            Number(Math.Max(0, booking.TotalAmount - booking.AmountPaid)), booking.Status.ToString(), booking.Notes ?? "",
            booking.PromoId, booking.Promo?.Code ?? "", booking.InternalCoachProfileId, booking.InternalCoachProfile?.Name ?? "",
            booking.ListedByUserId ?? "", booking.ListedByName ?? "", Timestamp(booking.ConfirmedAt), booking.ConfirmedByUserId ?? "",
            booking.ConfirmedByName ?? "", Timestamp(booking.RescheduledAt), booking.RescheduledByUserId ?? "", booking.RescheduledByName ?? "",
            Timestamp(booking.CancelledAt), booking.CancelledByUserId ?? "", booking.CancelledByName ?? "", Timestamp(booking.ReminderSentAt),
            Timestamp(booking.CreatedAt), Timestamp(booking.UpdatedAt), booking.ReceiptFileName ?? "", booking.ReceiptContentType ?? ""
        }));
        return rows;
    }

    public static IReadOnlyList<IReadOnlyList<object?>> Customers(IEnumerable<TDK.Domain.Entities.Customer> customers)
    {
        var rows = new List<IReadOnlyList<object?>>
        {
            new object?[] { "ID", "Customer Number", "Full Name", "Username", "Email", "Phone", "Active", "Has NFC Card", "Card Valid From", "Card Valid Through", "NFC Issued At (UTC)", "NFC Last Tapped At (UTC)", "Profile Picture URL", "Admin Notes", "Created At (UTC)", "Updated At (UTC)" }
        };
        rows.AddRange(customers.Select(customer => (IReadOnlyList<object?>)new object?[]
        {
            customer.Id, $"TDK-{customer.Id:D6}", customer.FullName, customer.Username, customer.Email, customer.Phone ?? "",
            customer.IsActive, customer.NfcTokenHash is { Length: 32 }, Date(customer.CardValidFrom), Date(customer.CardValidThrough),
            Timestamp(customer.NfcIssuedAt), Timestamp(customer.NfcLastTappedAt), customer.ProfilePictureUrl ?? "", customer.AdminNotes ?? "",
            Timestamp(customer.CreatedAt), Timestamp(customer.UpdatedAt)
        }));
        return rows;
    }

    private static string Date(DateOnly value) => value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
    private static string Date(DateOnly? value) => value?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) ?? "";
    private static string Time(TimeOnly value) => value.ToString("HH:mm", CultureInfo.InvariantCulture);
    private static double Number(decimal value) => Convert.ToDouble(value, CultureInfo.InvariantCulture);
    private static string Timestamp(DateTime? value)
    {
        if (!value.HasValue) return "";
        var utc = value.Value.Kind switch
        {
            DateTimeKind.Utc => value.Value,
            DateTimeKind.Local => value.Value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value.Value, DateTimeKind.Utc)
        };
        return utc.ToString("yyyy-MM-dd HH:mm:ss 'UTC'", CultureInfo.InvariantCulture);
    }
}
