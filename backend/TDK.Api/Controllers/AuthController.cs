using Google.Apis.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;
using TDK.Application.DTOs.Auth;
using TDK.Application.DTOs.Common;
using TDK.Application.Interfaces;
using TDK.Api.Validation;

namespace TDK.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IConfiguration _configuration;

    public AuthController(IAuthService authService, IConfiguration configuration)
    {
        _authService = authService;
        _configuration = configuration;
    }

    [HttpPost("login")]
    [EnableRateLimiting("Authentication")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var result = await _authService.LoginAsync(request);
        return result.Success ? Ok(result) : Unauthorized(result);
    }

    [HttpPost("refresh")]
    [EnableRateLimiting("Authentication")]
    public async Task<IActionResult> Refresh(RefreshRequest request) => Ok(await _authService.RefreshAsync(""));

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout() => Ok(await _authService.LogoutAsync(User.FindFirstValue(ClaimTypes.NameIdentifier)!));

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetMe()
    {
        if (User.IsInRole("Customer") && User.FindFirstValue("auth_provider") == "google_email_verification")
        {
            var response = new AuthResponse(
                "",
                User.FindFirstValue(ClaimTypes.Email) ?? "",
                User.FindFirstValue(ClaimTypes.GivenName) ?? "",
                User.FindFirstValue(ClaimTypes.Surname) ?? "",
                "Customer",
                false,
                User.FindFirstValue("profile_picture"));
            return Ok(ApiResponse<AuthResponse>.Ok(response));
        }
        return Ok(await _authService.GetCurrentUserAsync(User.FindFirstValue(ClaimTypes.NameIdentifier)!));
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest request)
    {
        var result = await _authService.ChangePasswordAsync(User.FindFirstValue(ClaimTypes.NameIdentifier)!, request);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("profile-image")]
    [Authorize]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(ProfileImageValidator.MaximumRequestBytes)]
    public async Task<IActionResult> UpdateProfileImage([FromForm] IFormFile? image, CancellationToken cancellationToken)
    {
        var validation = await ProfileImageValidator.ValidateAsync(image, cancellationToken);
        if (!validation.IsValid) return BadRequest(new { success = false, message = validation.Error });

        await using var content = image!.OpenReadStream();
        var result = await _authService.UpdateProfileImageAsync(
            User.FindFirstValue(ClaimTypes.NameIdentifier)!, content, validation.FileName, validation.ContentType, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("google/verify")]
    [AllowAnonymous]
    [EnableRateLimiting("Authentication")]
    public async Task<IActionResult> VerifyGoogleCredential(GoogleCredentialRequest request)
    {
        var clientId = _configuration["Authentication:Google:ClientId"];
        if (string.IsNullOrWhiteSpace(clientId))
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { success = false, message = "Google sign-in is not configured" });

        try
        {
            var payload = await GoogleJsonWebSignature.ValidateAsync(
                request.Credential,
                new GoogleJsonWebSignature.ValidationSettings { Audience = [clientId] });

            if (!payload.EmailVerified || string.IsNullOrWhiteSpace(payload.Subject) || string.IsNullOrWhiteSpace(payload.Email))
                return Unauthorized(new { success = false, message = "Google could not verify this email address" });

            var result = await _authService.GoogleLoginAsync(
                payload.Subject,
                payload.Email,
                payload.GivenName ?? "",
                payload.FamilyName ?? "",
                payload.Picture);
            return result.Success ? Ok(result) : Unauthorized(result);
        }
        catch (InvalidJwtException)
        {
            return Unauthorized(new { success = false, message = "The Google verification token is invalid or expired" });
        }
    }
}
