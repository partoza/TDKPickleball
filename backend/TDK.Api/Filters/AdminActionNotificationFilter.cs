using System.Security.Claims;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using TDK.Application.Interfaces;
using TDK.Domain.Entities;
using TDK.Infrastructure.Data;

namespace TDK.Api.Filters;

public sealed class AdminActionNotificationFilter : IAsyncActionFilter
{
    private static readonly HashSet<string> ReadOnlyMethods = new(StringComparer.OrdinalIgnoreCase) { "GET", "HEAD", "OPTIONS" };
    private readonly TdkDbContext _db;
    private readonly IBusinessClock _clock;
    private readonly ILogger<AdminActionNotificationFilter> _logger;

    public AdminActionNotificationFilter(TdkDbContext db, IBusinessClock clock, ILogger<AdminActionNotificationFilter> logger)
    {
        _db = db;
        _clock = clock;
        _logger = logger;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var executed = await next();
        var request = context.HttpContext.Request;
        var user = context.HttpContext.User;
        context.ActionDescriptor.RouteValues.TryGetValue("action", out var actionValue);
        var action = actionValue ?? request.Method;
        if (ReadOnlyMethods.Contains(request.Method) || executed.Exception is not null || !WasSuccessful(executed) ||
            user.Identity?.IsAuthenticated != true || (!user.IsInRole("Admin") && !user.IsInRole("Staff")) ||
            action.StartsWith("Get", StringComparison.OrdinalIgnoreCase) || action.StartsWith("Verify", StringComparison.OrdinalIgnoreCase) ||
            action.StartsWith("Validate", StringComparison.OrdinalIgnoreCase) ||
            request.Path.StartsWithSegments("/api/auth") || request.Path.StartsWithSegments("/api/admin/notifications"))
            return;

        context.ActionDescriptor.RouteValues.TryGetValue("controller", out var controllerValue);
        var controller = controllerValue ?? "Administration";
        var responseMessage = GetResponseMessage(executed.Result);
        var resource = Humanize(controller.Replace("Controller", "", StringComparison.OrdinalIgnoreCase));
        var title = string.IsNullOrWhiteSpace(responseMessage)
            ? $"{resource} {Humanize(action).ToLowerInvariant()}"
            : responseMessage.Trim();
        var actor = user.FindFirstValue(ClaimTypes.Name);
        if (string.IsNullOrWhiteSpace(actor)) actor = user.FindFirstValue(ClaimTypes.Email) ?? "Administrator";
        var routeId = context.RouteData.Values.TryGetValue("id", out var id) && id is not null ? $" · Record {id}" : "";
        var nowUtc = _clock.UtcNow.UtcDateTime;

        try
        {
            _db.Notifications.Add(new Notification
            {
                Title = Truncate(title, 100),
                Message = Truncate($"{actor} completed this {resource.ToLowerInvariant()} action{routeId}.", 500),
                CreatedAt = nowUtc,
                ExpiresAt = nowUtc.AddDays(30)
            });
            await _db.SaveChangesAsync(context.HttpContext.RequestAborted);
        }
        catch (Exception exception)
        {
            _logger.LogWarning(exception, "The admin action completed, but its notification could not be recorded");
        }
    }

    private static bool WasSuccessful(ActionExecutedContext context)
    {
        if (context.Result is StatusCodeResult statusCodeResult) return statusCodeResult.StatusCode is >= 200 and < 300;
        if (context.Result is ObjectResult objectResult)
        {
            if (objectResult.StatusCode is >= 400) return false;
            var success = objectResult.Value?.GetType().GetProperty("Success")?.GetValue(objectResult.Value);
            return success is not bool value || value;
        }
        return context.HttpContext.Response.StatusCode is >= 200 and < 300;
    }

    private static string? GetResponseMessage(IActionResult? result) =>
        result is ObjectResult { Value: not null } objectResult
            ? objectResult.Value.GetType().GetProperty("Message")?.GetValue(objectResult.Value) as string
            : null;

    private static string Humanize(string value) => Regex.Replace(value, "(?<!^)([A-Z])", " $1").Trim();
    private static string Truncate(string value, int maximumLength) => value.Length <= maximumLength ? value : value[..maximumLength];
}
