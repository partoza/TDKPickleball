using TDK.Domain.Enums;

namespace TDK.Domain.Entities;

public class Booking
{
    public long Id { get; set; }
    public string BookingReference { get; set; } = null!;
    public int CourtId { get; set; }
    public string CustomerName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? Phone { get; set; }
    public DateOnly BookingDate { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public decimal Subtotal { get; set; }
    public decimal DiscountAmount { get; set; }
    public int PaddleRentalQuantity { get; set; }
    public decimal PaddleRentalFee { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal AmountPaid { get; set; }
    public BookingStatus Status { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? RescheduledAt { get; set; }
    public DateTime? ReminderSentAt { get; set; }
    public string? ReceiptFileName { get; set; }
    public string? ReceiptContentType { get; set; }
    
    public int? InternalCoachProfileId { get; set; }
    public int? PromoId { get; set; }
    
    public Court Court { get; set; } = null!;
    public InternalCoachProfile? InternalCoachProfile { get; set; }
    public Promo? Promo { get; set; }
    public ICollection<Schedule> Schedules { get; set; } = new List<Schedule>();
}
