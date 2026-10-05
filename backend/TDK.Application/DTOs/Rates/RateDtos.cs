using TDK.Domain.Enums;

namespace TDK.Application.DTOs.Rates;

public record RateDto(int Id, TimeOnly StartTime, TimeOnly EndTime, decimal PricePerHour, RateType RateType, bool IsActive,
    int? ValidityDuration = null, RateValidityUnit? ValidityUnit = null);
public record CreateRateRequest(TimeOnly StartTime, TimeOnly EndTime, decimal PricePerHour, RateType RateType,
    int? ValidityDuration = null, RateValidityUnit? ValidityUnit = null);
public record UpdateRateRequest(TimeOnly StartTime, TimeOnly EndTime, decimal PricePerHour, RateType RateType, bool IsActive,
    int? ValidityDuration = null, RateValidityUnit? ValidityUnit = null);
