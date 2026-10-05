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
        return ApiResponse<IEnumerable<RateDto>>.Ok(rates.OrderBy(r => r.RateType).ThenBy(r => r.StartTime).Select(ToDto));
    }

    public async Task<ApiResponse<RateDto>> CreateAsync(CreateRateRequest request)
    {
        if (!Enum.IsDefined(request.RateType)) return ApiResponse<RateDto>.Fail("Choose a valid rate type");
        var allRates = (await _rateRepo.GetAllAsync()).ToList();
        if (allRates.Count >= MaximumRates) return ApiResponse<RateDto>.Fail("The maximum of 20 rates has been reached");
        var validation = Validate(request.RateType, request.PricePerHour, request.StartTime, request.EndTime, request.ValidityDuration, request.ValidityUnit);
        if (validation is not null) return ApiResponse<RateDto>.Fail(validation);
        var conflict = await HasConflictAsync(request.StartTime, request.EndTime, request.RateType);
        if (conflict) return ApiResponse<RateDto>.Fail(request.RateType == RateType.CustomerCard ? "Only one active customer card rate is allowed" : "This rate overlaps an existing active time range");
        var rate = new Rate
        {
            StartTime = request.RateType == RateType.CustomerCard ? TimeOnly.MinValue : request.StartTime,
            EndTime = request.RateType == RateType.CustomerCard ? TimeOnly.MinValue : request.EndTime,
            PricePerHour = request.RateType == RateType.Internal ? 0 : request.PricePerHour,
            RateType = request.RateType,
            ValidityDuration = request.RateType == RateType.CustomerCard ? request.ValidityDuration : null,
            ValidityUnit = request.RateType == RateType.CustomerCard ? request.ValidityUnit : null,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _rateRepo.AddAsync(rate);
        await _rateRepo.SaveChangesAsync();
        return ApiResponse<RateDto>.Ok(ToDto(rate));
    }

    public async Task<ApiResponse<RateDto>> UpdateAsync(int id, UpdateRateRequest request)
    {
        var rate = await _rateRepo.GetByIdAsync(id);
        if (rate == null) return ApiResponse<RateDto>.Fail("Rate not found");
        if (!Enum.IsDefined(request.RateType)) return ApiResponse<RateDto>.Fail("Choose a valid rate type");
        var validation = Validate(request.RateType, request.PricePerHour, request.StartTime, request.EndTime, request.ValidityDuration, request.ValidityUnit);
        if (validation is not null) return ApiResponse<RateDto>.Fail(validation);
        if (request.IsActive && await HasConflictAsync(request.StartTime, request.EndTime, request.RateType, id)) return ApiResponse<RateDto>.Fail(request.RateType == RateType.CustomerCard ? "Only one active customer card rate is allowed" : "This rate overlaps an existing active time range for the selected type");
        
        rate.StartTime = request.RateType == RateType.CustomerCard ? TimeOnly.MinValue : request.StartTime;
        rate.EndTime = request.RateType == RateType.CustomerCard ? TimeOnly.MinValue : request.EndTime;
        rate.PricePerHour = request.RateType == RateType.Internal ? 0 : request.PricePerHour;
        rate.RateType = request.RateType;
        rate.ValidityDuration = request.RateType == RateType.CustomerCard ? request.ValidityDuration : null;
        rate.ValidityUnit = request.RateType == RateType.CustomerCard ? request.ValidityUnit : null;
        rate.IsActive = request.IsActive;
        rate.UpdatedAt = DateTime.UtcNow;

        _rateRepo.Update(rate);
        await _rateRepo.SaveChangesAsync();
        return ApiResponse<RateDto>.Ok(ToDto(rate));
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
        if (rateType is RateType.Internal or RateType.CustomerCard) return 0;
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
        if (rateType == RateType.CustomerCard)
            return (await _rateRepo.GetAllAsync()).Any(rate => rate.IsActive && rate.Id != excludedId && rate.RateType == RateType.CustomerCard);
        var newStart = start.Hour * 60 + start.Minute;
        var newEnd = end == TimeOnly.MinValue ? 1440 : end.Hour * 60 + end.Minute;
        if (newEnd - newStart < 60) return true;
        return (await _rateRepo.GetAllAsync()).Any(r => r.IsActive && r.Id != excludedId && r.RateType == rateType &&
            newStart < (r.EndTime == TimeOnly.MinValue ? 1440 : r.EndTime.Hour * 60 + r.EndTime.Minute) &&
            (r.StartTime.Hour * 60 + r.StartTime.Minute) < newEnd);
    }

    private static bool IsAtLeastOneHour(TimeOnly start, TimeOnly end) =>
        start != end && (end == TimeOnly.MinValue ? 1440 : end.Hour * 60 + end.Minute) - (start.Hour * 60 + start.Minute) >= 60;

    private static string? Validate(RateType type, decimal price, TimeOnly start, TimeOnly end, int? duration, RateValidityUnit? unit)
    {
        if (type != RateType.Internal && (price <= 0 || price > 1_000_000m))
            return type == RateType.CustomerCard ? "Customer card price must be between ₱0.01 and ₱1,000,000" : "Hourly rate must be between ₱0.01 and ₱1,000,000";
        if (type == RateType.CustomerCard)
        {
            if (!duration.HasValue || duration.Value is < 1 or > 3650) return "Validity duration must be between 1 and 3650";
            if (!unit.HasValue || !Enum.IsDefined(unit.Value)) return "Choose a valid customer card validity unit";
            return null;
        }
        return IsAtLeastOneHour(start, end) ? null : "End time must be at least 1 hour after start time";
    }

    private static RateDto ToDto(Rate rate) => new(rate.Id, rate.StartTime, rate.EndTime, rate.PricePerHour, rate.RateType,
        rate.IsActive, rate.ValidityDuration, rate.ValidityUnit);
}
