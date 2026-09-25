using Microsoft.Extensions.DependencyInjection;

namespace TDK.Api.Extensions;

public static class CorsExtensions
{
    public static IServiceCollection AddCorsPolicies(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddCors(options =>
        {
            options.AddPolicy("Frontend", policy =>
            {
                var origins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? ["http://localhost:5173"];
                policy.WithOrigins(origins)
                    .SetIsOriginAllowed(origin => 
                    {
                        var host = new Uri(origin).Host;
                        return host.EndsWith(".vercel.app") || origins.Contains(origin);
                    })
                    .AllowAnyMethod()
                    .AllowAnyHeader()
                    .AllowCredentials();
            });
        });
        return services;
    }
}
