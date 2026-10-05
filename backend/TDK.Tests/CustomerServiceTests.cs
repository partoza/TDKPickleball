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
        var result = await fixture.Service.CreateAsync(NewCustomer(username: "admin"));
        Assert.False(result.Success);
    }

    [Fact]
    public async Task Normalized_username_and_email_are_unique_case_insensitively()
    {
        var fixture = new Fixture();
        Assert.True((await fixture.Service.CreateAsync(NewCustomer())).Success);
        Assert.False((await fixture.Service.CreateAsync(NewCustomer(username: "juan-delacruz", email: "other@example.com"))).Success);
        Assert.False((await fixture.Service.CreateAsync(NewCustomer(username: "other-user", email: " JUAN@EXAMPLE.COM "))).Success);
    }

    [Fact]
    public async Task Issue_returns_high_entropy_url_and_stores_only_sha256_hash()
    {
        var fixture = new Fixture();
        var created = await fixture.Service.CreateAsync(NewCustomer());
        var issued = await fixture.Service.IssueNfcAsync(created.Data!.Id, "https://example.com");
        var rawToken = issued.Data!.Url.Split('/').Last();
        var stored = fixture.Customers.Items.Single();
        Assert.True(rawToken.Length >= 40);
        Assert.Equal(32, stored.NfcTokenHash!.Length);
        Assert.NotEqual(rawToken, Convert.ToBase64String(stored.NfcTokenHash));
        Assert.True(CryptographicOperations.FixedTimeEquals(stored.NfcTokenHash, SHA256.HashData(Encoding.UTF8.GetBytes(rawToken))));
    }

    [Fact]
    public async Task Matching_email_and_valid_token_can_open_only_their_card()
    {
        var fixture = new Fixture();
        var created = await fixture.Service.CreateAsync(NewCustomer());
        var issued = await fixture.Service.IssueNfcAsync(created.Data!.Id, "https://example.com");
        var token = issued.Data!.Url.Split('/').Last();
        Assert.True((await fixture.Service.ValidateCardAsync("juan-delacruz", token, "JUAN@example.com")).Success);
        Assert.False((await fixture.Service.ValidateCardAsync("juan-delacruz", token, "intruder@example.com")).Success);
        Assert.False((await fixture.Service.ValidateCardAsync("juan-delacruz", token + "x", "juan@example.com")).Success);
    }

    [Fact]
    public async Task Replacement_invalidates_old_token()
    {
        var fixture = new Fixture();
        var created = await fixture.Service.CreateAsync(NewCustomer());
        var oldToken = (await fixture.Service.IssueNfcAsync(created.Data!.Id, "https://example.com")).Data!.Url.Split('/').Last();
        var newToken = (await fixture.Service.IssueNfcAsync(created.Data!.Id, "https://example.com")).Data!.Url.Split('/').Last();
        Assert.False((await fixture.Service.ValidateCardAsync("juan-delacruz", oldToken, "juan@example.com")).Success);
        Assert.True((await fixture.Service.ValidateCardAsync("juan-delacruz", newToken, "juan@example.com")).Success);
    }

    [Fact]
    public async Task Inactive_customer_is_hidden_and_reactivation_preserves_unreplaced_card()
    {
        var fixture = new Fixture();
        var created = await fixture.Service.CreateAsync(NewCustomer());
        var token = (await fixture.Service.IssueNfcAsync(created.Data!.Id, "https://example.com")).Data!.Url.Split('/').Last();
        await fixture.Service.SetActiveAsync(created.Data.Id, false);
        Assert.Empty((await fixture.Service.SearchAsync("juan")).Data!);
        Assert.False((await fixture.Service.ValidateCardAsync("juan-delacruz", token, "juan@example.com")).Success);
        await fixture.Service.SetActiveAsync(created.Data.Id, true);
        Assert.True((await fixture.Service.ValidateCardAsync("juan-delacruz", token, "juan@example.com")).Success);
    }

    [Fact]
    public async Task Card_never_returns_another_customers_bookings()
    {
        var fixture = new Fixture();
        var first = await fixture.Service.CreateAsync(NewCustomer());
        var second = await fixture.Service.CreateAsync(NewCustomer("maria-santos", "maria@example.com"));
        fixture.Bookings.Items.Add(new Booking { Id = 1, CustomerId = second.Data!.Id, BookingReference = "TDK-OTHER", CourtId = 1, CustomerName = "Maria", Email = "maria@example.com", BookingDate = new DateOnly(2026, 10, 8), StartTime = new(10, 0), EndTime = new(11, 0), Status = TDK.Domain.Enums.BookingStatus.Reserved });
        var token = (await fixture.Service.IssueNfcAsync(first.Data!.Id, "https://example.com")).Data!.Url.Split('/').Last();
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
        public CustomerService Service { get; }
        public Fixture() => Service = new(Customers, Bookings, new MemoryRepository<Court>(), new MemoryRepository<Schedule>(), new MemoryRepository<Promo>(), new FixedClock());
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
