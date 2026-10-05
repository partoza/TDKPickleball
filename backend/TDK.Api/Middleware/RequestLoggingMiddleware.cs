using Microsoft.AspNetCore.Http;
using Serilog;
using System.Diagnostics;

namespace TDK.Api.Middleware;

public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;

    public RequestLoggingMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var sw = Stopwatch.StartNew();
        await _next(context);
        sw.Stop();
        
        var safePath = context.Request.Path.StartsWithSegments("/api/customer/card")
            ? "/api/customer/card/[redacted]"
            : context.Request.Path.Value;
        Log.Information("Handled {Method} {Path} with status {StatusCode} in {Elapsed}ms",
            context.Request.Method,
            safePath,
            context.Response.StatusCode,
            sw.ElapsedMilliseconds);
    }
}
