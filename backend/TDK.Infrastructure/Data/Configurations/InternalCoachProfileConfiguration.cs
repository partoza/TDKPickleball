using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TDK.Domain.Entities;

namespace TDK.Infrastructure.Data.Configurations;

public class InternalCoachProfileConfiguration : IEntityTypeConfiguration<InternalCoachProfile>
{
    public void Configure(EntityTypeBuilder<InternalCoachProfile> builder)
    {
        builder.ToTable("InternalCoachProfiles");
        builder.HasKey(x => x.Id);
        
        builder.Property(x => x.Name).IsRequired().HasMaxLength(150);
        builder.Property(x => x.Email).HasMaxLength(254);
        builder.Property(x => x.Phone).HasMaxLength(30);
    }
}
