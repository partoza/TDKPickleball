using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TDK.Application.Interfaces;
using TDK.Domain.Enums;
using TDK.Infrastructure.Data;

namespace TDK.Infrastructure.Services;

public class MaintenanceHostedService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<MaintenanceHostedService> _logger;
    private readonly IBusinessClock _clock;

    public MaintenanceHostedService(IServiceScopeFactory scopeFactory, ILogger<MaintenanceHostedService> logger, IBusinessClock clock)
    {
        _scopeFactory = scopeFactory; _logger = logger; _clock = clock;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try { await RunAsync(stoppingToken); }
            catch (Exception ex) { _logger.LogError(ex, "Scheduled reminder/notification maintenance failed"); }
            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
    }

    private async Task RunAsync(CancellationToken token)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TdkDbContext>();
        var email = scope.ServiceProvider.GetRequiredService<IEmailService>();
        var utcNow = _clock.UtcNow;
        var localNow = _clock.ToManilaTime(utcNow);
        var reminderFrom = localNow.AddMinutes(45);
        var reminderTo = localNow.AddMinutes(75);

        var candidates = await db.Bookings.Include(x => x.Court)
            .Where(x => x.ReminderSentAt == null && x.Status != BookingStatus.Cancelled && x.Status != BookingStatus.Completed && x.BookingDate >= DateOnly.FromDateTime(localNow.DateTime))
            .ToListAsync(token);
        foreach (var booking in candidates)
        {
            var starts = booking.BookingDate.ToDateTime(booking.StartTime);
            if (starts < reminderFrom.DateTime || starts > reminderTo.DateTime) continue;
            try { await email.SendBookingReminderAsync(booking, booking.Court.Name, token); booking.ReminderSentAt = utcNow.UtcDateTime; }
            catch (Exception ex) { _logger.LogWarning(ex, "Could not send reminder for {Reference}", booking.BookingReference); }
        }

        var utcDateTime = utcNow.UtcDateTime;
        var upcoming = await db.Bookings.Include(x => x.Court)
            .Where(x => x.Status != BookingStatus.Cancelled && x.Status != BookingStatus.Completed && x.BookingDate >= DateOnly.FromDateTime(localNow.DateTime))
            .ToListAsync(token);
        foreach (var booking in upcoming)
        {
            var startsLocal = booking.BookingDate.ToDateTime(booking.StartTime);
            var minutesUntilStart = (startsLocal - localNow.DateTime).TotalMinutes;
            var expiresAtUtc = new DateTimeOffset(startsLocal.AddHours(1), TimeSpan.FromHours(8)).UtcDateTime;

            if (minutesUntilStart is > 5 and <= 10 &&
                !await db.Notifications.AnyAsync(x => x.BookingId == booking.Id && x.Title == "Schedule starts in 10 minutes", token))
            {
                db.Notifications.Add(new TDK.Domain.Entities.Notification
                {
                    BookingId = booking.Id,
                    Title = "Schedule starts in 10 minutes",
                    Message = $"{booking.CustomerName} · {booking.Court.Name} · {booking.StartTime:h:mm tt}",
                    CreatedAt = utcDateTime,
                    ExpiresAt = expiresAtUtc
                });
            }

            var remainingBalance = Math.Max(0, booking.TotalAmount - booking.AmountPaid);
            if (remainingBalance > 0 && minutesUntilStart is > 50 and <= 60 &&
                !await db.Notifications.AnyAsync(x => x.BookingId == booking.Id && x.Title == "Balance due before schedule", token))
            {
                db.Notifications.Add(new TDK.Domain.Entities.Notification
                {
                    BookingId = booking.Id,
                    Title = "Balance due before schedule",
                    Message = $"{booking.CustomerName} has ₱{remainingBalance:N2} remaining · starts in 1 hour",
                    CreatedAt = utcDateTime,
                    ExpiresAt = expiresAtUtc
                });
            }
        }

        await db.SaveChangesAsync(token);
        await db.Notifications.Where(x => x.ExpiresAt <= utcDateTime ||
            (x.BookingId.HasValue && !db.Bookings.Any(booking => booking.Id == x.BookingId && booking.Status != BookingStatus.Cancelled && booking.Status != BookingStatus.Completed)))
            .ExecuteDeleteAsync(token);
        var overflowIds = await db.Notifications.OrderByDescending(x => x.CreatedAt).ThenByDescending(x => x.Id)
            .Skip(10).Select(x => x.Id).ToListAsync(token);
        if (overflowIds.Count > 0)
            await db.Notifications.Where(x => overflowIds.Contains(x.Id)).ExecuteDeleteAsync(token);
        await db.SaveChangesAsync(token);
    }
}
