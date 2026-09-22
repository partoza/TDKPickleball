using Microsoft.EntityFrameworkCore;
using TDK.Domain.Entities;
using TDK.Domain.Enums;

namespace TDK.Infrastructure.Data;

public static class ApplicationDataSeeder
{
    public static async Task SeedRatesAsync(TdkDbContext context)
    {
        var startTime = new TimeOnly(7, 0);
        var endTime = new TimeOnly(0, 0);

        var trainingRateExists = await context.Rates.AnyAsync(rate =>
            rate.RateType == RateType.Training &&
            rate.StartTime == startTime &&
            rate.EndTime == endTime);

        if (trainingRateExists)
        {
            return;
        }

        var now = DateTime.UtcNow;
        context.Rates.Add(new Rate
        {
            StartTime = startTime,
            EndTime = endTime,
            PricePerHour = 300m,
            RateType = RateType.Training,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        });

        await context.SaveChangesAsync();
    }
}
