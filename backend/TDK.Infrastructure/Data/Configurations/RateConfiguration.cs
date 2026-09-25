using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TDK.Domain.Entities;
using TDK.Domain.Enums;

namespace TDK.Infrastructure.Data.Configurations;

public class RateConfiguration : IEntityTypeConfiguration<Rate>
{
    public void Configure(EntityTypeBuilder<Rate> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.PricePerHour).HasPrecision(18, 2);

        builder.HasData(
            new Rate { Id = 1, StartTime = new TimeOnly(7, 0), EndTime = new TimeOnly(17, 0), PricePerHour = 320m, RateType = RateType.Booking, IsActive = true, CreatedAt = new DateTime(2026, 9, 24, 11, 23, 49, 259, DateTimeKind.Utc).AddTicks(8218), UpdatedAt = new DateTime(2026, 9, 24, 11, 23, 49, 259, DateTimeKind.Utc).AddTicks(8221) },
            new Rate { Id = 2, StartTime = new TimeOnly(17, 0), EndTime = new TimeOnly(0, 0), PricePerHour = 400m, RateType = RateType.Booking, IsActive = true, CreatedAt = new DateTime(2026, 9, 24, 11, 23, 49, 259, DateTimeKind.Utc).AddTicks(8224), UpdatedAt = new DateTime(2026, 9, 24, 11, 23, 49, 259, DateTimeKind.Utc).AddTicks(8225) },
            new Rate { Id = 3, StartTime = new TimeOnly(7, 0), EndTime = new TimeOnly(0, 0), PricePerHour = 300m, RateType = RateType.Training, IsActive = true, CreatedAt = new DateTime(2026, 9, 24, 11, 23, 49, 259, DateTimeKind.Utc).AddTicks(8228), UpdatedAt = new DateTime(2026, 9, 24, 11, 23, 49, 259, DateTimeKind.Utc).AddTicks(8228) }
        );
    }
}
