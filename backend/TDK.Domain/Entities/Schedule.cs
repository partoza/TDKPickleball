using TDK.Domain.Enums;

namespace TDK.Domain.Entities;

public class Schedule
{
    public long Id { get; set; }
    public int CourtId { get; set; }
    public DateOnly ScheduleDate { get; set; }
    public int TimeSlotId { get; set; }
    public ScheduleStatus Status { get; set; }
    public long? BookingId { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? UpdatedByUserId { get; set; }
    public byte[] RowVersion { get; set; } = null!;

    public Court Court { get; set; } = null!;
    public TimeSlot TimeSlot { get; set; } = null!;
    public Booking? Booking { get; set; }
}