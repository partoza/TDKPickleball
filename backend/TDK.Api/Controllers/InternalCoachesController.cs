using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TDK.Application.DTOs.Common;
using TDK.Application.DTOs.InternalCoaches;
using TDK.Application.Interfaces;
using TDK.Domain.Enums;
using TDK.Api.Validation;
using TDK.Application.DTOs.Auth;
using System.Security.Claims;

namespace TDK.Api.Controllers;

[ApiController]
[Route("api/internal-coaches")]
[Authorize(Roles = "Admin,Staff")]
public class InternalCoachesController : ControllerBase
{
    private readonly IInternalCoachService _internalCoachService;
    private readonly IAuthService _authService;

    public InternalCoachesController(IInternalCoachService internalCoachService, IAuthService authService)
    {
        _internalCoachService = internalCoachService;
        _authService = authService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<InternalCoachProfileDto>>>> GetAll([FromQuery] InternalCoachType? type)
    {
        var result = await _internalCoachService.GetAllAsync(type);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<InternalCoachProfileDto>>> GetById(int id)
    {
        var result = await _internalCoachService.GetByIdAsync(id);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<InternalCoachProfileDto>>> Create(CreateInternalCoachProfileRequest request)
    {
        var result = await _internalCoachService.CreateAsync(request);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<InternalCoachProfileDto>>> Update(int id, UpdateInternalCoachProfileRequest request)
    {
        var result = await _internalCoachService.UpdateAsync(id, request);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("{id}/profile-image")]
    [Authorize(Roles = "Admin")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(ProfileImageValidator.MaximumRequestBytes)]
    public async Task<IActionResult> UpdateProfileImage(int id, [FromForm] IFormFile? image, CancellationToken cancellationToken)
    {
        var validation = await ProfileImageValidator.ValidateAsync(image, cancellationToken);
        if (!validation.IsValid) return BadRequest(new { success = false, message = validation.Error });

        await using var content = image!.OpenReadStream();
        var result = await _internalCoachService.UpdateProfileImageAsync(id, content, validation.FileName, validation.ContentType, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpDelete("{id}/profile-image")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> RemoveProfileImage(int id, CancellationToken cancellationToken)
    {
        var result = await _internalCoachService.RemoveProfileImageAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpPost("{id}/delete")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id, AdminCredentialRequest request, CancellationToken cancellationToken)
    {
        var verification = await _authService.VerifyAdminCredentialsAsync(User.FindFirstValue(ClaimTypes.NameIdentifier)!, request.Email, request.Password);
        if (!verification.Success) return BadRequest(verification);
        var result = await _internalCoachService.DeleteAsync(id, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
