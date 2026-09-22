using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TDK.Application.DTOs.Rates;
using TDK.Application.Interfaces;

namespace TDK.Api.Controllers;

[ApiController]
public class RateController : ControllerBase
{
    private readonly IRateService _rateService;

    public RateController(IRateService rateService)
    {
        _rateService = rateService;
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

    [HttpDelete("api/admin/rates/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _rateService.DeleteAsync(id);
        return result.Success ? Ok(result) : NotFound(result);
    }
}
