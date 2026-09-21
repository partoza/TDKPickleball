using Microsoft.AspNetCore.Mvc;
using TDK.Domain.Entities;
using TDK.Domain.Interfaces;

namespace TDK.Api.Controllers;

[ApiController]
[Route("api/time-slots")]
public class TimeSlotController : ControllerBase
{
    private readonly IRepository<TimeSlot> _timeSlotRepo;

    public TimeSlotController(IRepository<TimeSlot> timeSlotRepo)
    {
        _timeSlotRepo = timeSlotRepo;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _timeSlotRepo.GetAllAsync());
}