using TDK.Application.DTOs.Common;
using TDK.Application.DTOs.Rates;
using TDK.Application.Interfaces;
using TDK.Domain.Entities;
using TDK.Domain.Interfaces;
using TDK.Domain.Enums;

namespace TDK.Application.Services;

public class RateService : IRateService
{
    private const int MaximumRates = 20;
    private readonly IRepository<Rate> _rateRepo;

    public RateService(IRepository<Rate> rateRepo)
    {
        _rateRepo = rateRepo;
    }

    public async Task<ApiResponse<IEnumerable<RateDto>>> GetAllAsync()
    {
        var rates = await _rateRepo.GetAllAsync();
        return ApiResponse<IEnumerable<RateDto>>.Ok(rates.OrderBy(r => r.RateType).ThenBy(r => r.StartTime).Select(r => new RateDto(r.Id, r.StartTime, r.EndTime, r.PricePerHour, r.RateType, r.IsActive)));
    }

    public async Task<ApiResponse<RateDto>> CreateAsync(CreateRateRequest request)
    {
        if (!Enum.IsDefined(request.RateType)) return ApiResponse<RateDto>.Fail("Choose a valid rate type");
        var allRates = (await _rateRepo.GetAllAsync()).ToList();
        if (allRates.Count >= MaximumRates) return ApiResponse<RateDto>.Fail("The maximum of 20 rates has been reached");
        if (request.RateType != RateType.Internal && (request.PricePerHour <= 0 || request.PricePerHour > 1_000_000m)) return ApiResponse<RateDto>.Fail("Hourly rate must be between ₱0.01 and ₱1,000,000");
        if (!IsAtLeastOneHour(request.StartTime, request.EndTime)) return ApiResponse<RateDto>.Fail("End time must be at least 1 hour after start time");
        var conflict = await HasConflictAsync(request.StartTime, request.EndTime, request.RateType);
        if (conflict) return ApiResponse<RateDto>.Fail("This rate overlaps an existing active time range");
        var rate = new Rate
        {
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            PricePerHour = request.RateType == RateType.Internal ? 0 : request.PricePerHour,
            RateType = request.RateType,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _rateRepo.AddAsync(rate);
        await _rateRepo.SaveChangesAsync();
        return ApiResponse<RateDto>.Ok(new RateDto(rate.Id, rate.StartTime, rate.EndTime, rate.PricePerHour, rate.RateType, rate.IsActive));
    }

    public async Task<ApiResponse<RateDto>> UpdateAsync(int id, UpdateRateRequest request)
    {
        var rate = await _rateRepo.GetByIdAsync(id);
        if (rate == null) return ApiResponse<RateDto>.Fail("Rate not found");
        if (!Enum.IsDefined(request.RateType)) return ApiResponse<RateDto>.Fail("Choose a valid rate type");
        if (request.RateType != RateType.Internal && (request.PricePerHour <= 0 || request.PricePerHour > 1_000_000m)) return ApiResponse<RateDto>.Fail("Hourly rate must be between ₱0.01 and ₱1,000,000");
        if (!IsAtLeastOneHour(request.StartTime, request.EndTime)) return ApiResponse<RateDto>.Fail("End time must be at least 1 hour after start time");
        if (request.IsActive && await HasConflictAsync(request.StartTime, request.EndTime, request.RateType, id)) return ApiResponse<RateDto>.Fail("This rate overlaps an existing active time range for the selected type");
        
        rate.StartTime = request.StartTime;
        rate.EndTime = request.EndTime;
        rate.PricePerHour = request.RateType == RateType.Internal ? 0 : request.PricePerHour;
        rate.RateType = request.RateType;
        rate.IsActive = request.IsActive;
        rate.UpdatedAt = DateTime.UtcNow;

        _rateRepo.Update(rate);
        await _rateRepo.SaveChangesAsync();
        return ApiResponse<RateDto>.Ok(new RateDto(rate.Id, rate.StartTime, rate.EndTime, rate.PricePerHour, rate.RateType, rate.IsActive));
    }

    public async Task<ApiResponse<bool>> DeleteAsync(int id)
    {
        var rate = await _rateRepo.GetByIdAsync(id);
        if (rate == null) return ApiResponse<bool>.Fail("Rate not found");
        if (rate.IsActive) return ApiResponse<bool>.Fail("Disable the rate before deleting it");
        _rateRepo.Delete(rate);
        await _rateRepo.SaveChangesAsync();
        return ApiResponse<bool>.Ok(true, "Inactive rate deleted");
    }

    public async Task<decimal> CalculateRateAsync(TimeOnly startTime, TimeOnly endTime, RateType rateType = RateType.Booking)
    {
        if (rateType == RateType.Internal) return 0;
        var rates = (await _rateRepo.GetAllAsync()).Where(r => r.IsActive && r.RateType == rateType).OrderBy(r => r.StartTime).ToList();
        decimal total = 0;
        var startMinutes = startTime.Hour * 60 + startTime.Minute;
        var endMinutes = endTime == TimeOnly.MinValue ? 1440 : endTime.Hour * 60 + endTime.Minute;
        var cursor = startMinutes;
        while (cursor < endMinutes)
        {
            var rate = rates.FirstOrDefault(r => r.StartTime.Hour * 60 + r.StartTime.Minute <= cursor && (r.EndTime == TimeOnly.MinValue ? 1440 : r.EndTime.Hour * 60 + r.EndTime.Minute) > cursor);
            if (rate is null) return 0;
            var rateEnd = rate.EndTime == TimeOnly.MinValue ? 1440 : rate.EndTime.Hour * 60 + rate.EndTime.Minute;
            var segmentEnd = Math.Min(endMinutes, rateEnd);
            total += rate.PricePerHour * (segmentEnd - cursor) / 60m;
            cursor = segmentEnd;
        }
        return total;
    }

    private async Task<bool> HasConflictAsync(TimeOnly start, TimeOnly end, RateType rateType, int? excludedId = null)
    {
        var newStart = start.Hour * 60 + start.Minute;
        var newEnd = end == TimeOnly.MinValue ? 1440 : end.Hour * 60 + end.Minute;
        if (newEnd - newStart < 60) return true;
        return (await _rateRepo.GetAllAsync()).Any(r => r.IsActive && r.Id != excludedId && r.RateType == rateType &&
            newStart < (r.EndTime == TimeOnly.MinValue ? 1440 : r.EndTime.Hour * 60 + r.EndTime.Minute) &&
            (r.StartTime.Hour * 60 + r.StartTime.Minute) < newEnd);
    }

    private static bool IsAtLeastOneHour(TimeOnly start, TimeOnly end) =>
        start != end && (end == TimeOnly.MinValue ? 1440 : end.Hour * 60 + end.Minute) - (start.Hour * 60 + start.Minute) >= 60;
}
