using TDK.Domain.Enums;
using TDK.Application.DTOs.Schedules;

namespace TDK.Application.DTOs.Bookings;

public record BookingDto(long Id, string BookingReference, int CourtId, string CourtName, string CustomerName, string Email, string? Phone, DateOnly BookingDate, TimeOnly StartTime, TimeOnly EndTime, decimal TotalAmount, decimal AmountPaid, decimal RemainingBalance, BookingStatus Status, string? Notes, DateTime CreatedAt, RateType BookingType = RateType.Booking, bool ReceiptAvailable = false, DateTime? RescheduledAt = null);
public record CreateBookingRequest(int CourtId, DateOnly BookingDate, TimeOnly StartTime, TimeOnly EndTime, string CustomerName, string? Email, string? Phone, string? Notes, decimal AmountPaid = 0, RateType RateType = RateType.Booking);
public record UpdateBookingRequest(int CourtId, DateOnly BookingDate, TimeOnly StartTime, TimeOnly EndTime, string CustomerName, string? Email, string? Phone, string? Notes, decimal AmountPaid, BookingStatus Status);
public record RescheduleBookingRequest(int CourtId, DateOnly BookingDate, TimeOnly StartTime, TimeOnly EndTime);
public record VerifyBookingRequest(string BookingReference);
public record BookingAvailabilityDto(DateOnly Date, int CourtId, List<TimeSlotDto> AvailableSlots, List<TimeSlotDto> OccupiedSlots);
public record ReceiptInfoDto(string FileName, string ContentType);
