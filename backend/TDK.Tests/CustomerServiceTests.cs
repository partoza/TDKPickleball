using System.Linq.Expressions;
using System.Security.Cryptography;
using System.Text;
using TDK.Application.DTOs.Customers;
using TDK.Application.Interfaces;
using TDK.Application.Services;
using TDK.Domain.Entities;
using TDK.Domain.Interfaces;
using Xunit;

namespace TDK.Tests;

public sealed class CustomerServiceTests
{
    [Fact]
    public async Task Create_rejects_reserved_username()
    {
        var fixture = new Fixture();
        var result = await fixture.Service.CreateAsync(NewCustomer(username: "admin"), "https://example.com");
        Assert.False(result.Success);
    }

    [Fact]
    public async Task Normalized_username_and_email_are_unique_case_insensitively()
    {
        var fixture = new Fixture();
        Assert.True((await fixture.Service.CreateAsync(NewCustomer(), "https://example.com")).Success);
        Assert.False((await fixture.Service.CreateAsync(NewCustomer(username: "juan-delacruz", email: "other@example.com"), "https://example.com")).Success);
        Assert.False((await fixture.Service.CreateAsync(NewCustomer(username: "other-user", email: " JUAN@EXAMPLE.COM "), "https://example.com")).Success);
    }

    [Fact]
    public async Task Create_automatically_issues_recoverable_high_entropy_card()
    {
        var fixture = new Fixture();
        var created = await fixture.Service.CreateAsync(NewCustomer(), "https://example.com");
        var rawToken = created.Data!.Card.Url.Split('/').Last();
        var stored = fixture.Customers.Items.Single();
        Assert.True(rawToken.Length >= 40);
        Assert.Equal(32, stored.NfcTokenHash!.Length);
        Assert.NotEqual(rawToken, Convert.ToBase64String(stored.NfcTokenHash));
        Assert.True(CryptographicOperations.FixedTimeEquals(stored.NfcTokenHash, SHA256.HashData(Encoding.UTF8.GetBytes(rawToken))));
        Assert.Equal(created.Data.Card.Url, (await fixture.Service.GetNfcAsync(stored.Id, "https://example.com")).Data!.Url);
        Assert.Equal(new DateOnly(2026, 10, 5), stored.CardValidFrom);
        Assert.Equal(new DateOnly(2027, 1, 4), stored.CardValidThrough);
        var purchase = Assert.Single(fixture.CardTransactions.Items);
        Assert.Equal(1200m, purchase.Amount);
        Assert.Equal(TDK.Domain.Enums.CustomerCardTransactionType.Purchase, purchase.Type);
    }

    [Fact]
    public async Task Renewal_extends_validity_and_records_revenue_transaction()
    {
        var fixture = new Fixture();
        var created = await fixture.Service.CreateAsync(NewCustomer(), "https://example.com");

        var renewal = await fixture.Service.RenewAsync(created.Data!.Customer.Id);

        Assert.True(renewal.Success);
        Assert.Equal(new DateOnly(2027, 1, 5), renewal.Data!.ValidFrom);
        Assert.Equal(new DateOnly(2027, 4, 4), renewal.Data.ValidThrough);
        Assert.Equal(new DateOnly(2026, 10, 5), fixture.Customers.Items.Single().CardValidFrom);
        Assert.Equal(new DateOnly(2027, 4, 4), fixture.Customers.Items.Single().CardValidThrough);
        Assert.Equal(2, fixture.CardTransactions.Items.Count);
        Assert.Equal(TDK.Domain.Enums.CustomerCardTransactionType.Renewal, fixture.CardTransactions.Items.Last().Type);
    }

    [Fact]
    public async Task Expired_card_is_not_publicly_available()
    {
        var fixture = new Fixture();
        var created = await fixture.Service.CreateAsync(NewCustomer(), "https://example.com");
        var token = created.Data!.Card.Url.Split('/').Last();
        fixture.Customers.Items.Single().CardValidThrough = new DateOnly(2026, 10, 4);

        Assert.False((await fixture.Service.ValidateCardAsync("juan-delacruz", token, "juan@example.com")).Success);
    }

    [Fact]
    public async Task Valid_public_token_opens_card_and_invalid_token_is_rejected()
    {
        var fixture = new Fixture();
        var created = await fixture.Service.CreateAsync(NewCustomer(), "https://example.com");
        var token = created.Data!.Card.Url.Split('/').Last();
        Assert.True((await fixture.Service.ValidateCardAsync("juan-delacruz", token, "juan@example.com")).Success);
        Assert.False((await fixture.Service.ValidateCardAsync("juan-delacruz", token + "x", "juan@example.com")).Success);
        Assert.False((await fixture.Service.ValidateCardAsync("juan-delacruz", token, "someone-else@example.com")).Success);
    }

    [Fact]
    public async Task Customer_profile_image_is_saved_and_visible_on_public_card()
    {
        var fixture = new Fixture();
        var created = await fixture.Service.CreateAsync(NewCustomer(), "https://example.com");
        var token = created.Data!.Card.Url.Split('/').Last();
        await using var content = new MemoryStream([1, 2, 3]);

        var uploaded = await fixture.Service.UpdateProfileImageAsync(created.Data.Customer.Id, content, "profile.jpg", "image/jpeg");
        var publicCard = await fixture.Service.ValidateCardAsync("juan-delacruz", token, "juan@example.com");

        Assert.True(uploaded.Success);
        Assert.Equal("https://res.cloudinary.com/test/image/upload/v1/customers/profile.jpg", uploaded.Data!.ProfilePictureUrl);
        Assert.Equal(uploaded.Data.ProfilePictureUrl, publicCard.Data!.ProfilePictureUrl);
    }

    [Fact]
    public async Task Inactive_customer_is_hidden_and_reactivation_preserves_unreplaced_card()
    {
        var fixture = new Fixture();
        var created = await fixture.Service.CreateAsync(NewCustomer(), "https://example.com");
        var token = created.Data!.Card.Url.Split('/').Last();
        await fixture.Service.SetActiveAsync(created.Data.Customer.Id, false);
        Assert.Empty((await fixture.Service.SearchAsync("juan")).Data!);
        Assert.False((await fixture.Service.ValidateCardAsync("juan-delacruz", token, "juan@example.com")).Success);
        await fixture.Service.SetActiveAsync(created.Data.Customer.Id, true);
        Assert.True((await fixture.Service.ValidateCardAsync("juan-delacruz", token, "juan@example.com")).Success);
    }

    [Fact]
    public async Task Only_inactive_customer_can_be_deleted()
    {
        var fixture = new Fixture();
        var created = await fixture.Service.CreateAsync(NewCustomer(), "https://example.com");
        var id = created.Data!.Customer.Id;
        Assert.False((await fixture.Service.DeleteAsync(id)).Success);
        await fixture.Service.SetActiveAsync(id, false);
        Assert.True((await fixture.Service.DeleteAsync(id)).Success);
        Assert.Empty(fixture.Customers.Items);
    }

    [Fact]
    public async Task Card_never_returns_another_customers_bookings()
    {
        var fixture = new Fixture();
        var first = await fixture.Service.CreateAsync(NewCustomer(), "https://example.com");
        var second = await fixture.Service.CreateAsync(NewCustomer("maria-santos", "maria@example.com"), "https://example.com");
        fixture.Bookings.Items.Add(new Booking { Id = 1, CustomerId = second.Data!.Customer.Id, BookingReference = "TDK-OTHER", CourtId = 1, CustomerName = "Maria", Email = "maria@example.com", BookingDate = new DateOnly(2026, 10, 8), StartTime = new(10, 0), EndTime = new(11, 0), Status = TDK.Domain.Enums.BookingStatus.Reserved });
        var token = first.Data!.Card.Url.Split('/').Last();
        var card = await fixture.Service.ValidateCardAsync("juan-delacruz", token, "juan@example.com");
        Assert.True(card.Success);
        Assert.Empty(card.Data!.Upcoming);
        Assert.Empty(card.Data.Pending);
        Assert.Empty(card.Data.Past);
        Assert.Empty(card.Data.Cancelled);
    }

    private static CreateCustomerRequest NewCustomer(string username = "juan-delacruz", string email = "juan@example.com") =>
        new("Juan Dela Cruz", username, email, "09123456789", null);

    private sealed class Fixture
    {
        public MemoryRepository<Customer> Customers { get; } = new();
        public MemoryRepository<Booking> Bookings { get; } = new();
        public MemoryRepository<CustomerCardTransaction> CardTransactions { get; } = new();
        public CustomerService Service { get; }
        public Fixture()
        {
            var rates = new MemoryRepository<Rate>();
            rates.Items.Add(new Rate { Id = 1, RateType = TDK.Domain.Enums.RateType.CustomerCard, PricePerHour = 1200, ValidityDuration = 3, ValidityUnit = TDK.Domain.Enums.RateValidityUnit.Month, IsActive = true });
            Service = new(Customers, Bookings, new MemoryRepository<Court>(), new MemoryRepository<Schedule>(), new MemoryRepository<Promo>(), rates, CardTransactions, new FixedClock(), new TestTokenProtector(), new NullEmailService(), new TestProfileImageService());
        }
    }
}

internal sealed class TestProfileImageService : IProfileImageService
{
    public Task<TDK.Application.DTOs.Auth.ProfileImageUploadResult> UploadAsync(Stream content, string fileName, string contentType, CancellationToken cancellationToken = default) =>
        Task.FromResult(new TDK.Application.DTOs.Auth.ProfileImageUploadResult("https://res.cloudinary.com/test/image/upload/v1/customers/profile.jpg", "customers/profile"));
    public Task DeleteAsync(string publicId, CancellationToken cancellationToken = default) => Task.CompletedTask;
}

internal sealed class TestTokenProtector : INfcTokenProtector
{
    public string Protect(string token) => Convert.ToBase64String(Encoding.UTF8.GetBytes(token));
    public bool TryUnprotect(string protectedToken, out string token)
    {
        try { token = Encoding.UTF8.GetString(Convert.FromBase64String(protectedToken)); return true; }
        catch { token = string.Empty; return false; }
    }
}

internal sealed class MemoryRepository<T> : IRepository<T> where T : class
{
    private long _nextId = 1;
    public List<T> Items { get; } = [];
    public Task<T?> GetByIdAsync(object id) => Task.FromResult(Items.FirstOrDefault(item => Equals(item.GetType().GetProperty("Id")?.GetValue(item), id)));
    public Task<IEnumerable<T>> GetAllAsync() => Task.FromResult<IEnumerable<T>>(Items.ToList());
    public Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate) => Task.FromResult<IEnumerable<T>>(Items.AsQueryable().Where(predicate).ToList());
    public Task AddAsync(T entity) { var property = entity.GetType().GetProperty("Id"); if (property?.PropertyType == typeof(long) && (long)(property.GetValue(entity) ?? 0L) == 0) property.SetValue(entity, _nextId++); Items.Add(entity); return Task.CompletedTask; }
    public void Update(T entity) { }
    public void Delete(T entity) => Items.Remove(entity);
    public Task<int> SaveChangesAsync() => Task.FromResult(1);
}

internal sealed class FixedClock : IBusinessClock
{
    public DateTimeOffset UtcNow => new(2026, 10, 5, 0, 0, 0, TimeSpan.Zero);
    public DateTime ManilaNow => ToManilaTime(UtcNow).DateTime;
    public DateOnly ManilaToday => DateOnly.FromDateTime(ManilaNow);
    public DateTimeOffset ToManilaTime(DateTimeOffset value) => value.ToOffset(TimeSpan.FromHours(8));
}
