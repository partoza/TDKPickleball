using System.ComponentModel.DataAnnotations;

namespace TDK.Application.DTOs.Auth;

public record LoginRequest(string Email, string Password);
public record AuthResponse(string AccessToken, string Email, string FirstName, string LastName, string Role, bool MustChangePassword, string? ProfileImageUrl);
public record RefreshRequest();
public sealed class GoogleCredentialRequest
{
    [Required, StringLength(4096, MinimumLength = 20)]
    public string Credential { get; init; } = string.Empty;
}
public record UserDto(string Id, string Email, string FirstName, string LastName, string Role, bool IsActive, bool MustChangePassword, string? ProfileImageUrl);
public record CreateUserRequest(string Email, string FirstName, string LastName, string Role);
public record UpdateUserStatusRequest(bool IsActive);
public record ChangePasswordRequest(string? CurrentPassword, string NewPassword, string ConfirmPassword);
public record ProfileImageUploadResult(string Url, string PublicId);
public sealed class AdminCredentialRequest
{
    [Required, EmailAddress, StringLength(256)]
    public string Email { get; init; } = string.Empty;

    [Required, StringLength(256, MinimumLength = 1)]
    public string Password { get; init; } = string.Empty;
}
