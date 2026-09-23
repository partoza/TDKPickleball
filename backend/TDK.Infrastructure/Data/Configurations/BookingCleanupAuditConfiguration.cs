using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TDK.Domain.Entities;

namespace TDK.Infrastructure.Data.Configurations;

public class BookingCleanupAuditConfiguration : IEntityTypeConfiguration<BookingCleanupAudit>
{
    public void Configure(EntityTypeBuilder<BookingCleanupAudit> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.DeletedByUserId).IsRequired().HasMaxLength(450);
        builder.Property(x => x.DeletedByName).IsRequired().HasMaxLength(161);
        builder.Property(x => x.DeletedByEmail).IsRequired().HasMaxLength(254);
        builder.HasIndex(x => x.DeletedAtUtc);
    }
}
