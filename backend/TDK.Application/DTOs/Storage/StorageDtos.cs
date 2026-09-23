using System.Text.Json.Serialization;

namespace TDK.Application.DTOs.Storage;

public record StorageStatusDto(
    decimal UsedMegabytes,
    decimal LimitMegabytes,
    decimal WarningThresholdMegabytes,
    decimal UsedPercent,
    bool IsHealthy,
    int CompletedBookingCount,
    DateTime CheckedAtUtc);

public record BookingCleanupPreviewDto(DateOnly FromDate, DateOnly ThroughDate, int EligibleBookingCount, int ReceiptCount, DateOnly? OldestBookingDate);

public record BookingCleanupRequest(DateOnly FromDate, DateOnly ThroughDate, string Confirmation);

public record BookingCleanupHistoryDto(
    long Id,
    DateOnly? SelectedFromDate,
    DateOnly DeletedThroughDate,
    DateOnly? OldestBookingDate,
    int DeletedBookingCount,
    int DeletedReceiptCount,
    string DeletedByName,
    string DeletedByEmail,
    DateTime DeletedAtUtc);

public sealed class BookingCleanupResultDto
{
    public int DeletedBookingCount { get; init; }
    public int DeletedReceiptCount { get; init; }
    public DateOnly FromDate { get; init; }
    public DateOnly ThroughDate { get; init; }
    public BookingCleanupHistoryDto Audit { get; init; } = null!;

    [JsonIgnore]
    public IReadOnlyList<string> ReceiptFileNames { get; init; } = [];
}
