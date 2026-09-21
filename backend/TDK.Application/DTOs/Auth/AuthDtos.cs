namespace TDK.Application.DTOs.Auth;

public record LoginRequest(string Email, string Password);
public record AuthResponse(string AccessToken, string Email, string FirstName, string LastName, string Role, bool MustChangePassword);
public record RefreshRequest();
public record GoogleExchangeRequest(string Code);
public record UserDto(string Id, string Email, string FirstName, string LastName, string Role, bool IsActive, bool MustChangePassword);
public record CreateUserRequest(string Email, string FirstName, string LastName, string Role);
public record ChangePasswordRequest(string? CurrentPassword, string NewPassword, string ConfirmPassword);
