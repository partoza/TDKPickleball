using TDK.Application.DTOs.Common;
using TDK.Application.DTOs.Notifications;
using TDK.Application.Interfaces;
using TDK.Domain.Entities;
using TDK.Domain.Enums;
using TDK.Domain.Interfaces;

namespace TDK.Application.Services;

public sealed class NotificationService : INotificationService
{
    private readonly IRepository<Notification> _notifications;
    private readonly IRepository<Booking> _bookings;
    private readonly IBusinessClock _clock;

    public NotificationService(IRepository<Notification> notifications, IRepository<Booking> bookings, IBusinessClock clock)
    {
        _notifications = notifications;
        _bookings = bookings;
        _clock = clock;
    }

    public async Task<ApiResponse<IReadOnlyList<NotificationDto>>> GetActiveAsync()
    {
        var nowUtc = _clock.UtcNow.UtcDateTime;
        var activeBookingIds = (await _bookings.FindAsync(booking =>
                booking.Status != BookingStatus.Cancelled && booking.Status != BookingStatus.Completed))
            .Select(booking => booking.Id)
            .ToHashSet();

        var items = (await _notifications.FindAsync(notification => notification.ExpiresAt > nowUtc))
            .Where(notification => !notification.BookingId.HasValue || activeBookingIds.Contains(notification.BookingId.Value))
            .OrderByDescending(notification => notification.CreatedAt)
            .Take(10)
            .Select(notification => new NotificationDto(
                notification.Id,
                notification.BookingId,
                notification.Title,
                notification.Message,
                DateTime.SpecifyKind(notification.CreatedAt, DateTimeKind.Utc)))
            .ToList();

        return ApiResponse<IReadOnlyList<NotificationDto>>.Ok(items);
    }
}
