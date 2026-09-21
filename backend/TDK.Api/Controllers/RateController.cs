using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
    public async Task<IActionResult> GetAll() => Ok(await _rateService.GetAllAsync());

    [HttpPost("api/admin/rates")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create(CreateRateRequest request) => Ok(await _rateService.CreateAsync(request));

    [HttpPut("api/admin/rates/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, UpdateRateRequest request) => Ok(await _rateService.UpdateAsync(id, request));

    [HttpDelete("api/admin/rates/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id) => Ok(await _rateService.DeleteAsync(id));
}