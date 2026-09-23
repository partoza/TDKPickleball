using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TDK.Application.DTOs.Common;
using TDK.Application.DTOs.Staff;
using TDK.Application.Interfaces;
using TDK.Domain.Enums;

namespace TDK.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class StaffController : ControllerBase
{
    private readonly IStaffService _staffService;

    public StaffController(IStaffService staffService)
    {
        _staffService = staffService;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<IEnumerable<StaffProfileDto>>>> GetAll([FromQuery] StaffType? type)
    {
        var result = await _staffService.GetAllAsync(type);
        return Ok(result);
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<StaffProfileDto>>> GetById(int id)
    {
        var result = await _staffService.GetByIdAsync(id);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<StaffProfileDto>>> Create(CreateStaffProfileRequest request)
    {
        var result = await _staffService.CreateAsync(request);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<StaffProfileDto>>> Update(int id, UpdateStaffProfileRequest request)
    {
        var result = await _staffService.UpdateAsync(id, request);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        var result = await _staffService.DeleteAsync(id);
        return Ok(result);
    }
}
