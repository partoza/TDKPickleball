using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TDK.Domain.Entities;

namespace TDK.Infrastructure.Data.Configurations;

public class BookingConfiguration : IEntityTypeConfiguration<Booking>
{
    public void Configure(EntityTypeBuilder<Booking> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.BookingReference).IsUnique();
        
        builder.Property(x => x.BookingReference).IsRequired().HasMaxLength(50);
        builder.Property(x => x.CustomerName).IsRequired().HasMaxLength(150);
        builder.Property(x => x.Email).IsRequired().HasMaxLength(254);
        builder.Property(x => x.Phone).HasMaxLength(30);
        builder.Property(x => x.TotalAmount).HasPrecision(18, 2);
        builder.Property(x => x.AmountPaid).HasPrecision(18, 2);
        builder.Property(x => x.ReceiptFileName).HasMaxLength(100);
        builder.Property(x => x.ReceiptContentType).HasMaxLength(50);

        builder.HasOne(x => x.Court).WithMany(c => c.Bookings).HasForeignKey(x => x.CourtId).OnDelete(DeleteBehavior.Restrict);
    }
}
