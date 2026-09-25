using Microsoft.AspNetCore.Authentication.JwtBearer;
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
                    var isVerifiedPublicEmail = context.Principal?.IsInRole("Customer") == true &&
                        context.Principal.FindFirstValue("auth_provider") == "google_email_verification" &&
                        !string.IsNullOrWhiteSpace(context.Principal.FindFirstValue(ClaimTypes.Email));
                    if (isVerifiedPublicEmail) return;

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
        });

        return services;
    }
}
