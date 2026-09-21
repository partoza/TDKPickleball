using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TDK.Domain.Entities;

namespace TDK.Infrastructure.Data.Configurations;

public class ScheduleConfiguration : IEntityTypeConfiguration<Schedule>
{
    public void Configure(EntityTypeBuilder<Schedule> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => new { x.CourtId, x.ScheduleDate, x.TimeSlotId }).IsUnique();
        
        builder.Property(x => x.RowVersion).IsRowVersion();

        builder.HasOne(x => x.Court).WithMany(c => c.Schedules).HasForeignKey(x => x.CourtId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.TimeSlot).WithMany(t => t.Schedules).HasForeignKey(x => x.TimeSlotId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.Booking).WithMany(b => b.Schedules).HasForeignKey(x => x.BookingId).OnDelete(DeleteBehavior.SetNull);
    }
}