using Microsoft.EntityFrameworkCore;
using Serilog;
using TDK.Api.Extensions;
using TDK.Api.Middleware;
using TDK.Infrastructure.Data;
using TDK.Infrastructure.Identity;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateLogger();

builder.Host.UseSerilog();

builder.Services.AddControllers().AddJsonOptions(options => {
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
builder.Services.AddRateLimiter(options => options.AddPolicy("PublicBooking", context =>
    RateLimitPartition.GetFixedWindowLimiter(context.Connection.RemoteIpAddress?.ToString() ?? "unknown", _ => new FixedWindowRateLimiterOptions { PermitLimit = 20, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 })));

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
    await IdentitySeeder.SeedRolesAsync(scope.ServiceProvider, builder.Configuration, app.Environment.IsDevelopment());
}

app.Run();
