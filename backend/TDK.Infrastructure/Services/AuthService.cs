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
    private readonly IProfileImageService _profileImages;
    private readonly string _jwtKey;
    private const int MaximumTeamAccounts = 10;
    private static readonly SemaphoreSlim TeamAccountCreationLock = new(1, 1);
    private static readonly SemaphoreSlim TeamAccountMutationLock = new(1, 1);

    public AuthService(UserManager<ApplicationUser> userManager, SignInManager<ApplicationUser> signInManager, IConfiguration config, IEmailService email, IProfileImageService profileImages)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _config = config;
        _email = email;
        _profileImages = profileImages;
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
        
        return ApiResponse<AuthResponse>.Ok(new AuthResponse(token, user.Email!, user.FirstName, user.LastName, roles.FirstOrDefault() ?? "", user.MustChangePassword, user.ProfileImageUrl));
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
        return ApiResponse<AuthResponse>.Ok(new AuthResponse("", user.Email!, user.FirstName, user.LastName, roles.FirstOrDefault() ?? "", user.MustChangePassword, user.ProfileImageUrl));
    }

    public async Task<ApiResponse<AuthResponse>> GoogleLoginAsync(string providerKey, string email, string firstName, string lastName, string? profileImageUrl)
    {
        if (string.IsNullOrWhiteSpace(providerKey) || string.IsNullOrWhiteSpace(email))
            return ApiResponse<AuthResponse>.Fail("Google did not return a valid identity");

        email = email.Trim().ToLowerInvariant();
        var existingUser = await _userManager.FindByEmailAsync(email);
        if (existingUser is not null)
        {
            var existingRoles = await _userManager.GetRolesAsync(existingUser);
            if (existingRoles.Any(role => role is "Admin" or "Staff"))
                return ApiResponse<AuthResponse>.Fail("This email belongs to an administrative account");
        }

        var safeFirstName = string.IsNullOrWhiteSpace(firstName) ? "Guest" : firstName.Trim()[..Math.Min(firstName.Trim().Length, 80)];
        var safeLastName = string.IsNullOrWhiteSpace(lastName) ? "" : lastName.Trim()[..Math.Min(lastName.Trim().Length, 80)];
        var safeProfileImageUrl = NormalizeGoogleProfileImageUrl(profileImageUrl);
        var token = GenerateGoogleVerificationJwt(providerKey, email, safeFirstName, safeLastName, safeProfileImageUrl);
        return ApiResponse<AuthResponse>.Ok(new AuthResponse(token, email, safeFirstName, safeLastName, "Customer", false, safeProfileImageUrl), "Email verified with Google");
    }

    public async Task<ApiResponse<IEnumerable<UserDto>>> GetUsersAsync()
    {
        var administrators = await _userManager.GetUsersInRoleAsync("Admin");
        var staff = await _userManager.GetUsersInRoleAsync("Staff");
        var teamUsers = administrators.Concat(staff).DistinctBy(user => user.Id)
            .OrderBy(user => user.FirstName).ThenBy(user => user.LastName);
        var users = new List<UserDto>();
        foreach (var user in teamUsers)
        {
            var roles = await _userManager.GetRolesAsync(user);
            users.Add(ToUserDto(user, roles.FirstOrDefault() ?? "Staff"));
        }
        return ApiResponse<IEnumerable<UserDto>>.Ok(users);
    }

    public async Task<ApiResponse<UserDto>> CreateUserAsync(CreateUserRequest request)
    {
        var role = request.Role?.Trim() ?? "";
        if (role is not ("Admin" or "Staff")) return ApiResponse<UserDto>.Fail("Role must be Admin or Staff");
        if (!_email.IsConfigured) return ApiResponse<UserDto>.Fail("Configure SMTP before adding a user so the temporary password can be delivered");
        var email = request.Email?.Trim().ToLowerInvariant() ?? "";
        await TeamAccountCreationLock.WaitAsync();
        try
        {
            if (await _userManager.FindByEmailAsync(email) is not null) return ApiResponse<UserDto>.Fail("A user with this email already exists");

            var administrators = await _userManager.GetUsersInRoleAsync("Admin");
            var staff = await _userManager.GetUsersInRoleAsync("Staff");
            var teamAccountCount = administrators.Select(user => user.Id).Concat(staff.Select(user => user.Id)).Distinct().Count();
            if (teamAccountCount >= MaximumTeamAccounts)
                return ApiResponse<UserDto>.Fail("The maximum of 10 administrator and staff accounts has been reached");

            var temporaryPassword = $"Tdk!9{Convert.ToHexString(RandomNumberGenerator.GetBytes(6))}";
            var firstName = request.FirstName?.Trim() ?? "";
            var lastName = request.LastName?.Trim() ?? "";
            if (firstName.Length is < 1 or > 80 || lastName.Length is < 1 or > 80)
                return ApiResponse<UserDto>.Fail("First name and last name are required and cannot exceed 80 characters");
            var user = new ApplicationUser { UserName = email, Email = email, FirstName = firstName, LastName = lastName, EmailConfirmed = true, IsActive = true, MustChangePassword = true };
            var created = await _userManager.CreateAsync(user, temporaryPassword);
            if (!created.Succeeded) return ApiResponse<UserDto>.Fail(string.Join(" ", created.Errors.Select(x => x.Description)));

            var roleAdded = await _userManager.AddToRoleAsync(user, role);
            if (!roleAdded.Succeeded)
            {
                await _userManager.DeleteAsync(user);
                return ApiResponse<UserDto>.Fail("The user role could not be assigned. No account was created");
            }

            try { await _email.SendTemporaryPasswordAsync(email, user.FirstName, temporaryPassword); }
            catch { await _userManager.DeleteAsync(user); return ApiResponse<UserDto>.Fail("The invitation email could not be sent. No account was created"); }
            return ApiResponse<UserDto>.Ok(ToUserDto(user, role), "User created and temporary password sent");
        }
        finally
        {
            TeamAccountCreationLock.Release();
        }
    }

    public async Task<ApiResponse<UserDto>> SetUserActiveAsync(string userId, bool isActive, string actingUserId)
    {
        await TeamAccountMutationLock.WaitAsync();
        try
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user is null) return ApiResponse<UserDto>.Fail("User not found");
            if (user.Id == actingUserId && !isActive) return ApiResponse<UserDto>.Fail("You cannot make your own account inactive");
            if (IsPrimaryAdministrator(user) && !isActive) return ApiResponse<UserDto>.Fail("The primary administrator cannot be made inactive");

            var roles = await _userManager.GetRolesAsync(user);
            if (!roles.Any(role => role is "Admin" or "Staff")) return ApiResponse<UserDto>.Fail("Only team accounts can be managed here");
            if (!isActive && roles.Contains("Admin") && !await HasAnotherActiveAdministratorAsync(user.Id))
                return ApiResponse<UserDto>.Fail("At least one administrator must remain active");

            if (user.IsActive == isActive)
                return ApiResponse<UserDto>.Ok(ToUserDto(user, roles.FirstOrDefault() ?? "Staff"), $"User is already {(isActive ? "active" : "inactive")}");

            user.IsActive = isActive;
            var updated = await _userManager.UpdateAsync(user);
            if (!updated.Succeeded) return ApiResponse<UserDto>.Fail("The user status could not be updated");
            await _userManager.UpdateSecurityStampAsync(user);
            return ApiResponse<UserDto>.Ok(ToUserDto(user, roles.FirstOrDefault() ?? "Staff"), $"User marked {(isActive ? "active" : "inactive")}");
        }
        finally
        {
            TeamAccountMutationLock.Release();
        }
    }

    public async Task<ApiResponse<bool>> DeleteUserAsync(string userId, string actingUserId, CancellationToken cancellationToken = default)
    {
        await TeamAccountMutationLock.WaitAsync(cancellationToken);
        try
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user is null) return ApiResponse<bool>.Fail("User not found");
            if (user.Id == actingUserId) return ApiResponse<bool>.Fail("You cannot delete your own account");
            if (IsPrimaryAdministrator(user)) return ApiResponse<bool>.Fail("The primary administrator cannot be deleted");
            if (user.IsActive) return ApiResponse<bool>.Fail("Make the user inactive before deleting the account");

            var roles = await _userManager.GetRolesAsync(user);
            if (!roles.Any(role => role is "Admin" or "Staff")) return ApiResponse<bool>.Fail("Only team accounts can be managed here");
            if (roles.Contains("Admin") && !await HasAnotherActiveAdministratorAsync(user.Id))
                return ApiResponse<bool>.Fail("At least one administrator must remain active");

            var profileImagePublicId = user.ProfileImagePublicId;
            var deleted = await _userManager.DeleteAsync(user);
            if (!deleted.Succeeded) return ApiResponse<bool>.Fail("The inactive user could not be deleted");
            if (!string.IsNullOrWhiteSpace(profileImagePublicId))
            {
                try { await _profileImages.DeleteAsync(profileImagePublicId, cancellationToken); } catch { }
            }
            return ApiResponse<bool>.Ok(true, "Inactive user deleted");
        }
        finally
        {
            TeamAccountMutationLock.Release();
        }
    }

    public async Task<ApiResponse<bool>> VerifyAdminCredentialsAsync(string userId, string email, string password)
    {
        const string failureMessage = "The email or password does not match the signed-in administrator";
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null || !user.IsActive || string.IsNullOrWhiteSpace(user.Email))
            return ApiResponse<bool>.Fail(failureMessage);

        var roles = await _userManager.GetRolesAsync(user);
        if (!roles.Contains("Admin")) return ApiResponse<bool>.Fail(failureMessage);
        if (!string.Equals(user.Email.Trim(), email?.Trim(), StringComparison.OrdinalIgnoreCase))
            return ApiResponse<bool>.Fail(failureMessage);

        var passwordResult = await _signInManager.CheckPasswordSignInAsync(user, password, lockoutOnFailure: true);
        return passwordResult.Succeeded
            ? ApiResponse<bool>.Ok(true)
            : ApiResponse<bool>.Fail(failureMessage);
    }

    public async Task<ApiResponse<UserDto>> UpdateProfileImageAsync(string userId, Stream content, string fileName, string contentType, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null) return ApiResponse<UserDto>.Fail("User not found");
        var oldPublicId = user.ProfileImagePublicId;
        ProfileImageUploadResult uploaded;
        try
        {
            uploaded = await _profileImages.UploadAsync(content, fileName, contentType, cancellationToken);
        }
        catch (InvalidOperationException ex)
        {
            return ApiResponse<UserDto>.Fail(ex.Message);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch
        {
            return ApiResponse<UserDto>.Fail("The profile image upload failed. Please try again");
        }

        user.ProfileImageUrl = uploaded.Url;
        user.ProfileImagePublicId = uploaded.PublicId;
        var updated = await _userManager.UpdateAsync(user);
        if (!updated.Succeeded)
        {
            try { await _profileImages.DeleteAsync(uploaded.PublicId, cancellationToken); } catch { }
            return ApiResponse<UserDto>.Fail("The profile image could not be saved");
        }

        if (!string.IsNullOrWhiteSpace(oldPublicId))
        {
            try { await _profileImages.DeleteAsync(oldPublicId, cancellationToken); } catch { }
        }

        var roles = await _userManager.GetRolesAsync(user);
        return ApiResponse<UserDto>.Ok(ToUserDto(user, roles.FirstOrDefault() ?? "Customer"), "Profile image updated");
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

        var isTeamAccount = roles.Any(role => role is "Admin" or "Staff");
        var defaultSessionHours = isTeamAccount ? 24 : 2;
        var configuredSessionHours = _config.GetValue<int?>(isTeamAccount ? "Jwt:AdminSessionHours" : "Jwt:CustomerSessionHours");
        var sessionHours = Math.Clamp(configuredSessionHours ?? defaultSessionHours, 1, 24);
        return WriteJwt(claims, sessionHours);
    }

    private string GenerateGoogleVerificationJwt(string providerKey, string email, string firstName, string lastName, string? profileImageUrl)
    {
        var subjectHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(providerKey)));
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, $"google-email:{subjectHash}"),
            new(ClaimTypes.Email, email),
            new(ClaimTypes.Name, $"{firstName} {lastName}".Trim()),
            new(ClaimTypes.GivenName, firstName),
            new(ClaimTypes.Surname, lastName),
            new(ClaimTypes.Role, "Customer"),
            new("auth_provider", "google_email_verification"),
            new("must_change_password", "false")
        };
        if (!string.IsNullOrWhiteSpace(profileImageUrl)) claims.Add(new("profile_picture", profileImageUrl));
        var sessionHours = Math.Clamp(_config.GetValue<int?>("Jwt:CustomerSessionHours") ?? 2, 1, 24);
        return WriteJwt(claims, sessionHours);
    }

    private static string? NormalizeGoogleProfileImageUrl(string? value)
    {
        if (string.IsNullOrWhiteSpace(value) || value.Length > 2048) return null;
        return Uri.TryCreate(value.Trim(), UriKind.Absolute, out var uri) &&
               uri.Scheme == Uri.UriSchemeHttps &&
               (uri.Host.Equals("googleusercontent.com", StringComparison.OrdinalIgnoreCase) ||
                uri.Host.EndsWith(".googleusercontent.com", StringComparison.OrdinalIgnoreCase))
            ? uri.AbsoluteUri
            : null;
    }

    private string WriteJwt(IEnumerable<Claim> claims, int sessionHours)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(sessionHours),
            signingCredentials: creds
        );
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private bool IsPrimaryAdministrator(ApplicationUser user)
    {
        var configuredEmail = _config["SeedAdmin:Email"] ?? "admin@tdk.com";
        return string.Equals(user.Email, configuredEmail.Trim(), StringComparison.OrdinalIgnoreCase);
    }

    private async Task<bool> HasAnotherActiveAdministratorAsync(string excludedUserId)
    {
        var administrators = await _userManager.GetUsersInRoleAsync("Admin");
        return administrators.Any(user => user.Id != excludedUserId && user.IsActive);
    }

    private static UserDto ToUserDto(ApplicationUser user, string role) => new(user.Id, user.Email ?? "", user.FirstName, user.LastName, role, user.IsActive, user.MustChangePassword, user.ProfileImageUrl);
}
