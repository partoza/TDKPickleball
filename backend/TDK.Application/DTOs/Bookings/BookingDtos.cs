using TDK.Domain.Enums;
using TDK.Application.DTOs.Schedules;

namespace TDK.Application.DTOs.Bookings;

public record BookingDto(long Id, string BookingReference, int CourtId, string CourtName, string CustomerName, string Email, string? Phone, DateOnly BookingDate, TimeOnly StartTime, TimeOnly EndTime, decimal Subtotal, decimal DiscountAmount, decimal TotalAmount, decimal AmountPaid, decimal RemainingBalance, BookingStatus Status, string? Notes, DateTime CreatedAt, RateType BookingType = RateType.Booking, bool ReceiptAvailable = false, DateTime? RescheduledAt = null, int? InternalCoachProfileId = null, int? PromoId = null, int PaddleRentalQuantity = 0, decimal PaddleRentalFee = 0);
public record CreateBookingRequest(int CourtId, DateOnly BookingDate, TimeOnly StartTime, TimeOnly EndTime, string CustomerName, string? Email, string? Phone, string? Notes, decimal AmountPaid = 0, RateType RateType = RateType.Booking, int? InternalCoachProfileId = null, int? PromoId = null, int PaddleRentalQuantity = 0);
public record UpdateBookingRequest(int CourtId, DateOnly BookingDate, TimeOnly StartTime, TimeOnly EndTime, string CustomerName, string? Email, string? Phone, string? Notes, decimal AmountPaid, BookingStatus Status, int? InternalCoachProfileId = null, int? PromoId = null, int? PaddleRentalQuantity = null);
public record RescheduleBookingRequest(int CourtId, DateOnly BookingDate, TimeOnly StartTime, TimeOnly EndTime);
public record VerifyBookingRequest(string BookingReference);
public record AddPaddleRentalRequest(int Quantity);
public record BookingAvailabilityDto(DateOnly Date, int CourtId, List<TimeSlotDto> AvailableSlots, List<TimeSlotDto> OccupiedSlots);
public record ReceiptInfoDto(string FileName, string ContentType);
public record PublicBookingRequestBlockDto(int CourtId, DateOnly BookingDate, TimeOnly StartTime, TimeOnly EndTime);
public record PublicBookingRequestSubmissionDto(string CustomerName, string Email, string? Phone, string? Notes, int PaddleRentalQuantity, IReadOnlyList<PublicBookingRequestBlockDto> Schedules);
public record PublicBookingRequestScheduleDto(int CourtId, string CourtName, DateOnly BookingDate, TimeOnly StartTime, TimeOnly EndTime, decimal Amount);
public record PublicBookingRequestEmailDto(string RequestReference, string CustomerName, string Email, string? Phone, string? Notes, IReadOnlyList<PublicBookingRequestScheduleDto> Schedules, int PaddleRentalQuantity, decimal PaddleRentalFee, decimal TotalAmount, DateTime SubmittedAt);
public record PublicBookingRequestReceiptDto(string RequestReference, DateTime SubmittedAt);
public record PublicPayMongoRequestResponseDto(string RequestReference, string CheckoutUrl, DateTime SubmittedAt, IReadOnlyList<string>? BookingReferences = null);
public record RevenueDailyDto(DateOnly Date, decimal BookingSales, decimal TrainingSales, decimal PaddleRentalSales, decimal GrossSales, decimal CollectedRevenue, decimal OutstandingBalance, int TransactionCount);
public record RevenueSummaryDto(DateOnly FromDate, DateOnly ThroughDate, decimal CollectedRevenue, decimal GrossSales, decimal OutstandingBalance, decimal BookingSales, decimal TrainingSales, decimal PaddleRentalSales, int PaddleRentalCount, int TransactionCount, int PaidCount, int ReservedCount, int CompletedCount, IReadOnlyList<RevenueDailyDto> Daily);
