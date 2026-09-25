namespace TDK.Application.DTOs.Notifications;

public record NotificationDto(long Id, long? BookingId, string Title, string Message, DateTime CreatedAtUtc);
