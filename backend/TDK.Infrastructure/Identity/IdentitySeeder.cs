using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;

namespace TDK.Infrastructure.Identity;

public static class IdentitySeeder
{
    public static async Task SeedRolesAsync(IServiceProvider serviceProvider, IConfiguration configuration, bool isDevelopment)
    {
        using var scope = serviceProvider.CreateScope();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        
        foreach (var role in new[] { "Admin", "Staff", "Customer" })
        {
            if (await roleManager.RoleExistsAsync(role)) continue;
            EnsureSucceeded(await roleManager.CreateAsync(new IdentityRole(role)), $"create the {role} role");
        }

        var adminEmail = configuration["SeedAdmin:Email"] ?? (isDevelopment ? "admin@tdk.com" : null);
        var adminPassword = configuration["SeedAdmin:Password"] ?? (isDevelopment ? "Admin123!" : null);
        if (string.IsNullOrWhiteSpace(adminEmail) || string.IsNullOrWhiteSpace(adminPassword)) return;
        var resetPassword = configuration.GetValue("SeedAdmin:ResetPassword", false);

        var adminUser = await userManager.FindByEmailAsync(adminEmail);
        if (adminUser == null)
        {
            adminUser = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                FirstName = "TDK",
                LastName = "Admin",
                IsActive = true,
                MustChangePassword = true
            };

            EnsureSucceeded(await userManager.CreateAsync(adminUser, adminPassword), "create the seed administrator");
        }
        else if (resetPassword)
        {
            var resetToken = await userManager.GeneratePasswordResetTokenAsync(adminUser);
            EnsureSucceeded(await userManager.ResetPasswordAsync(adminUser, resetToken, adminPassword), "reset the seed administrator password");
            adminUser.IsActive = true;
            adminUser.MustChangePassword = true;
            EnsureSucceeded(await userManager.UpdateAsync(adminUser), "update the seed administrator");
        }

        if (!await userManager.IsInRoleAsync(adminUser, "Admin"))
            EnsureSucceeded(await userManager.AddToRoleAsync(adminUser, "Admin"), "assign the seed administrator role");
    }

    private static void EnsureSucceeded(IdentityResult result, string operation)
    {
        if (result.Succeeded) return;
        var errors = string.Join("; ", result.Errors.Select(error => error.Description));
        throw new InvalidOperationException($"Unable to {operation}: {errors}");
    }
}
