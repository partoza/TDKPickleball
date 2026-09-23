using Microsoft.EntityFrameworkCore;
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
    private const decimal LimitMegabytes = 1024m;
    private const decimal WarningThresholdMegabytes = 900m;
    private static readonly SemaphoreSlim CleanupLock = new(1, 1);
    private readonly TdkDbContext _context;
    private readonly IBusinessClock _clock;

    public StorageManagementService(TdkDbContext context, IBusinessClock clock)
    {
        _context = context;
        _clock = clock;
    }

    public async Task<ApiResponse<StorageStatusDto>> GetStatusAsync(CancellationToken cancellationToken = default)
    {
        var used = await _context.Database.SqlQueryRaw<decimal>(
            "SELECT COALESCE(SUM(CONVERT(decimal(20,2), FILEPROPERTY([name], 'SpaceUsed'))) * 8 / 1024, 0) AS [Value] FROM sys.database_files WHERE [type] = 0")
            .SingleAsync(cancellationToken);
        used = decimal.Round(used, 2);
        var completedCount = await _context.Bookings.CountAsync(x => x.Status == BookingStatus.Completed, cancellationToken);
        return ApiResponse<StorageStatusDto>.Ok(new(
            used,
            LimitMegabytes,
            WarningThresholdMegabytes,
            decimal.Round(Math.Min(100m, used / LimitMegabytes * 100m), 1),
            used < WarningThresholdMegabytes,
            completedCount,
            _clock.UtcNow.UtcDateTime));
    }

    public async Task<ApiResponse<BookingCleanupPreviewDto>> GetCleanupPreviewAsync(DateOnly fromDate, DateOnly throughDate, CancellationToken cancellationToken = default)
    {
        var validationError = ValidateRange(fromDate, throughDate);
        if (validationError is not null)
            return ApiResponse<BookingCleanupPreviewDto>.Fail(validationError);

        var query = _context.Bookings.AsNoTracking()
            .Where(x => x.Status == BookingStatus.Completed && x.BookingDate >= fromDate && x.BookingDate <= throughDate);
        var count = await query.CountAsync(cancellationToken);
        var receiptCount = await query.CountAsync(x => x.ReceiptFileName != null, cancellationToken);
        var oldest = await query.Select(x => (DateOnly?)x.BookingDate).MinAsync(cancellationToken);
        return ApiResponse<BookingCleanupPreviewDto>.Ok(new(fromDate, throughDate, count, receiptCount, oldest));
    }

    public async Task<ApiResponse<IReadOnlyList<BookingCleanupHistoryDto>>> GetCleanupHistoryAsync(CancellationToken cancellationToken = default)
    {
        var history = await _context.BookingCleanupAudits.AsNoTracking()
            .OrderByDescending(x => x.DeletedAtUtc)
            .Take(100)
            .Select(x => new BookingCleanupHistoryDto(
                x.Id, x.SelectedFromDate, x.DeletedThroughDate, x.OldestBookingDate, x.DeletedBookingCount,
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
            var bookings = _context.Bookings
                .Where(x => x.Status == BookingStatus.Completed && x.BookingDate >= request.FromDate && x.BookingDate <= request.ThroughDate);
            var bookingCount = await bookings.CountAsync(cancellationToken);

            if (bookingCount == 0)
                return ApiResponse<BookingCleanupResultDto>.Fail("No completed bookings match the selected date");

            var oldestBookingDate = await bookings.MinAsync(x => x.BookingDate, cancellationToken);
            var receiptFileNames = await bookings
                .Select(x => x.ReceiptFileName)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Select(x => x!)
                .Distinct()
                .ToArrayAsync(cancellationToken);
            var deletedCount = await bookings.ExecuteDeleteAsync(cancellationToken);
            var audit = new BookingCleanupAudit
            {
                SelectedFromDate = request.FromDate,
                DeletedThroughDate = request.ThroughDate,
                OldestBookingDate = oldestBookingDate,
                DeletedBookingCount = deletedCount,
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
                audit.Id, audit.SelectedFromDate, audit.DeletedThroughDate, audit.OldestBookingDate, audit.DeletedBookingCount,
                audit.DeletedReceiptCount, audit.DeletedByName, audit.DeletedByEmail, audit.DeletedAtUtc);
            return ApiResponse<BookingCleanupResultDto>.Ok(new()
            {
                DeletedBookingCount = deletedCount,
                DeletedReceiptCount = receiptFileNames.Length,
                FromDate = request.FromDate,
                ThroughDate = request.ThroughDate,
                ReceiptFileNames = receiptFileNames,
                Audit = auditDto
            }, $"Permanently deleted {deletedCount} completed booking{(deletedCount == 1 ? "" : "s")}");
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
}
