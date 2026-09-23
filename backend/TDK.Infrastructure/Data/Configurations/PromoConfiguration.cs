using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TDK.Domain.Entities;

namespace TDK.Infrastructure.Data.Configurations;

public class PromoConfiguration : IEntityTypeConfiguration<Promo>
{
    public void Configure(EntityTypeBuilder<Promo> builder)
    {
        builder.ToTable("Promos");
        builder.HasKey(p => p.Id);

        builder.Property(p => p.Code)
            .IsRequired()
            .HasMaxLength(50);
        
        builder.HasIndex(p => p.Code).IsUnique();

        builder.Property(p => p.Description)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(p => p.Type)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(p => p.Value)
            .IsRequired()
            .HasPrecision(18, 2);
    }
}
