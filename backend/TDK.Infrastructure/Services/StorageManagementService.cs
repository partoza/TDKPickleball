using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Data;
using TDK.Application.DTOs.Common;
using TDK.Application.DTOs.Storage;
using TDK.Application.Interfaces;
using TDK.Domain.Entities;
using TDK.Domain.Enums;
using TDK.Infrastructure.Data;

namespace TDK.Infrastructure.Services;

public sealed class StorageManagementService : IStorageManagementService
{
    private const decimal LimitMegabytes = 5120m;
    private const decimal WarningThresholdMegabytes = 4096m;
    private static readonly SemaphoreSlim CleanupLock = new(1, 1);
    private readonly TdkDbContext _context;
    private readonly IBusinessClock _clock;
    private readonly ILogger<StorageManagementService> _logger;

    public StorageManagementService(TdkDbContext context, IBusinessClock clock, ILogger<StorageManagementService> logger)
    {
        _context = context;
        _clock = clock;
        _logger = logger;
    }

    public async Task<ApiResponse<StorageStatusDto>> GetStatusAsync(CancellationToken cancellationToken = default)
    {
        var (used, measurementAvailable) = await GetUsedStorageAsync(cancellationToken);
        var manilaNow = _clock.ToManilaTime(_clock.UtcNow);
        var today = DateOnly.FromDateTime(manilaNow.DateTime);
        var currentTime = TimeOnly.FromDateTime(manilaNow.DateTime);
        var eligibleScheduleCount = await EligibleSchedules(today, currentTime)
            .CountAsync(cancellationToken);
        return ApiResponse<StorageStatusDto>.Ok(new(
            used,
            LimitMegabytes,
            WarningThresholdMegabytes,
            decimal.Round(Math.Min(100m, used / LimitMegabytes * 100m), 1),
            used < WarningThresholdMegabytes,
            measurementAvailable,
            eligibleScheduleCount,
            _clock.UtcNow.UtcDateTime));
    }

    public async Task<ApiResponse<BookingCleanupPreviewDto>> GetCleanupPreviewAsync(DateOnly fromDate, DateOnly throughDate, CancellationToken cancellationToken = default)
    {
        var validationError = ValidateRange(fromDate, throughDate);
        if (validationError is not null)
            return ApiResponse<BookingCleanupPreviewDto>.Fail(validationError);

        var manilaNow = _clock.ToManilaTime(_clock.UtcNow);
        var today = DateOnly.FromDateTime(manilaNow.DateTime);
        var currentTime = TimeOnly.FromDateTime(manilaNow.DateTime);
        var schedules = EligibleSchedules(today, currentTime)
            .Where(x => x.ScheduleDate >= fromDate && x.ScheduleDate <= throughDate);
        var bookingIds = schedules.Where(x => x.BookingId.HasValue).Select(x => x.BookingId!.Value).Distinct();
        var bookings = EligibleBookings(today, currentTime)
            .Where(x => x.BookingDate >= fromDate && x.BookingDate <= throughDate &&
                (bookingIds.Contains(x.Id) || !x.Schedules.Any()));
        var scheduleCount = await schedules.CountAsync(cancellationToken);
        var bookingCount = await bookings.CountAsync(cancellationToken);
        var receiptCount = await bookings.CountAsync(x => x.ReceiptFileName != null, cancellationToken);
        var oldestSchedule = await schedules.Select(x => (DateOnly?)x.ScheduleDate).MinAsync(cancellationToken);
        var oldestBooking = await bookings.Select(x => (DateOnly?)x.BookingDate).MinAsync(cancellationToken);
        var oldest = oldestSchedule.HasValue && oldestBooking.HasValue
            ? (oldestSchedule < oldestBooking ? oldestSchedule : oldestBooking)
            : oldestSchedule ?? oldestBooking;
        return ApiResponse<BookingCleanupPreviewDto>.Ok(new(fromDate, throughDate, scheduleCount, bookingCount, receiptCount, oldest));
    }

    public async Task<ApiResponse<IReadOnlyList<BookingCleanupHistoryDto>>> GetCleanupHistoryAsync(CancellationToken cancellationToken = default)
    {
        var history = await _context.BookingCleanupAudits.AsNoTracking()
            .OrderByDescending(x => x.DeletedAtUtc)
            .Take(100)
            .Select(x => new BookingCleanupHistoryDto(
                x.Id, x.SelectedFromDate, x.DeletedThroughDate, x.OldestBookingDate, x.DeletedBookingCount, x.DeletedScheduleCount,
                x.DeletedReceiptCount, x.DeletedByName, x.DeletedByEmail, x.DeletedAtUtc))
            .ToListAsync(cancellationToken);
        return ApiResponse<IReadOnlyList<BookingCleanupHistoryDto>>.Ok(history);
    }

    public async Task<ApiResponse<BookingCleanupResultDto>> DeleteCompletedBookingsAsync(
        BookingCleanupRequest request,
        string userId,
        string userName,
        string userEmail,
        CancellationToken cancellationToken = default)
    {
        if (!string.Equals(request.Confirmation?.Trim(), "DELETE", StringComparison.Ordinal))
            return ApiResponse<BookingCleanupResultDto>.Fail("Type DELETE to confirm permanent deletion");
        var validationError = ValidateRange(request.FromDate, request.ThroughDate);
        if (validationError is not null)
            return ApiResponse<BookingCleanupResultDto>.Fail(validationError);
        if (string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(userEmail))
            return ApiResponse<BookingCleanupResultDto>.Fail("The administrator identity could not be verified");

        await CleanupLock.WaitAsync(cancellationToken);
        try
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
            var manilaNow = _clock.ToManilaTime(_clock.UtcNow);
            var today = DateOnly.FromDateTime(manilaNow.DateTime);
            var currentTime = TimeOnly.FromDateTime(manilaNow.DateTime);
            var eligibleSchedules = EligibleSchedules(today, currentTime)
                .Where(x => x.ScheduleDate >= request.FromDate && x.ScheduleDate <= request.ThroughDate);
            var scheduleIds = await eligibleSchedules.Select(x => x.Id).ToArrayAsync(cancellationToken);
            var linkedBookingIds = await eligibleSchedules.Where(x => x.BookingId.HasValue)
                .Select(x => x.BookingId!.Value).Distinct().ToArrayAsync(cancellationToken);
            var eligibleBookingIds = await EligibleBookings(today, currentTime)
                .Where(x => x.BookingDate >= request.FromDate && x.BookingDate <= request.ThroughDate &&
                    (linkedBookingIds.Contains(x.Id) || !x.Schedules.Any()))
                .Select(x => x.Id)
                .Distinct()
                .ToArrayAsync(cancellationToken);

            if (eligibleBookingIds.Length == 0 && scheduleIds.Length == 0)
                return ApiResponse<BookingCleanupResultDto>.Fail("No eligible elapsed schedules match the selected date range");

            var oldestScheduleDate = await _context.Schedules.Where(x => scheduleIds.Contains(x.Id))
                .Select(x => (DateOnly?)x.ScheduleDate).MinAsync(cancellationToken);
            var oldestBookingDate = await _context.Bookings.Where(x => eligibleBookingIds.Contains(x.Id))
                .Select(x => (DateOnly?)x.BookingDate).MinAsync(cancellationToken);
            var oldestRecordDate = oldestScheduleDate.HasValue && oldestBookingDate.HasValue
                ? (oldestScheduleDate < oldestBookingDate ? oldestScheduleDate : oldestBookingDate)
                : oldestScheduleDate ?? oldestBookingDate;
            var receiptFileNames = await _context.Bookings.Where(x => eligibleBookingIds.Contains(x.Id))
                .Select(x => x.ReceiptFileName)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Select(x => x!)
                .Distinct()
                .ToArrayAsync(cancellationToken);
            var deletedScheduleCount = await _context.Schedules.Where(x => scheduleIds.Contains(x.Id))
                .ExecuteDeleteAsync(cancellationToken);
            var deletedCount = await _context.Bookings.Where(x => eligibleBookingIds.Contains(x.Id))
                .ExecuteDeleteAsync(cancellationToken);
            if (deletedScheduleCount != scheduleIds.Length || deletedCount != eligibleBookingIds.Length)
                throw new InvalidOperationException("Cleanup record counts changed during the transaction; no records were committed.");
            var audit = new BookingCleanupAudit
            {
                SelectedFromDate = request.FromDate,
                DeletedThroughDate = request.ThroughDate,
                OldestBookingDate = oldestRecordDate,
                DeletedBookingCount = deletedCount,
                DeletedScheduleCount = deletedScheduleCount,
                DeletedReceiptCount = receiptFileNames.Length,
                DeletedByUserId = userId,
                DeletedByName = string.IsNullOrWhiteSpace(userName) ? userEmail : userName.Trim(),
                DeletedByEmail = userEmail.Trim().ToLowerInvariant(),
                DeletedAtUtc = _clock.UtcNow.UtcDateTime
            };

            _context.BookingCleanupAudits.Add(audit);
            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            var auditDto = new BookingCleanupHistoryDto(
                audit.Id, audit.SelectedFromDate, audit.DeletedThroughDate, audit.OldestBookingDate, audit.DeletedBookingCount, audit.DeletedScheduleCount,
                audit.DeletedReceiptCount, audit.DeletedByName, audit.DeletedByEmail, audit.DeletedAtUtc);
            return ApiResponse<BookingCleanupResultDto>.Ok(new()
            {
                DeletedBookingCount = deletedCount,
                DeletedScheduleCount = deletedScheduleCount,
                DeletedReceiptCount = receiptFileNames.Length,
                FromDate = request.FromDate,
                ThroughDate = request.ThroughDate,
                ReceiptFileNames = receiptFileNames,
                Audit = auditDto
            }, $"Permanently deleted {deletedScheduleCount} elapsed schedule record{(deletedScheduleCount == 1 ? "" : "s")} and {deletedCount} related booking record{(deletedCount == 1 ? "" : "s")}");
        }
        finally
        {
            CleanupLock.Release();
        }
    }

    private string? ValidateRange(DateOnly fromDate, DateOnly throughDate)
    {
        if (fromDate == default || throughDate == default)
            return "Both range dates are required";
        if (fromDate > throughDate)
            return "The start date must be on or before the end date";
        if (throughDate > _clock.ManilaToday)
            return "The cleanup range cannot extend into the future";
        return null;
    }

    private async Task<(decimal UsedMegabytes, bool Available)> GetUsedStorageAsync(CancellationToken cancellationToken)
    {
        try
        {
            var used = await _context.Database.SqlQueryRaw<decimal>(
                "SELECT CAST(COALESCE(SUM(data_length + index_length) / 1024 / 1024, 0) AS DECIMAL(20,2)) AS `Value` FROM information_schema.tables WHERE table_schema = DATABASE()")
                .SingleAsync(cancellationToken);
            return (decimal.Round(used, 2), true);
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            _logger.LogWarning(exception, "The database host did not expose information_schema storage measurements; cleanup remains available");
            return (0m, false);
        }
    }

    private IQueryable<Schedule> EligibleSchedules(DateOnly today, TimeOnly currentTime) =>
        _context.Schedules.Where(schedule =>
            schedule.Status != ScheduleStatus.Available &&
            (schedule.Booking == null || schedule.Booking.Status != BookingStatus.Reserved) &&
            (schedule.ScheduleDate < today ||
                (schedule.ScheduleDate == today && schedule.TimeSlot.EndTime != TimeOnly.MinValue && schedule.TimeSlot.EndTime <= currentTime)));

    private IQueryable<Booking> EligibleBookings(DateOnly today, TimeOnly currentTime) =>
        _context.Bookings.Where(booking =>
            booking.Status != BookingStatus.Reserved &&
            (booking.Status == BookingStatus.Completed || booking.BookingDate < today ||
                (booking.BookingDate == today && booking.EndTime != TimeOnly.MinValue && booking.EndTime <= currentTime)));
}
