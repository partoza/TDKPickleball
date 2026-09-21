namespace TDK.Domain.Entities;

public class Notification
{
    public long Id { get; set; }
    public long? BookingId { get; set; }
    public string Title { get; set; } = null!;
    public string Message { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public Booking? Booking { get; set; }
}
