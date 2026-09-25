using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TDK.Application.DTOs.Rates;
using TDK.Application.Interfaces;
using TDK.Application.DTOs.Auth;
using System.Security.Claims;

namespace TDK.Api.Controllers;

[ApiController]
public class RateController : ControllerBase
{
    private readonly IRateService _rateService;
    private readonly IAuthService _authService;

    public RateController(IRateService rateService, IAuthService authService)
    {
        _rateService = rateService;
        _authService = authService;
    }

    [HttpGet("api/rates")]
    [EnableRateLimiting("PublicRead")]
    public async Task<IActionResult> GetAll() => Ok(await _rateService.GetAllAsync());

    [HttpPost("api/admin/rates")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create(CreateRateRequest request)
    {
        var result = await _rateService.CreateAsync(request);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPut("api/admin/rates/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, UpdateRateRequest request)
    {
        var result = await _rateService.UpdateAsync(id, request);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("api/admin/rates/{id}/delete")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id, AdminCredentialRequest request)
    {
        var verification = await _authService.VerifyAdminCredentialsAsync(User.FindFirstValue(ClaimTypes.NameIdentifier)!, request.Email, request.Password);
        if (!verification.Success) return BadRequest(verification);
        var result = await _rateService.DeleteAsync(id);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
