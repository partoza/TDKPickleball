using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using System.Security.Claims;
using System.Security.Cryptography;
using TDK.Application.DTOs.Auth;
using TDK.Application.Interfaces;

namespace TDK.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IConfiguration _configuration;
    private readonly IMemoryCache _cache;

    public AuthController(IAuthService authService, IConfiguration configuration, IMemoryCache cache)
    {
        _authService = authService;
        _configuration = configuration;
        _cache = cache;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var result = await _authService.LoginAsync(request);
        return result.Success ? Ok(result) : Unauthorized(result);
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh(RefreshRequest request) => Ok(await _authService.RefreshAsync(""));

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout() => Ok(await _authService.LogoutAsync(User.FindFirstValue(ClaimTypes.NameIdentifier)!));

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetMe() => Ok(await _authService.GetCurrentUserAsync(User.FindFirstValue(ClaimTypes.NameIdentifier)!));

    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest request)
    {
        var result = await _authService.ChangePasswordAsync(User.FindFirstValue(ClaimTypes.NameIdentifier)!, request);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("google/start")]
    [AllowAnonymous]
    public IActionResult StartGoogleLogin()
    {
        if (string.IsNullOrWhiteSpace(_configuration["Authentication:Google:ClientId"]) || string.IsNullOrWhiteSpace(_configuration["Authentication:Google:ClientSecret"]))
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { success = false, message = "Google sign-in is not configured" });
        return Challenge(new AuthenticationProperties { RedirectUri = Url.ActionLink(nameof(CompleteGoogleLogin)) }, GoogleDefaults.AuthenticationScheme);
    }

    [HttpGet("google/complete")]
    [AllowAnonymous]
    public async Task<IActionResult> CompleteGoogleLogin()
    {
        var external = await HttpContext.AuthenticateAsync("GoogleExternal");
        if (!external.Succeeded || external.Principal is null) return RedirectToFrontend("google_error=authentication_failed");

        var providerKey = external.Principal.FindFirstValue(ClaimTypes.NameIdentifier);
        var email = external.Principal.FindFirstValue(ClaimTypes.Email);
        var verified = external.Principal.FindFirstValue("email_verified");
        if (string.IsNullOrWhiteSpace(providerKey) || string.IsNullOrWhiteSpace(email) || !bool.TryParse(verified, out var emailVerified) || !emailVerified)
            return RedirectToFrontend("google_error=email_not_verified");

        var firstName = external.Principal.FindFirstValue(ClaimTypes.GivenName) ?? "";
        var lastName = external.Principal.FindFirstValue(ClaimTypes.Surname) ?? "";
        var result = await _authService.GoogleLoginAsync(providerKey, email, firstName, lastName);
        await HttpContext.SignOutAsync("GoogleExternal");
        if (!result.Success || result.Data is null) return RedirectToFrontend("google_error=account_unavailable");

        var code = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        _cache.Set($"google-login:{code}", result.Data, TimeSpan.FromMinutes(2));
        return RedirectToFrontend($"code={Uri.EscapeDataString(code)}");
    }

    [HttpPost("google/exchange")]
    [AllowAnonymous]
    public IActionResult ExchangeGoogleCode(GoogleExchangeRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Code) || !_cache.TryGetValue<AuthResponse>($"google-login:{request.Code}", out var response) || response is null)
            return Unauthorized(new { success = false, message = "The Google sign-in code is invalid or expired" });
        _cache.Remove($"google-login:{request.Code}");
        return Ok(new { success = true, data = response });
    }

    private IActionResult RedirectToFrontend(string query)
    {
        var frontend = (_configuration["Frontend:BaseUrl"] ?? "http://localhost:5173").TrimEnd('/');
        return Redirect($"{frontend}/auth/google/callback?{query}");
    }
}
