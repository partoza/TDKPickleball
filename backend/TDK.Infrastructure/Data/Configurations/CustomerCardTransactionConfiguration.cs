using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TDK.Domain.Entities;

namespace TDK.Infrastructure.Data.Configurations;

public sealed class CustomerCardTransactionConfiguration : IEntityTypeConfiguration<CustomerCardTransaction>
{
    public void Configure(EntityTypeBuilder<CustomerCardTransaction> builder)
    {
        builder.ToTable("CustomerCardTransactions");
        builder.HasKey(transaction => transaction.Id);
        builder.Property(transaction => transaction.Amount).HasPrecision(18, 2);
        builder.HasIndex(transaction => transaction.CustomerId);
        builder.HasIndex(transaction => transaction.CreatedAt);
        builder.HasOne(transaction => transaction.Customer)
            .WithMany(customer => customer.CardTransactions)
            .HasForeignKey(transaction => transaction.CustomerId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
