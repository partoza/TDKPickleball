using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TDK.Application.DTOs.Schedules;
using TDK.Application.Interfaces;

namespace TDK.Api.Controllers;

[ApiController]
public class ScheduleController : ControllerBase
{
    private readonly IScheduleService _scheduleService;

    public ScheduleController(IScheduleService scheduleService)
    {
        _scheduleService = scheduleService;
    }

    [HttpGet("api/schedule-board")]
    public async Task<IActionResult> GetBoard([FromQuery] DateOnly date) => Ok(await _scheduleService.GetBoardAsync(date));

    [HttpGet("api/admin/schedules")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> GetAll([FromQuery] DateOnly date, [FromQuery] int? courtId) => Ok(await _scheduleService.GetSchedulesAsync(date, courtId));

    [HttpGet("api/admin/schedules/{id}")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> GetById(long id) => Ok(await _scheduleService.GetByIdAsync(id));

    [HttpPost("api/admin/schedules")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> Create(int courtId, DateOnly date, int timeSlotId) => Ok(await _scheduleService.CreateAsync(courtId, date, timeSlotId));

    [HttpPut("api/admin/schedules/{id}")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> Update(long id, UpdateScheduleRequest request) => Ok(await _scheduleService.UpdateAsync(id, request, User.FindFirstValue(ClaimTypes.NameIdentifier)!));

    [HttpDelete("api/admin/schedules/{id}")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> Delete(long id) => Ok(await _scheduleService.DeleteAsync(id));

    [HttpPost("api/admin/schedules/bulk-update")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> BulkUpdate(BulkUpdateRequest request) => Ok(await _scheduleService.BulkUpdateAsync(request, User.FindFirstValue(ClaimTypes.NameIdentifier)!));

    [HttpPost("api/admin/schedules/copy")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> Copy(CopyScheduleRequest request) => Ok(await _scheduleService.CopyScheduleAsync(request, User.FindFirstValue(ClaimTypes.NameIdentifier)!));
}
