using System.ComponentModel.DataAnnotations;
using TDK.Domain.Enums;

namespace TDK.Application.DTOs.Schedules;

public record ScheduleDto(long Id, int CourtId, string CourtName, DateOnly Date, int TimeSlotId, TimeOnly StartTime, TimeOnly EndTime, ScheduleStatus Status, string? Notes, long? BookingId = null, string? BookingReference = null, string? BookedBy = null, string? Email = null, string? Phone = null, BookingStatus? PaymentStatus = null, decimal AmountPaid = 0, decimal TotalAmount = 0, int? InternalCoachProfileId = null);
public record UpdateScheduleRequest(ScheduleStatus Status, string? Notes, string? BookedBy, string? Email, string? Phone, BookingStatus PaymentStatus = BookingStatus.Reserved, decimal AmountPaid = 0, int? InternalCoachProfileId = null, int? PromoId = null, int PaddleRentalQuantity = 0);
public record BulkUpdateRequest(int CourtId, DateOnly Date, TimeOnly StartTime, TimeOnly EndTime, ScheduleStatus Status, string? Notes, string? BookedBy, string? Email, string? Phone, BookingStatus PaymentStatus = BookingStatus.Reserved, decimal AmountPaid = 0, int? InternalCoachProfileId = null, int? PromoId = null, int PaddleRentalQuantity = 0);
public record CopyScheduleRequest(DateOnly SourceDate, DateOnly TargetDate, int CourtId);
public sealed class DeleteScheduleRequest
{
    [Required, EmailAddress, StringLength(256)]
    public string Email { get; init; } = string.Empty;

    [Required, StringLength(256, MinimumLength = 1)]
    public string Password { get; init; } = string.Empty;
}
