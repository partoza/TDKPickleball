using TDK.Application.DTOs.Auth;
using TDK.Application.DTOs.Common;

namespace TDK.Application.Interfaces;

public interface IAuthService
{
    Task<ApiResponse<AuthResponse>> LoginAsync(LoginRequest request);
    Task<ApiResponse<AuthResponse>> GoogleLoginAsync(string providerKey, string email, string firstName, string lastName);
    Task<ApiResponse<AuthResponse>> RefreshAsync(string refreshToken);
    Task<ApiResponse<bool>> LogoutAsync(string userId);
    Task<ApiResponse<AuthResponse>> GetCurrentUserAsync(string userId);
    Task<ApiResponse<IEnumerable<UserDto>>> GetUsersAsync();
    Task<ApiResponse<UserDto>> CreateUserAsync(CreateUserRequest request);
    Task<ApiResponse<UserDto>> SetUserActiveAsync(string userId, bool isActive, string actingUserId);
    Task<ApiResponse<bool>> DeleteUserAsync(string userId, string actingUserId, CancellationToken cancellationToken = default);
    Task<ApiResponse<UserDto>> UpdateProfileImageAsync(string userId, Stream content, string fileName, string contentType, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> ChangePasswordAsync(string userId, ChangePasswordRequest request);
}
