using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using TDK.Application.DTOs.Auth;
using TDK.Application.DTOs.Common;
using TDK.Application.Interfaces;
using TDK.Infrastructure.Identity;

namespace TDK.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IConfiguration _config;
    private readonly IEmailService _email;
    private readonly string _jwtKey;

    public AuthService(UserManager<ApplicationUser> userManager, SignInManager<ApplicationUser> signInManager, IConfiguration config, IEmailService email)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _config = config;
        _email = email;
        _jwtKey = config["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key is not configured");
    }

    public async Task<ApiResponse<AuthResponse>> LoginAsync(LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null || !user.IsActive) return ApiResponse<AuthResponse>.Fail("Invalid login");
        
        var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, false);
        if (!result.Succeeded) return ApiResponse<AuthResponse>.Fail("Invalid login");

        var roles = await _userManager.GetRolesAsync(user);
        var token = GenerateJwt(user, roles);
        
        return ApiResponse<AuthResponse>.Ok(new AuthResponse(token, user.Email!, user.FirstName, user.LastName, roles.FirstOrDefault() ?? "", user.MustChangePassword));
    }

    public Task<ApiResponse<AuthResponse>> RefreshAsync(string refreshToken)
    {
        return Task.FromResult(ApiResponse<AuthResponse>.Fail("Not implemented"));
    }

    public Task<ApiResponse<bool>> LogoutAsync(string userId)
    {
        return Task.FromResult(ApiResponse<bool>.Ok(true));
    }

    public async Task<ApiResponse<AuthResponse>> GetCurrentUserAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return ApiResponse<AuthResponse>.Fail("Not found");
        var roles = await _userManager.GetRolesAsync(user);
        return ApiResponse<AuthResponse>.Ok(new AuthResponse("", user.Email!, user.FirstName, user.LastName, roles.FirstOrDefault() ?? "", user.MustChangePassword));
    }

    public async Task<ApiResponse<AuthResponse>> GoogleLoginAsync(string providerKey, string email, string firstName, string lastName)
    {
        if (string.IsNullOrWhiteSpace(providerKey) || string.IsNullOrWhiteSpace(email))
            return ApiResponse<AuthResponse>.Fail("Google did not return a valid identity");

        email = email.Trim().ToLowerInvariant();
        var user = await _userManager.FindByLoginAsync("Google", providerKey);
        if (user is null)
        {
            user = await _userManager.FindByEmailAsync(email);
            if (user is not null)
            {
                var existingRoles = await _userManager.GetRolesAsync(user);
                if (existingRoles.Any(role => role is "Admin" or "Staff"))
                    return ApiResponse<AuthResponse>.Fail("This email belongs to an administrative account");
            }
            else
            {
                user = new ApplicationUser
                {
                    UserName = email,
                    Email = email,
                    EmailConfirmed = true,
                    FirstName = string.IsNullOrWhiteSpace(firstName) ? "Google" : firstName.Trim(),
                    LastName = lastName?.Trim() ?? "",
                    IsActive = true,
                    MustChangePassword = false
                };
                var created = await _userManager.CreateAsync(user);
                if (!created.Succeeded) return ApiResponse<AuthResponse>.Fail("The customer account could not be created");
                await _userManager.AddToRoleAsync(user, "Customer");
            }

            var loginAdded = await _userManager.AddLoginAsync(user, new UserLoginInfo("Google", providerKey, "Google"));
            if (!loginAdded.Succeeded) return ApiResponse<AuthResponse>.Fail("The Google account could not be linked");
        }

        if (!user.IsActive) return ApiResponse<AuthResponse>.Fail("This account is disabled");
        var roles = await _userManager.GetRolesAsync(user);
        if (!roles.Contains("Customer")) await _userManager.AddToRoleAsync(user, "Customer");
        roles = await _userManager.GetRolesAsync(user);
        var token = GenerateJwt(user, roles);
        return ApiResponse<AuthResponse>.Ok(new AuthResponse(token, user.Email!, user.FirstName, user.LastName, "Customer", false));
    }

    public async Task<ApiResponse<IEnumerable<UserDto>>> GetUsersAsync()
    {
        var users = new List<UserDto>();
        foreach (var user in _userManager.Users.OrderBy(x => x.FirstName).ThenBy(x => x.LastName).ToList())
        {
            var roles = await _userManager.GetRolesAsync(user);
            users.Add(ToUserDto(user, roles.FirstOrDefault() ?? "Staff"));
        }
        return ApiResponse<IEnumerable<UserDto>>.Ok(users);
    }

    public async Task<ApiResponse<UserDto>> CreateUserAsync(CreateUserRequest request)
    {
        var role = request.Role.Trim();
        if (role is not ("Admin" or "Staff")) return ApiResponse<UserDto>.Fail("Role must be Admin or Staff");
        if (string.IsNullOrWhiteSpace(_config["Smtp:Host"])) return ApiResponse<UserDto>.Fail("Configure SMTP before adding a user so the temporary password can be delivered");
        var email = request.Email.Trim().ToLowerInvariant();
        if (await _userManager.FindByEmailAsync(email) is not null) return ApiResponse<UserDto>.Fail("A user with this email already exists");
        var temporaryPassword = $"Tdk!9{Convert.ToHexString(RandomNumberGenerator.GetBytes(6))}";
        var user = new ApplicationUser { UserName = email, Email = email, FirstName = request.FirstName.Trim(), LastName = request.LastName.Trim(), EmailConfirmed = true, IsActive = true, MustChangePassword = true };
        var created = await _userManager.CreateAsync(user, temporaryPassword);
        if (!created.Succeeded) return ApiResponse<UserDto>.Fail(string.Join(" ", created.Errors.Select(x => x.Description)));
        await _userManager.AddToRoleAsync(user, role);
        try { await _email.SendTemporaryPasswordAsync(email, user.FirstName, temporaryPassword); }
        catch { await _userManager.DeleteAsync(user); return ApiResponse<UserDto>.Fail("The invitation email could not be sent. No account was created"); }
        return ApiResponse<UserDto>.Ok(ToUserDto(user, role), "User created and temporary password sent");
    }

    public async Task<ApiResponse<bool>> ChangePasswordAsync(string userId, ChangePasswordRequest request)
    {
        if (request.NewPassword != request.ConfirmPassword) return ApiResponse<bool>.Fail("Passwords do not match");
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null) return ApiResponse<bool>.Fail("User not found");
        IdentityResult result;
        if (user.MustChangePassword)
        {
            var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
            result = await _userManager.ResetPasswordAsync(user, resetToken, request.NewPassword);
        }
        else
        {
            if (string.IsNullOrWhiteSpace(request.CurrentPassword)) return ApiResponse<bool>.Fail("Current password is required");
            result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        }
        if (!result.Succeeded) return ApiResponse<bool>.Fail(string.Join(" ", result.Errors.Select(x => x.Description)));
        user.MustChangePassword = false;
        await _userManager.UpdateAsync(user);
        return ApiResponse<bool>.Ok(true, "Password changed");
    }

    private string GenerateJwt(ApplicationUser user, IList<string> roles)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Email, user.Email!),
            new Claim(ClaimTypes.Name, $"{user.FirstName} {user.LastName}"),
            new Claim("must_change_password", user.MustChangePassword ? "true" : "false")
        };
        foreach (var r in roles) claims.Add(new Claim(ClaimTypes.Role, r));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        
        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(2),
            signingCredentials: creds
        );
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static UserDto ToUserDto(ApplicationUser user, string role) => new(user.Id, user.Email ?? "", user.FirstName, user.LastName, role, user.IsActive, user.MustChangePassword);
}
