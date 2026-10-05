using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TDK.Domain.Entities;

namespace TDK.Infrastructure.Data.Configurations;

public sealed class CustomerConfiguration : IEntityTypeConfiguration<Customer>
{
    public void Configure(EntityTypeBuilder<Customer> builder)
    {
        builder.ToTable("Customers");
        builder.HasKey(customer => customer.Id);
        builder.Property(customer => customer.FullName).IsRequired().HasMaxLength(150);
        builder.Property(customer => customer.Username).IsRequired().HasMaxLength(60);
        builder.Property(customer => customer.NormalizedUsername).IsRequired().HasMaxLength(60)
            .UseCollation("utf8mb4_bin");
        builder.Property(customer => customer.Email).IsRequired().HasMaxLength(254);
        builder.Property(customer => customer.NormalizedEmail).IsRequired().HasMaxLength(254)
            .UseCollation("utf8mb4_bin");
        builder.Property(customer => customer.Phone).HasMaxLength(30);
        builder.Property(customer => customer.NfcTokenHash).HasMaxLength(32);
        builder.Property(customer => customer.AdminNotes).HasMaxLength(1000);
        builder.HasIndex(customer => customer.NormalizedUsername).IsUnique();
        builder.HasIndex(customer => customer.NormalizedEmail).IsUnique();
    }
}
