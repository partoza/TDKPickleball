using TDK.Domain.Enums;

namespace TDK.Application.DTOs.Promo;

public record PromoDto(
    int Id,
    string Code,
    string Description,
    DiscountType Type,
    decimal Value,
    DateTime? StartDate,
    DateTime? EndDate,
    int? MaxUses,
    int CurrentUses,
    RateType? AppliesTo,
    bool IsActive
);

public record CreatePromoRequest(
    string Code,
    string Description,
    DiscountType Type,
    decimal Value,
    DateTime? StartDate,
    DateTime? EndDate,
    int? MaxUses,
    RateType? AppliesTo
);

public record UpdatePromoRequest(
    string Code,
    string Description,
    DiscountType Type,
    decimal Value,
    DateTime? StartDate,
    DateTime? EndDate,
    int? MaxUses,
    RateType? AppliesTo,
    bool IsActive
);
