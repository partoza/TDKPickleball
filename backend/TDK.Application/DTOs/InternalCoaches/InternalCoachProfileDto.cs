using TDK.Domain.Enums;

namespace TDK.Application.DTOs.InternalCoaches;

public record InternalCoachProfileDto(
    int Id,
    string Name,
    string? Email,
    string? Phone,
    InternalCoachType Type,
    bool IsActive,
    string? ProfilePictureUrl = null
);

public record CreateInternalCoachProfileRequest(
    string Name,
    string? Email,
    string? Phone,
    InternalCoachType Type
);

public record UpdateInternalCoachProfileRequest(
    string Name,
    string? Email,
    string? Phone,
    InternalCoachType Type,
    bool IsActive
);
