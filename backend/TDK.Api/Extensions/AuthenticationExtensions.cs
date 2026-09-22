using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authentication.OAuth.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Security.Claims;
using TDK.Infrastructure.Data;
using TDK.Infrastructure.Identity;

namespace TDK.Api.Extensions;

public static class AuthenticationExtensions
{
    public static IServiceCollection AddJwtAuthentication(this IServiceCollection services, IConfiguration config)
    {
        var jwtKey = config["Jwt:Key"];
        if (string.IsNullOrWhiteSpace(jwtKey) || jwtKey.Length < 32) throw new InvalidOperationException("Jwt:Key must be configured with at least 32 characters");
        services.AddIdentity<ApplicationUser, IdentityRole>()
            .AddEntityFrameworkStores<TdkDbContext>()
            .AddDefaultTokenProviders();

        var authentication = services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = config["Jwt:Issuer"],
                ValidAudience = config["Jwt:Audience"],
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
            };
            options.Events = new JwtBearerEvents
            {
                OnTokenValidated = async context =>
                {
                    var userId = context.Principal?.FindFirstValue(ClaimTypes.NameIdentifier);
                    if (string.IsNullOrWhiteSpace(userId))
                    {
                        context.Fail("Invalid user identity");
                        return;
                    }
                    var userManager = context.HttpContext.RequestServices.GetRequiredService<UserManager<ApplicationUser>>();
                    var user = await userManager.FindByIdAsync(userId);
                    if (user is null || !user.IsActive) context.Fail("User account is inactive");
                }
            };
        })
        .AddCookie("GoogleExternal", options =>
        {
            options.Cookie.Name = "tdk.google.external";
            options.Cookie.HttpOnly = true;
            options.Cookie.SameSite = SameSiteMode.Lax;
            options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
            options.ExpireTimeSpan = TimeSpan.FromMinutes(5);
        });

        var googleClientId = config["Authentication:Google:ClientId"];
        var googleClientSecret = config["Authentication:Google:ClientSecret"];
        if (!string.IsNullOrWhiteSpace(googleClientId) && !string.IsNullOrWhiteSpace(googleClientSecret))
        {
            authentication.AddGoogle(GoogleDefaults.AuthenticationScheme, options =>
            {
                options.SignInScheme = "GoogleExternal";
                options.ClientId = googleClientId;
                options.ClientSecret = googleClientSecret;
                options.CallbackPath = "/signin-google";
                options.CorrelationCookie.SameSite = SameSiteMode.None;
                options.CorrelationCookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
                options.ClaimActions.MapJsonKey("email_verified", "verified_email");
                options.SaveTokens = false;
            });
        }

        return services;
    }
}
