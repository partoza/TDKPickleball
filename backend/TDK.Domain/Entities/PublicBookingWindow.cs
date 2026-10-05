namespace TDK.Domain.Entities;

public class PublicBookingWindow
{
    public int Id { get; set; }
    public DateOnly? BookingThroughDate { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? UpdatedByUserId { get; set; }
}
