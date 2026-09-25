using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;
using TDK.Application.DTOs.Auth;
using TDK.Application.Interfaces;
using TDK.Api.Validation;

namespace TDK.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly IAuthService _authService;

    public AdminController(IAuthService authService) => _authService = authService;

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers() => Ok(await _authService.GetUsersAsync());

    [HttpPost("users")]
    [EnableRateLimiting("Email")]
    public async Task<IActionResult> CreateUser(CreateUserRequest request)
    {
        var result = await _authService.CreateUserAsync(request);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPatch("users/{id}/status")]
    public async Task<IActionResult> SetUserStatus(string id, UpdateUserStatusRequest request)
    {
        var actingUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var result = await _authService.SetUserActiveAsync(id, request.IsActive, actingUserId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("users/{id}/delete")]
    public async Task<IActionResult> DeleteUser(string id, AdminCredentialRequest request, CancellationToken cancellationToken)
    {
        var actingUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var verification = await _authService.VerifyAdminCredentialsAsync(actingUserId, request.Email, request.Password);
        if (!verification.Success) return BadRequest(verification);
        var result = await _authService.DeleteUserAsync(id, actingUserId, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("users/{id}/profile-image")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(ProfileImageValidator.MaximumRequestBytes)]
    public async Task<IActionResult> UpdateUserProfileImage(string id, [FromForm] IFormFile? image, CancellationToken cancellationToken)
    {
        var validation = await ProfileImageValidator.ValidateAsync(image, cancellationToken);
        if (!validation.IsValid) return BadRequest(new { success = false, message = validation.Error });

        await using var content = image!.OpenReadStream();
        var result = await _authService.UpdateProfileImageAsync(id, content, validation.FileName, validation.ContentType, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
