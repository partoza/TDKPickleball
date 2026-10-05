namespace TDK.Application.DTOs.Schedules;

public record PublicBookingWindowDto(DateOnly? BookingThroughDate);
public record UpdatePublicBookingWindowRequest(DateOnly? BookingThroughDate);
