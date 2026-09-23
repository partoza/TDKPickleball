using TDK.Domain.Enums;

namespace TDK.Application.DTOs.Staff;

public record StaffProfileDto(
    int Id,
    string Name,
    string? Email,
    string? Phone,
    StaffType Type,
    bool IsActive,
    string? ProfilePictureUrl = null
);

public record CreateStaffProfileRequest(
    string Name,
    string? Email,
    string? Phone,
    StaffType Type,
    string? ProfilePictureUrl = null
);

public record UpdateStaffProfileRequest(
    string Name,
    string? Email,
    string? Phone,
    StaffType Type,
    bool IsActive,
    string? ProfilePictureUrl = null
);
