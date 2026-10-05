namespace TDK.Domain.Entities;

public class Customer
{
    public long Id { get; set; }
    public string FullName { get; set; } = null!;
    public string Username { get; set; } = null!;
    public string NormalizedUsername { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string NormalizedEmail { get; set; } = null!;
    public string? Phone { get; set; }
    public bool IsActive { get; set; } = true;
    public byte[]? NfcTokenHash { get; set; }
    public string? NfcTokenProtected { get; set; }
    public DateTime? NfcIssuedAt { get; set; }
    public DateTime? NfcLastTappedAt { get; set; }
    public DateOnly? CardValidFrom { get; set; }
    public DateOnly? CardValidThrough { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? AdminNotes { get; set; }

    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    public ICollection<CustomerCardTransaction> CardTransactions { get; set; } = new List<CustomerCardTransaction>();
}
