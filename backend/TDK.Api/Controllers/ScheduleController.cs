using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;
using TDK.Application.DTOs.Common;
using TDK.Application.DTOs.Schedules;
using TDK.Application.Interfaces;

namespace TDK.Api.Controllers;

[ApiController]
public class ScheduleController : ControllerBase
{
    private readonly IScheduleService _scheduleService;
    private readonly IAuthService _authService;
    private readonly IPublicBookingWindowService _publicBookingWindowService;

    public ScheduleController(IScheduleService scheduleService, IAuthService authService, IPublicBookingWindowService publicBookingWindowService)
    {
        _scheduleService = scheduleService;
        _authService = authService;
        _publicBookingWindowService = publicBookingWindowService;
    }

    [HttpGet("api/public-booking-window")]
    [EnableRateLimiting("PublicRead")]
    public async Task<IActionResult> GetPublicBookingWindow() => Ok(await _publicBookingWindowService.GetAsync());

    [HttpPut("api/admin/public-booking-window")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdatePublicBookingWindow(UpdatePublicBookingWindowRequest request)
    {
        var result = await _publicBookingWindowService.UpdateAsync(request, User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("api/schedule-board")]
    [EnableRateLimiting("PublicRead")]
    public async Task<IActionResult> GetBoard([FromQuery] DateOnly date) => Ok(await _scheduleService.GetBoardAsync(date));

    [HttpGet("api/admin/schedules")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> GetAll([FromQuery] DateOnly date, [FromQuery] int? courtId) => Ok(await _scheduleService.GetSchedulesAsync(date, courtId));

    [HttpGet("api/admin/schedules/{id}")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> GetById(long id) => Ok(await _scheduleService.GetByIdAsync(id));

    [HttpPost("api/admin/schedules")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create(int courtId, DateOnly date, int timeSlotId) => Ok(await _scheduleService.CreateAsync(courtId, date, timeSlotId));

    [HttpPut("api/admin/schedules/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(long id, UpdateScheduleRequest request) => Ok(await _scheduleService.UpdateAsync(id, request, User.FindFirstValue(ClaimTypes.NameIdentifier)!, User.FindFirstValue(ClaimTypes.Name) ?? "Staff"));

    [HttpPost("api/admin/schedules/{id}/delete")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(long id, [FromBody] DeleteScheduleRequest request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(ApiResponse<bool>.Fail("Admin email and password are required"));

        var verification = await _authService.VerifyAdminCredentialsAsync(
            User.FindFirstValue(ClaimTypes.NameIdentifier)!, request.Email, request.Password);
        if (!verification.Success) return Ok(verification);
        return Ok(await _scheduleService.DeleteAsync(id));
    }

    [HttpPost("api/admin/schedules/bulk-update")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> BulkUpdate(BulkUpdateRequest request) => Ok(await _scheduleService.BulkUpdateAsync(request, User.FindFirstValue(ClaimTypes.NameIdentifier)!, User.FindFirstValue(ClaimTypes.Name) ?? "Staff"));

    [HttpPost("api/admin/schedules/copy")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Copy(CopyScheduleRequest request) => Ok(await _scheduleService.CopyScheduleAsync(request, User.FindFirstValue(ClaimTypes.NameIdentifier)!));
}
