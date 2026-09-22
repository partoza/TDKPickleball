using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TDK.Application.DTOs.Courts;
using TDK.Application.Interfaces;

namespace TDK.Api.Controllers;

[ApiController]
public class CourtController : ControllerBase
{
    private readonly ICourtService _courtService;

    public CourtController(ICourtService courtService)
    {
        _courtService = courtService;
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

    [HttpDelete("api/admin/courts/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _courtService.DeleteAsync(id);
        return result.Success ? Ok(result) : NotFound(result);
    }
}
