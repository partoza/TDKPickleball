using System.Security.Cryptography;
using TDK.Application.DTOs.Bookings;
using TDK.Application.DTOs.Common;
using TDK.Application.DTOs.Schedules;
using TDK.Application.Interfaces;
using TDK.Domain.Entities;
using TDK.Domain.Enums;
using TDK.Domain.Interfaces;

namespace TDK.Application.Services;

public class BookingService : IBookingService
{
    private readonly IRepository<Booking> _bookings;
    private readonly IRepository<Schedule> _schedules;
    private readonly IRepository<TimeSlot> _timeSlots;
    private readonly IRepository<Court> _courts;
    private readonly IRepository<Notification> _notifications;
    private readonly IRateService _rates;
    private readonly IEmailService _email;

    public BookingService(IRepository<Booking> bookings, IRepository<Schedule> schedules, IRepository<TimeSlot> timeSlots, IRepository<Court> courts, IRepository<Notification> notifications, IRateService rates, IEmailService email)
    {
        _bookings = bookings; _schedules = schedules; _timeSlots = timeSlots; _courts = courts;
        _notifications = notifications; _rates = rates; _email = email;
    }

    public async Task<ApiResponse<BookingAvailabilityDto>> GetAvailabilityAsync(DateOnly date, int courtId)
    {
        var court = await _courts.GetByIdAsync(courtId);
        if (court is null || !court.IsActive) return ApiResponse<BookingAvailabilityDto>.Fail("Court is not available");
        var slots = await _timeSlots.GetAllAsync();
        var schedules = await _schedules.FindAsync(s => s.ScheduleDate == date && s.CourtId == courtId);
        var operatingSlots = slots.Where(s => s.IsActive && IsWithinCourtHours(s, court)).OrderBy(s => s.SortOrder).ToList();
        var occupiedSlotIds = schedules.Where(s => s.Status != ScheduleStatus.Available).Select(s => s.TimeSlotId).ToHashSet();
        var available = operatingSlots.Where(s => !occupiedSlotIds.Contains(s.Id))
            .Select(s => new TimeSlotDto(s.Id, s.StartTime, s.EndTime, s.DisplayName)).ToList();
        var occupied = operatingSlots.Where(s => occupiedSlotIds.Contains(s.Id))
            .Select(s => new TimeSlotDto(s.Id, s.StartTime, s.EndTime, s.DisplayName)).ToList();
        return ApiResponse<BookingAvailabilityDto>.Ok(new(date, courtId, available, occupied));
    }

    public async Task<ApiResponse<BookingDto>> CreateAsync(CreateBookingRequest request)
    {
        var conflict = await ValidateSlotAsync(request.CourtId, request.BookingDate, request.StartTime, request.EndTime);
        if (conflict is not null) return ApiResponse<BookingDto>.Fail(conflict);
        var court = await _courts.GetByIdAsync(request.CourtId);
        if (court is null) return ApiResponse<BookingDto>.Fail("Court not found");
        var total = await _rates.CalculateRateAsync(request.StartTime, request.EndTime, request.RateType);
        if (total <= 0) return ApiResponse<BookingDto>.Fail("No active rate covers the selected time");
        var paid = Math.Clamp(request.AmountPaid, 0, total);
        var booking = new Booking {
            BookingReference = await GenerateReferenceAsync(), CourtId = request.CourtId,
            CustomerName = request.CustomerName.Trim(), Email = request.Email?.Trim() ?? "", Phone = request.Phone?.Trim(),
            BookingDate = request.BookingDate, StartTime = request.StartTime, EndTime = request.EndTime,
            TotalAmount = total, AmountPaid = paid, Status = paid >= total ? BookingStatus.Paid : BookingStatus.Reserved,
            Notes = request.Notes?.Trim(), CreatedAt = DateTime.UtcNow
        };
        await _bookings.AddAsync(booking); await _bookings.SaveChangesAsync();
        await AssignScheduleAsync(booking, request.RateType); await AddNotificationAsync(booking, court.Name); await TrySendConfirmationAsync(booking, court.Name);
        return ApiResponse<BookingDto>.Ok(ToDto(booking, court.Name, request.RateType), "Booking created");
    }

    public async Task<ApiResponse<IEnumerable<BookingDto>>> GetAllAsync()
    {
        var courts = (await _courts.GetAllAsync()).ToDictionary(x => x.Id, x => x.Name);
        var bookingList = (await _bookings.GetAllAsync()).OrderByDescending(x => x.CreatedAt).ToList();
        var bookingIds = bookingList.Select(x => x.Id).ToHashSet();
        var trainingIds = (await _schedules.GetAllAsync()).Where(x => x.BookingId.HasValue && bookingIds.Contains(x.BookingId.Value) && x.Status == ScheduleStatus.Training).Select(x => x.BookingId!.Value).ToHashSet();
        var values = bookingList.Select(x => ToDto(x, courts.GetValueOrDefault(x.CourtId, "Court"), trainingIds.Contains(x.Id) ? RateType.Training : RateType.Booking));
        return ApiResponse<IEnumerable<BookingDto>>.Ok(values);
    }

    public async Task<ApiResponse<BookingDto>> GetByIdAsync(long id)
    {
        var b = await _bookings.GetByIdAsync(id);
        if (b is null) return ApiResponse<BookingDto>.Fail("Booking not found");
        return ApiResponse<BookingDto>.Ok(ToDto(b, (await _courts.GetByIdAsync(b.CourtId))?.Name ?? "Court", await GetRateTypeAsync(id)));
    }

    public async Task<ApiResponse<BookingDto>> VerifyAsync(string bookingReference)
    {
        var normalized = bookingReference.Trim().ToUpperInvariant();
        var b = (await _bookings.FindAsync(x => x.BookingReference == normalized)).FirstOrDefault();
        if (b is null || b.Status == BookingStatus.Cancelled) return ApiResponse<BookingDto>.Fail("Booking reference is invalid or cancelled");
        return ApiResponse<BookingDto>.Ok(ToDto(b, (await _courts.GetByIdAsync(b.CourtId))?.Name ?? "Court", await GetRateTypeAsync(b.Id)), "Valid booking");
    }

    public async Task<ApiResponse<BookingDto>> UpdateAsync(long id, UpdateBookingRequest request)
    {
        var b = await _bookings.GetByIdAsync(id);
        if (b is null) return ApiResponse<BookingDto>.Fail("Booking not found");
        var rateType = await GetRateTypeAsync(id);
        var moved = b.CourtId != request.CourtId || b.BookingDate != request.BookingDate || b.StartTime != request.StartTime || b.EndTime != request.EndTime;
        if (moved) {
            var conflict = await ValidateSlotAsync(request.CourtId, request.BookingDate, request.StartTime, request.EndTime, id);
            if (conflict is not null) return ApiResponse<BookingDto>.Fail(conflict);
            await ReleaseScheduleAsync(id);
        }
        b.CourtId = request.CourtId; b.BookingDate = request.BookingDate; b.StartTime = request.StartTime; b.EndTime = request.EndTime;
        b.CustomerName = request.CustomerName.Trim(); b.Email = request.Email?.Trim() ?? ""; b.Phone = request.Phone?.Trim(); b.Notes = request.Notes?.Trim();
        b.TotalAmount = await _rates.CalculateRateAsync(request.StartTime, request.EndTime, rateType); b.AmountPaid = Math.Clamp(request.AmountPaid, 0, b.TotalAmount);
        b.Status = request.Status; b.UpdatedAt = DateTime.UtcNow; _bookings.Update(b); await _bookings.SaveChangesAsync();
        if (moved) await AssignScheduleAsync(b, rateType);
        return ApiResponse<BookingDto>.Ok(ToDto(b, (await _courts.GetByIdAsync(b.CourtId))?.Name ?? "Court", rateType), "Booking updated");
    }

    public async Task<ApiResponse<BookingDto>> RescheduleAsync(long id, RescheduleBookingRequest request)
    {
        var b = await _bookings.GetByIdAsync(id);
        if (b is null) return ApiResponse<BookingDto>.Fail("Booking not found");
        if (b.Status is BookingStatus.Cancelled or BookingStatus.Completed) return ApiResponse<BookingDto>.Fail("This booking can no longer be rescheduled");
        var rateType = await GetRateTypeAsync(id);
        var conflict = await ValidateSlotAsync(request.CourtId, request.BookingDate, request.StartTime, request.EndTime, id);
        if (conflict is not null) return ApiResponse<BookingDto>.Fail(conflict);
        await ReleaseScheduleAsync(id);
        b.CourtId = request.CourtId; b.BookingDate = request.BookingDate; b.StartTime = request.StartTime; b.EndTime = request.EndTime;
        b.TotalAmount = await _rates.CalculateRateAsync(request.StartTime, request.EndTime, rateType); b.UpdatedAt = DateTime.UtcNow; b.ReminderSentAt = null;
        b.Status = b.AmountPaid >= b.TotalAmount ? BookingStatus.Paid : BookingStatus.Reserved;
        _bookings.Update(b); await _bookings.SaveChangesAsync(); await AssignScheduleAsync(b, rateType);
        var courtName = (await _courts.GetByIdAsync(b.CourtId))?.Name ?? "Court"; await TrySendConfirmationAsync(b, courtName);
        return ApiResponse<BookingDto>.Ok(ToDto(b, courtName, rateType), "Booking rescheduled");
    }

    public async Task<ApiResponse<bool>> ConfirmAsync(long id)
    {
        var booking = await _bookings.GetByIdAsync(id);
        if (booking is null) return ApiResponse<bool>.Fail("Booking not found");
        if (booking.Status != BookingStatus.Reserved) return ApiResponse<bool>.Fail("Only reservations can be marked as paid");
        return await SetStatusAsync(id, BookingStatus.Paid);
    }
    public Task<ApiResponse<bool>> CompleteAsync(long id) => SetStatusAsync(id, BookingStatus.Completed);

    public async Task<ApiResponse<bool>> CancelAsync(long id)
    {
        var booking = await _bookings.GetByIdAsync(id);
        if (booking is null) return ApiResponse<bool>.Fail("Booking not found");
        if (booking.Status != BookingStatus.Reserved) return ApiResponse<bool>.Fail("Only reservations can be cancelled");
        var result = await SetStatusAsync(id, BookingStatus.Cancelled);
        if (result.Success) await ReleaseScheduleAsync(id);
        return result;
    }

    public async Task<ApiResponse<bool>> DeleteAsync(long id)
    {
        var booking = await _bookings.GetByIdAsync(id);
        if (booking is null) return ApiResponse<bool>.Fail("Booking not found");
        if (booking.Status != BookingStatus.Cancelled) return ApiResponse<bool>.Fail("Only cancelled bookings can be deleted");
        await ReleaseScheduleAsync(id);
        foreach (var notification in await _notifications.FindAsync(x => x.BookingId == id)) _notifications.Delete(notification);
        await _notifications.SaveChangesAsync();
        _bookings.Delete(booking);
        await _bookings.SaveChangesAsync();
        return ApiResponse<bool>.Ok(true, "Booking permanently deleted");
    }

    public async Task<ApiResponse<bool>> AttachReceiptAsync(long id, string fileName, string contentType)
    {
        var booking = await _bookings.GetByIdAsync(id);
        if (booking is null) return ApiResponse<bool>.Fail("Booking not found");
        booking.ReceiptFileName = fileName;
        booking.ReceiptContentType = contentType;
        booking.UpdatedAt = DateTime.UtcNow;
        _bookings.Update(booking);
        await _bookings.SaveChangesAsync();
        return ApiResponse<bool>.Ok(true);
    }

    public async Task<ApiResponse<ReceiptInfoDto>> GetReceiptInfoAsync(long id)
    {
        var booking = await _bookings.GetByIdAsync(id);
        if (booking is null || string.IsNullOrWhiteSpace(booking.ReceiptFileName)) return ApiResponse<ReceiptInfoDto>.Fail("Receipt not found");
        return ApiResponse<ReceiptInfoDto>.Ok(new(booking.ReceiptFileName, booking.ReceiptContentType ?? "application/octet-stream"));
    }

    private async Task<ApiResponse<bool>> SetStatusAsync(long id, BookingStatus status)
    {
        var b = await _bookings.GetByIdAsync(id);
        if (b is null) return ApiResponse<bool>.Fail("Booking not found");
        b.Status = status; if (status == BookingStatus.Paid) b.AmountPaid = b.TotalAmount;
        b.UpdatedAt = DateTime.UtcNow; _bookings.Update(b); await _bookings.SaveChangesAsync(); return ApiResponse<bool>.Ok(true);
    }

    private async Task<string?> ValidateSlotAsync(int courtId, DateOnly date, TimeOnly start, TimeOnly end, long? excludedBookingId = null)
    {
        if (date < DateOnly.FromDateTime(DateTime.Today)) return "Booking date cannot be in the past";
        if (end != TimeOnly.MinValue && start >= end) return "End time must be after start time";
        var court = await _courts.GetByIdAsync(courtId);
        if (court is null || !court.IsActive) return "Court is not active";
        var startMinutes = Minutes(start, false); var endMinutes = Minutes(end, true);
        var slots = (await _timeSlots.GetAllAsync()).Where(t => t.IsActive && Minutes(t.StartTime, false) >= startMinutes && Minutes(t.EndTime, true) <= endMinutes).OrderBy(t => t.SortOrder).ToList();
        if (slots.Count == 0 || slots.First().StartTime != start || slots.Last().EndTime != end) return "Select complete configured time slots";
        if (slots.Any(s => !IsWithinCourtHours(s, court))) return "Selected time is outside the court schedule";
        var ids = slots.Select(x => x.Id).ToHashSet();
        var occupied = await _schedules.FindAsync(s => s.CourtId == courtId && s.ScheduleDate == date && ids.Contains(s.TimeSlotId) && s.Status != ScheduleStatus.Available && (!excludedBookingId.HasValue || s.BookingId != excludedBookingId));
        return occupied.Any() ? "One or more selected time slots are no longer available" : null;
    }

    private async Task AssignScheduleAsync(Booking b, RateType rateType = RateType.Booking)
    {
        var scheduleStatus = rateType == RateType.Training ? ScheduleStatus.Training : ScheduleStatus.Booked;
        var startMinutes = Minutes(b.StartTime, false); var endMinutes = Minutes(b.EndTime, true);
        var slots = (await _timeSlots.GetAllAsync()).Where(t => Minutes(t.StartTime, false) >= startMinutes && Minutes(t.EndTime, true) <= endMinutes).ToList();
        foreach (var slot in slots) {
            var s = (await _schedules.FindAsync(x => x.CourtId == b.CourtId && x.ScheduleDate == b.BookingDate && x.TimeSlotId == slot.Id)).FirstOrDefault();
            if (s is null) await _schedules.AddAsync(new Schedule { CourtId = b.CourtId, ScheduleDate = b.BookingDate, TimeSlotId = slot.Id, Status = scheduleStatus, BookingId = b.Id, Notes = b.Notes, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
            else { s.Status = scheduleStatus; s.BookingId = b.Id; s.Notes = b.Notes; s.UpdatedAt = DateTime.UtcNow; _schedules.Update(s); }
        }
        await _schedules.SaveChangesAsync();
    }

    private async Task ReleaseScheduleAsync(long bookingId)
    {
        foreach (var s in await _schedules.FindAsync(x => x.BookingId == bookingId)) _schedules.Delete(s);
        await _schedules.SaveChangesAsync();
    }

    private async Task<string> GenerateReferenceAsync()
    {
        for (var attempt = 0; attempt < 20; attempt++) { var value = $"TDK-{RandomNumberGenerator.GetInt32(0, 10_000_000):D7}"; if (!(await _bookings.FindAsync(x => x.BookingReference == value)).Any()) return value; }
        throw new InvalidOperationException("Unable to allocate a unique booking reference");
    }

    private async Task AddNotificationAsync(Booking b, string courtName)
    {
        await _notifications.AddAsync(new Notification { BookingId = b.Id, Title = "Upcoming booking", Message = $"{b.CustomerName} · {courtName} · {b.BookingDate:MMM d} {b.StartTime:h:mm tt}", CreatedAt = DateTime.UtcNow, ExpiresAt = DateTime.UtcNow.AddDays(10) });
        await _notifications.SaveChangesAsync();
    }

    private async Task<RateType> GetRateTypeAsync(long bookingId) =>
        (await _schedules.FindAsync(x => x.BookingId == bookingId)).Any(x => x.Status == ScheduleStatus.Training)
            ? RateType.Training
            : RateType.Booking;

    private async Task TrySendConfirmationAsync(Booking b, string courtName) { try { await _email.SendBookingConfirmationAsync(b, courtName); } catch { } }
    private static bool IsWithinCourtHours(TimeSlot slot, Court court) => slot.StartTime >= court.OpenTime && (court.CloseTime == TimeOnly.MinValue || slot.EndTime <= court.CloseTime);
    private static int Minutes(TimeOnly value, bool midnightAsEnd) => value == TimeOnly.MinValue && midnightAsEnd ? 1440 : value.Hour * 60 + value.Minute;
    private static BookingDto ToDto(Booking b, string court, RateType bookingType = RateType.Booking) => new(b.Id, b.BookingReference, b.CourtId, court, b.CustomerName, b.Email, b.Phone, b.BookingDate, b.StartTime, b.EndTime, b.TotalAmount, b.AmountPaid, Math.Max(0, b.TotalAmount - b.AmountPaid), b.Status, b.Notes, b.CreatedAt, bookingType, !string.IsNullOrWhiteSpace(b.ReceiptFileName));
}
