using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TDK.Domain.Entities;

namespace TDK.Infrastructure.Data.Configurations;

public class TimeSlotConfiguration : IEntityTypeConfiguration<TimeSlot>
{
    public void Configure(EntityTypeBuilder<TimeSlot> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.DisplayName).IsRequired().HasMaxLength(20);

        var slots = new List<TimeSlot>();
        for (int i = 7; i <= 23; i++)
        {
            var start = new TimeOnly(i, 0);
            var end = start.AddHours(1);
            slots.Add(new TimeSlot
            {
                Id = i - 6,
                StartTime = start,
                EndTime = end,
                DisplayName = $"{start:HH:mm} - {end:HH:mm}",
                SortOrder = i - 6,
                IsActive = true
            });
        }
        
        builder.HasData(slots);
    }
}