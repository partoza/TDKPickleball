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

    public MaintenanceHostedService(IServiceScopeFactory scopeFactory, ILogger<MaintenanceHostedService> logger)
    {
        _scopeFactory = scopeFactory; _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try { await RunAsync(stoppingToken); }
            catch (Exception ex) { _logger.LogError(ex, "Scheduled retention/reminder maintenance failed"); }
            await Task.Delay(TimeSpan.FromMinutes(15), stoppingToken);
        }
    }

    private async Task RunAsync(CancellationToken token)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TdkDbContext>();
        var email = scope.ServiceProvider.GetRequiredService<IEmailService>();
        var utcNow = DateTime.UtcNow;
        var localNow = utcNow.AddHours(8);
        var reminderFrom = localNow.AddMinutes(45);
        var reminderTo = localNow.AddMinutes(75);

        var candidates = await db.Bookings.Include(x => x.Court)
            .Where(x => x.ReminderSentAt == null && x.Status != BookingStatus.Cancelled && x.Status != BookingStatus.Completed && x.BookingDate >= DateOnly.FromDateTime(localNow))
            .ToListAsync(token);
        foreach (var booking in candidates)
        {
            var starts = booking.BookingDate.ToDateTime(booking.StartTime);
            if (starts < reminderFrom || starts > reminderTo) continue;
            try { await email.SendBookingReminderAsync(booking, booking.Court.Name, token); booking.ReminderSentAt = utcNow; }
            catch (Exception ex) { _logger.LogWarning(ex, "Could not send reminder for {Reference}", booking.BookingReference); }
        }

        var bookingCutoff = DateOnly.FromDateTime(localNow.AddDays(-60));
        var expiredBookingIds = await db.Bookings.Where(x => x.BookingDate < bookingCutoff).Select(x => x.Id).ToListAsync(token);
        await db.Schedules.Where(x => x.ScheduleDate < bookingCutoff || (x.BookingId.HasValue && expiredBookingIds.Contains(x.BookingId.Value))).ExecuteDeleteAsync(token);
        await db.Bookings.Where(x => expiredBookingIds.Contains(x.Id)).ExecuteDeleteAsync(token);
        await db.Notifications.Where(x => x.ExpiresAt <= utcNow || x.CreatedAt < utcNow.AddDays(-10)).ExecuteDeleteAsync(token);
        await db.SaveChangesAsync(token);
    }
}
