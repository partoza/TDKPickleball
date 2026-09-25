using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TDK.Application.DTOs.Courts;
using TDK.Application.Interfaces;
using TDK.Application.DTOs.Auth;
using System.Security.Claims;

namespace TDK.Api.Controllers;

[ApiController]
public class CourtController : ControllerBase
{
    private readonly ICourtService _courtService;
    private readonly IAuthService _authService;

    public CourtController(ICourtService courtService, IAuthService authService)
    {
        _courtService = courtService;
        _authService = authService;
    }

    [HttpGet("api/courts")]
    [EnableRateLimiting("PublicRead")]
    public async Task<IActionResult> GetAll() => Ok(await _courtService.GetAllAsync());

    [HttpGet("api/courts/{id}")]
    [EnableRateLimiting("PublicRead")]
    public async Task<IActionResult> GetById(int id) => Ok(await _courtService.GetByIdAsync(id));

    [HttpPost("api/admin/courts")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create(CreateCourtRequest request)
    {
        var result = await _courtService.CreateAsync(request);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPut("api/admin/courts/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, UpdateCourtRequest request)
    {
        var result = await _courtService.UpdateAsync(id, request);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("api/admin/courts/{id}/delete")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id, AdminCredentialRequest request)
    {
        var verification = await _authService.VerifyAdminCredentialsAsync(User.FindFirstValue(ClaimTypes.NameIdentifier)!, request.Email, request.Password);
        if (!verification.Success) return BadRequest(verification);
        var result = await _courtService.DeleteAsync(id);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
