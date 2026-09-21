using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TDK.Domain.Entities;

namespace TDK.Infrastructure.Data.Configurations;

public class CourtConfiguration : IEntityTypeConfiguration<Court>
{
    public void Configure(EntityTypeBuilder<Court> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Name).IsRequired().HasMaxLength(100);
        builder.Property(x => x.DisplayName).IsRequired().HasMaxLength(100);

        builder.HasData(
            new Court { Id = 1, Name = "Court 1", DisplayName = "Court 1", IsActive = true, SortOrder = 1, OpenTime = new TimeOnly(7, 0), CloseTime = new TimeOnly(0, 0), CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Court { Id = 2, Name = "Court 2", DisplayName = "Court 2", IsActive = true, SortOrder = 2, OpenTime = new TimeOnly(7, 0), CloseTime = new TimeOnly(0, 0), CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        );
    }
}
