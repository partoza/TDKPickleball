using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
    public async Task<IActionResult> GetAll() => Ok(await _courtService.GetAllAsync());

    [HttpGet("api/courts/{id}")]
    public async Task<IActionResult> GetById(int id) => Ok(await _courtService.GetByIdAsync(id));

    [HttpPost("api/admin/courts")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create(CreateCourtRequest request) => Ok(await _courtService.CreateAsync(request));

    [HttpPut("api/admin/courts/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, UpdateCourtRequest request) => Ok(await _courtService.UpdateAsync(id, request));

    [HttpDelete("api/admin/courts/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id) => Ok(await _courtService.DeleteAsync(id));
}