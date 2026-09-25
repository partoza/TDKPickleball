using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TDK.Application.Interfaces;

namespace TDK.Api.Controllers;

[ApiController]
[Route("api/admin/notifications")]
[Authorize(Roles = "Admin,Staff")]
public sealed class NotificationController : ControllerBase
{
    private readonly INotificationService _notifications;

    public NotificationController(INotificationService notifications)
    {
        _notifications = notifications;
    }

    [HttpGet]
    public async Task<IActionResult> GetActive() => Ok(await _notifications.GetActiveAsync());
}
