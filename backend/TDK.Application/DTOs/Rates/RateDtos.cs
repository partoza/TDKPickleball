using TDK.Domain.Enums;

namespace TDK.Application.DTOs.Rates;

public record RateDto(int Id, TimeOnly StartTime, TimeOnly EndTime, decimal PricePerHour, RateType RateType, bool IsActive);
public record CreateRateRequest(TimeOnly StartTime, TimeOnly EndTime, decimal PricePerHour, RateType RateType);
public record UpdateRateRequest(TimeOnly StartTime, TimeOnly EndTime, decimal PricePerHour, RateType RateType, bool IsActive);
