using Microsoft.EntityFrameworkCore;
using Serilog;
using TDK.Api.Extensions;
using TDK.Api.Middleware;
using TDK.Infrastructure.Data;
using TDK.Infrastructure.Identity;
using System.Threading.RateLimiting;
using TDK.Api.Serialization;

var builder = WebApplication.CreateBuilder(args);

Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateLogger();

builder.Host.UseSerilog();

builder.Services.AddControllers().AddJsonOptions(options => {
    options.JsonSerializerOptions.Converters.Add(new FlexibleTimeOnlyJsonConverter());
    options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerWithJwt();

builder.Services.AddDbContext<TdkDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddJwtAuthentication(builder.Configuration);
builder.Services.AddMemoryCache();
builder.Services.AddApplicationServices();
builder.Services.AddCorsPolicies(builder.Configuration);
var rateLimitConfig = builder.Configuration.GetSection("RateLimiting");
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter($"global:{ClientIp(context)}", _ => FixedWindow(
            rateLimitConfig.GetValue("GlobalPermitLimit", 300),
            TimeSpan.FromSeconds(rateLimitConfig.GetValue("GlobalWindowSeconds", 60)))));

    options.AddPolicy("PublicRead", context =>
        RateLimitPartition.GetFixedWindowLimiter($"read:{ClientIp(context)}", _ => FixedWindow(
            rateLimitConfig.GetValue("PublicReadPermitLimit", 120),
            TimeSpan.FromSeconds(rateLimitConfig.GetValue("PublicReadWindowSeconds", 60)))));

    options.AddPolicy("Authentication", context =>
        RateLimitPartition.GetFixedWindowLimiter($"auth:{ClientIp(context)}", _ => FixedWindow(
            rateLimitConfig.GetValue("AuthenticationPermitLimit", 10),
            TimeSpan.FromMinutes(rateLimitConfig.GetValue("AuthenticationWindowMinutes", 5)))));

    options.AddPolicy("Email", context =>
        RateLimitPartition.GetFixedWindowLimiter($"email:{ClientIp(context)}", _ => FixedWindow(
            rateLimitConfig.GetValue("EmailPermitLimit", 10),
            TimeSpan.FromMinutes(rateLimitConfig.GetValue("EmailWindowMinutes", 10)))));

    options.OnRejected = async (context, cancellationToken) =>
    {
        var retryAfterSeconds = 60;
        if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
        {
            retryAfterSeconds = Math.Max(1, (int)Math.Ceiling(retryAfter.TotalSeconds));
            context.HttpContext.Response.Headers.RetryAfter = retryAfterSeconds.ToString(System.Globalization.CultureInfo.InvariantCulture);
        }

        await context.HttpContext.Response.WriteAsJsonAsync(new
        {
            success = false,
            message = "Too many requests from this IP address. Please wait before trying again.",
            retryAfterSeconds
        }, cancellationToken);
    };
});

var app = builder.Build();

if (!app.Environment.IsDevelopment()) app.UseHsts();
app.UseHttpsRedirection();
app.Use(async (context, next) => { context.Response.Headers.XContentTypeOptions = "nosniff"; context.Response.Headers.XFrameOptions = "DENY"; await next(); });

app.UseMiddleware<ExceptionMiddleware>();
app.UseMiddleware<RequestLoggingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseRouting();
app.UseCors("Frontend");
app.UseRateLimiter();
app.UseAuthentication();
app.Use(async (context, next) =>
{
    var mustChange = context.User.FindFirst("must_change_password")?.Value == "true";
    var allowed = context.Request.Path.StartsWithSegments("/api/auth/change-password") || context.Request.Path.StartsWithSegments("/api/auth/me") || context.Request.Path.StartsWithSegments("/api/auth/logout");
    if (context.User.Identity?.IsAuthenticated == true && mustChange && !allowed)
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        await context.Response.WriteAsJsonAsync(new { success = false, message = "Password change required" });
        return;
    }
    await next();
});
app.UseAuthorization();
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<TdkDbContext>();
    await context.Database.MigrateAsync();
    await ApplicationDataSeeder.SeedRatesAsync(context);
    await IdentitySeeder.SeedRolesAsync(scope.ServiceProvider, builder.Configuration, app.Environment.IsDevelopment());
}

app.Run();

static string ClientIp(HttpContext context) =>
    context.Connection.RemoteIpAddress?.MapToIPv6().ToString() ?? "unknown";

static FixedWindowRateLimiterOptions FixedWindow(int permitLimit, TimeSpan window) => new()
{
    PermitLimit = Math.Max(1, permitLimit),
    Window = window,
    QueueLimit = 0,
    AutoReplenishment = true
};
