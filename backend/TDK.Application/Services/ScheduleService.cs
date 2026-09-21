using TDK.Application.DTOs.Common;
using TDK.Application.DTOs.Courts;
using TDK.Application.DTOs.Rates;
using TDK.Application.DTOs.Schedules;
using TDK.Application.Interfaces;
using TDK.Domain.Entities;
using TDK.Domain.Enums;
using TDK.Domain.Interfaces;

namespace TDK.Application.Services;

public class ScheduleService : IScheduleService
{
    private readonly IRepository<Schedule> _scheduleRepo;
    private readonly IRepository<Court> _courtRepo;
    private readonly IRepository<TimeSlot> _timeSlotRepo;
    private readonly IRepository<Rate> _rateRepo;
    private readonly IRepository<Booking> _bookingRepo;
    private readonly IBookingService _bookingService;

    public ScheduleService(IRepository<Schedule> scheduleRepo, IRepository<Court> courtRepo, IRepository<TimeSlot> timeSlotRepo, IRepository<Rate> rateRepo, IRepository<Booking> bookingRepo, IBookingService bookingService)
    {
        _scheduleRepo = scheduleRepo;
        _courtRepo = courtRepo;
        _timeSlotRepo = timeSlotRepo;
        _rateRepo = rateRepo;
        _bookingRepo = bookingRepo;
        _bookingService = bookingService;
    }

    public async Task<ApiResponse<ScheduleBoardDto>> GetBoardAsync(DateOnly date)
    {
        var courts = (await _courtRepo.GetAllAsync()).Where(c => c.IsActive).OrderBy(c => c.SortOrder).ToList();
        var timeSlots = (await _timeSlotRepo.GetAllAsync()).Where(t => t.IsActive).OrderBy(t => t.SortOrder).ToList();
        var rates = (await _rateRepo.GetAllAsync()).Where(r => r.IsActive).ToList();
        var schedules = (await _scheduleRepo.FindAsync(s => s.ScheduleDate == date)).ToList();
        var bookings = (await _bookingRepo.GetAllAsync()).Where(b => schedules.Any(s => s.BookingId == b.Id)).ToDictionary(b => b.Id);

        var courtDtos = new List<CourtScheduleDto>();
        foreach (var court in courts)
        {
            var courtScheds = new List<ScheduleDto>();
            foreach (var slot in timeSlots)
            {
                var existing = schedules.FirstOrDefault(s => s.CourtId == court.Id && s.TimeSlotId == slot.Id);
                if (existing != null)
                {
                    bookings.TryGetValue(existing.BookingId ?? 0, out var booking);
                    courtScheds.Add(new ScheduleDto(existing.Id, court.Id, court.Name, date, slot.Id, slot.StartTime, slot.EndTime, existing.Status, existing.Notes, existing.BookingId, booking?.BookingReference, booking?.CustomerName, booking?.Email, booking?.Phone, booking?.Status, booking?.AmountPaid ?? 0, booking?.TotalAmount ?? 0));
                }
                else
                {
                    courtScheds.Add(new ScheduleDto(0, court.Id, court.Name, date, slot.Id, slot.StartTime, slot.EndTime, ScheduleStatus.Available, null));
                }
            }
            courtDtos.Add(new CourtScheduleDto(new CourtDto(court.Id, court.Name, court.DisplayName, court.IsActive, court.SortOrder, court.OpenTime, court.CloseTime), courtScheds));
        }

        var tsDtos = timeSlots.Select(t => new TimeSlotDto(t.Id, t.StartTime, t.EndTime, t.DisplayName)).ToList();
        var rateDtos = rates.Select(r => new RateDto(r.Id, r.StartTime, r.EndTime, r.PricePerHour, r.RateType, r.IsActive)).ToList();

        return ApiResponse<ScheduleBoardDto>.Ok(new ScheduleBoardDto(courtDtos, tsDtos, rateDtos));
    }

    public async Task<ApiResponse<IEnumerable<ScheduleDto>>> GetSchedulesAsync(DateOnly date, int? courtId)
    {
        var query = (await _scheduleRepo.FindAsync(s => s.ScheduleDate == date && (!courtId.HasValue || s.CourtId == courtId.Value))).ToList();
        var slots = (await _timeSlotRepo.GetAllAsync()).ToDictionary(x => x.Id);
        var courts = (await _courtRepo.GetAllAsync()).ToDictionary(x => x.Id);
        var bookings = (await _bookingRepo.GetAllAsync()).Where(b => query.Any(s => s.BookingId == b.Id)).ToDictionary(b => b.Id);
        return ApiResponse<IEnumerable<ScheduleDto>>.Ok(query.Select(s => {
            slots.TryGetValue(s.TimeSlotId, out var slot); courts.TryGetValue(s.CourtId, out var court); bookings.TryGetValue(s.BookingId ?? 0, out var booking);
            return new ScheduleDto(s.Id, s.CourtId, court?.Name ?? "Court", s.ScheduleDate, s.TimeSlotId, slot?.StartTime ?? new(), slot?.EndTime ?? new(), s.Status, s.Notes, s.BookingId, booking?.BookingReference, booking?.CustomerName, booking?.Email, booking?.Phone, booking?.Status, booking?.AmountPaid ?? 0, booking?.TotalAmount ?? 0);
        }));
    }

    public async Task<ApiResponse<ScheduleDto>> GetByIdAsync(long id)
    {
        var s = await _scheduleRepo.GetByIdAsync(id);
        if (s == null) return ApiResponse<ScheduleDto>.Fail("Not found");
        var slot = await _timeSlotRepo.GetByIdAsync(s.TimeSlotId);
        var booking = s.BookingId.HasValue ? await _bookingRepo.GetByIdAsync(s.BookingId.Value) : null;
        return ApiResponse<ScheduleDto>.Ok(new ScheduleDto(s.Id, s.CourtId, "", s.ScheduleDate, s.TimeSlotId, slot?.StartTime ?? new(), slot?.EndTime ?? new(), s.Status, s.Notes, s.BookingId, booking?.BookingReference, booking?.CustomerName, booking?.Email, booking?.Phone, booking?.Status, booking?.AmountPaid ?? 0, booking?.TotalAmount ?? 0));
    }

    public async Task<ApiResponse<ScheduleDto>> CreateAsync(int courtId, DateOnly date, int timeSlotId)
    {
        var s = new Schedule { CourtId = courtId, ScheduleDate = date, TimeSlotId = timeSlotId, Status = ScheduleStatus.Available, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        await _scheduleRepo.AddAsync(s);
        await _scheduleRepo.SaveChangesAsync();
        return ApiResponse<ScheduleDto>.Ok(new ScheduleDto(s.Id, s.CourtId, "", s.ScheduleDate, s.TimeSlotId, new TimeOnly(), new TimeOnly(), s.Status, s.Notes));
    }

    public async Task<ApiResponse<ScheduleDto>> UpdateAsync(long id, UpdateScheduleRequest request, string userId)
    {
        var s = await _scheduleRepo.GetByIdAsync(id);
        if (s == null) return ApiResponse<ScheduleDto>.Fail("Not found");
        
        s.Status = request.Status;
        s.Notes = request.Notes;
        s.UpdatedAt = DateTime.UtcNow;
        s.UpdatedByUserId = userId;
        _scheduleRepo.Update(s);
        await _scheduleRepo.SaveChangesAsync();
        if (s.BookingId.HasValue && request.Status is ScheduleStatus.Booked or ScheduleStatus.Training)
        {
            var booking = await _bookingRepo.GetByIdAsync(s.BookingId.Value);
            if (booking != null)
            {
                booking.CustomerName = request.BookedBy?.Trim() ?? booking.CustomerName;
                booking.Email = request.Email?.Trim() ?? "";
                booking.Phone = request.Phone?.Trim();
                booking.Notes = request.Notes?.Trim();
                booking.AmountPaid = request.PaymentStatus == BookingStatus.Paid ? booking.TotalAmount : Math.Clamp(request.AmountPaid, 0, booking.TotalAmount);
                booking.Status = booking.AmountPaid >= booking.TotalAmount ? BookingStatus.Paid : BookingStatus.Reserved;
                booking.UpdatedAt = DateTime.UtcNow;
                _bookingRepo.Update(booking);
                await _bookingRepo.SaveChangesAsync();
            }
        }
        
        return ApiResponse<ScheduleDto>.Ok(new ScheduleDto(s.Id, s.CourtId, "", s.ScheduleDate, s.TimeSlotId, new TimeOnly(), new TimeOnly(), s.Status, s.Notes));
    }

    public async Task<ApiResponse<bool>> DeleteAsync(long id)
    {
        var s = await _scheduleRepo.GetByIdAsync(id);
        if (s != null)
        {
            _scheduleRepo.Delete(s);
            await _scheduleRepo.SaveChangesAsync();
        }
        return ApiResponse<bool>.Ok(true);
    }

    public async Task<ApiResponse<bool>> BulkUpdateAsync(BulkUpdateRequest request, string userId)
    {
        if (request.Status is ScheduleStatus.Booked or ScheduleStatus.Training)
        {
            var rateType = request.Status == ScheduleStatus.Training ? TDK.Domain.Enums.RateType.Training : TDK.Domain.Enums.RateType.Booking;
            var amountPaid = request.PaymentStatus == BookingStatus.Paid ? decimal.MaxValue : request.AmountPaid;
            var created = await _bookingService.CreateAsync(new(request.CourtId, request.Date, request.StartTime, request.EndTime, request.BookedBy ?? "", request.Email ?? "", request.Phone, request.Notes, amountPaid, rateType));
            if (!created.Success || created.Data is null) return ApiResponse<bool>.Fail(created.Message, created.Errors);
            if (request.Status == ScheduleStatus.Training)
            {
                foreach (var schedule in await _scheduleRepo.FindAsync(s => s.BookingId == created.Data.Id)) { schedule.Status = ScheduleStatus.Training; _scheduleRepo.Update(schedule); }
                await _scheduleRepo.SaveChangesAsync();
            }
            return ApiResponse<bool>.Ok(true);
        }
        var endMinutes = request.EndTime == TimeOnly.MinValue ? 1440 : request.EndTime.Hour * 60 + request.EndTime.Minute;
        var slots = (await _timeSlotRepo.GetAllAsync())
            .Where(t => t.StartTime >= request.StartTime && (t.EndTime == TimeOnly.MinValue ? 1440 : t.EndTime.Hour * 60 + t.EndTime.Minute) <= endMinutes)
            .ToList();
        
        foreach (var slot in slots)
        {
            var existing = (await _scheduleRepo.FindAsync(s => s.CourtId == request.CourtId && s.ScheduleDate == request.Date && s.TimeSlotId == slot.Id)).FirstOrDefault();
            if (existing != null)
            {
                existing.Status = request.Status;
                existing.Notes = request.Notes;
                existing.UpdatedByUserId = userId;
                existing.UpdatedAt = DateTime.UtcNow;
                _scheduleRepo.Update(existing);
            }
            else
            {
                await _scheduleRepo.AddAsync(new Schedule
                {
                    CourtId = request.CourtId, ScheduleDate = request.Date, TimeSlotId = slot.Id, Status = request.Status, Notes = request.Notes, UpdatedByUserId = userId, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow
                });
            }
        }
        await _scheduleRepo.SaveChangesAsync();
        return ApiResponse<bool>.Ok(true);
    }

    public async Task<ApiResponse<bool>> CopyScheduleAsync(CopyScheduleRequest request, string userId)
    {
        var sourceScheds = await _scheduleRepo.FindAsync(s => s.ScheduleDate == request.SourceDate && s.CourtId == request.CourtId);
        foreach (var s in sourceScheds)
        {
            var target = (await _scheduleRepo.FindAsync(x => x.ScheduleDate == request.TargetDate && x.CourtId == request.CourtId && x.TimeSlotId == s.TimeSlotId)).FirstOrDefault();
            if (target != null)
            {
                target.Status = s.Status;
                target.Notes = s.Notes;
                target.UpdatedByUserId = userId;
                target.UpdatedAt = DateTime.UtcNow;
                _scheduleRepo.Update(target);
            }
            else
            {
                await _scheduleRepo.AddAsync(new Schedule
                {
                    CourtId = s.CourtId, ScheduleDate = request.TargetDate, TimeSlotId = s.TimeSlotId, Status = s.Status, Notes = s.Notes, UpdatedByUserId = userId, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow
                });
            }
        }
        await _scheduleRepo.SaveChangesAsync();
        return ApiResponse<bool>.Ok(true);
    }
}
