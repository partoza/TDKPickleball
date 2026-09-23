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
    bool IsActive
);

public record CreatePromoRequest(
    string Code,
    string Description,
    DiscountType Type,
    decimal Value,
    DateTime? StartDate,
    DateTime? EndDate,
    int? MaxUses
);

public record UpdatePromoRequest(
    string Code,
    string Description,
    DiscountType Type,
    decimal Value,
    DateTime? StartDate,
    DateTime? EndDate,
    int? MaxUses,
    bool IsActive
);
