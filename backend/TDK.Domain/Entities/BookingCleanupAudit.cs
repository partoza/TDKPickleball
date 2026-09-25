namespace TDK.Domain.Entities;

public class BookingCleanupAudit
{
    public long Id { get; set; }
    public DateOnly? SelectedFromDate { get; set; }
    public DateOnly DeletedThroughDate { get; set; }
    public DateOnly? OldestBookingDate { get; set; }
    public int DeletedBookingCount { get; set; }
    public int DeletedScheduleCount { get; set; }
    public int DeletedReceiptCount { get; set; }
    public string DeletedByUserId { get; set; } = null!;
    public string DeletedByName { get; set; } = null!;
    public string DeletedByEmail { get; set; } = null!;
    public DateTime DeletedAtUtc { get; set; }
}
