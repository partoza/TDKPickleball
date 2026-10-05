using TDK.Domain.Enums;

namespace TDK.Domain.Entities;

public sealed class CustomerCardTransaction
{
    public long Id { get; set; }
    public long? CustomerId { get; set; }
    public Customer? Customer { get; set; }
    public CustomerCardTransactionType Type { get; set; }
    public decimal Amount { get; set; }
    public DateOnly ValidFrom { get; set; }
    public DateOnly ValidThrough { get; set; }
    public int ValidityDuration { get; set; }
    public RateValidityUnit ValidityUnit { get; set; }
    public DateTime CreatedAt { get; set; }
}
