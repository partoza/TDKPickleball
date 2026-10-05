using TDK.Application.DTOs.Bookings;
using TDK.Application.DTOs.Common;
using TDK.Application.DTOs.Rates;
using TDK.Application.DTOs.Schedules;
using TDK.Application.Interfaces;
using TDK.Application.Services;
using TDK.Domain.Entities;
using TDK.Domain.Enums;
using Xunit;

namespace TDK.Tests;

public sealed class BookingCustomerIntegrationTests
{
    [Fact]
    public async Task Admin_linked_booking_uses_authoritative_customer_snapshots_and_manual_still_works()
    {
        var fixture = new BookingFixture();
        var customer = fixture.AddCustomer(active: true, issued: true);
        var linked = await fixture.Service.CreateAsync(fixture.Request(customer.Id, "Untrusted Name", "wrong@example.com"), false);
        fixture.Schedules.Items.Clear();
        var manual = await fixture.Service.CreateAsync(fixture.Request(null, "Walk In", "walk@example.com"), false);
        Assert.True(linked.Success); Assert.Equal(customer.Id, linked.Data!.CustomerId); Assert.Equal(customer.FullName, linked.Data.CustomerName); Assert.Equal(customer.Email, linked.Data.Email);
        Assert.True(manual.Success); Assert.Null(manual.Data!.CustomerId); Assert.Equal("Walk In", manual.Data.CustomerName);
    }

    [Fact]
    public async Task Nfc_only_promo_requires_explicit_active_issued_customer_and_releases_once_on_cancel()
    {
        var fixture = new BookingFixture();
        var promo = fixture.AddPromo(PromoAudience.NfcCustomersOnly);
        var eligible = fixture.AddCustomer(active: true, issued: true);
        Assert.False((await fixture.Service.CreateAsync(fixture.Request(null, promoId: promo.Id), false)).Success);
        eligible.IsActive = false;
        Assert.False((await fixture.Service.CreateAsync(fixture.Request(eligible.Id, promoId: promo.Id), false)).Success);
        eligible.IsActive = true;
        var created = await fixture.Service.CreateAsync(fixture.Request(eligible.Id, promoId: promo.Id), false);
        Assert.True(created.Success); Assert.Equal(1, promo.CurrentUses);
        Assert.True((await fixture.Service.CancelAsync(created.Data!.Id, "admin", "Admin", "Requested by customer")).Success);
        Assert.Equal(0, promo.CurrentUses);
        Assert.False((await fixture.Service.CancelAsync(created.Data.Id, "admin", "Admin", "Again")).Success);
        Assert.Equal(0, promo.CurrentUses);
    }

    [Fact]
    public async Task Public_booking_links_only_an_existing_active_issued_customer_by_authenticated_email()
    {
        var fixture = new BookingFixture();
        var customer = fixture.AddCustomer(active: true, issued: true);
        var result = await fixture.Service.SubmitPublicRequestAsync(new(
            "Public Name", customer.Email, "09123456789", null, 0,
            new[] { new PublicBookingRequestBlockDto(1, new DateOnly(2026, 10, 9), new TimeOnly(10, 0), new TimeOnly(11, 0)) }, null),
            new byte[] { 1, 2, 3 }, "receipt.png", "image/png", customer.Email);
        Assert.True(result.Success);
        Assert.Equal(customer.Id, fixture.Bookings.Items.Single().CustomerId);
        Assert.Single(fixture.Customers.Items);
    }

    [Fact]
    public async Task Nfc_promo_enforces_monthly_customer_limit_but_can_remain_globally_unlimited()
    {
        var fixture = new BookingFixture();
        var customer = fixture.AddCustomer(active: true, issued: true);
        var promo = fixture.AddPromo(PromoAudience.NfcCustomersOnly);
        promo.MonthlyUsageLimitPerCustomer = 3;
        promo.MaxUses = null;

        for (var index = 0; index < 3; index++)
        {
            fixture.Schedules.Items.Clear();
            var created = await fixture.Service.CreateAsync(fixture.Request(customer.Id, courtId: 1, promoId: promo.Id), false);
            Assert.True(created.Success);
        }

        fixture.Schedules.Items.Clear();
        var rejected = await fixture.Service.CreateAsync(fixture.Request(customer.Id, courtId: 1, promoId: promo.Id), false);
        Assert.False(rejected.Success);
        Assert.Contains("3 uses per customer each month", rejected.Message);
        Assert.Equal(3, promo.CurrentUses);
    }

    [Fact]
    public async Task Available_promos_only_include_nfc_offer_for_matching_active_issued_email()
    {
        var fixture = new BookingFixture();
        var customer = fixture.AddCustomer(active: true, issued: true);
        var nfcPromo = fixture.AddPromo(PromoAudience.NfcCustomersOnly);
        nfcPromo.MonthlyUsageLimitPerCustomer = 3;

        var eligible = await fixture.Service.GetAvailablePublicPromosAsync(customer.Email);
        var unmatched = await fixture.Service.GetAvailablePublicPromosAsync("someone-else@example.com");
        customer.IsActive = false;
        var inactive = await fixture.Service.GetAvailablePublicPromosAsync(customer.Email);

        Assert.True(eligible.Data!.IsNfcCustomer);
        Assert.Single(eligible.Data.Promos);
        Assert.Equal(3, eligible.Data.Promos.Single().RemainingUsesThisMonth);
        Assert.False(unmatched.Data!.IsNfcCustomer);
        Assert.Empty(unmatched.Data.Promos);
        Assert.False(inactive.Data!.IsNfcCustomer);
        Assert.Empty(inactive.Data.Promos);
    }

    [Fact]
    public async Task Nfc_only_promo_cannot_be_applied_through_the_regular_text_input()
    {
        var fixture = new BookingFixture();
        var customer = fixture.AddCustomer(active: true, issued: true);
        var promo = fixture.AddPromo(PromoAudience.NfcCustomersOnly);
        promo.MonthlyUsageLimitPerCustomer = 3;

        var result = await fixture.Service.ValidatePublicPromoAsync(promo.Code, customer.Email);

        Assert.False(result.Success);
        Assert.Contains("NFC promo list", result.Message);
    }

    [Fact]
    public async Task Everyone_promo_can_still_be_applied_through_the_regular_text_input()
    {
        var fixture = new BookingFixture();
        var promo = fixture.AddPromo(PromoAudience.Everyone);

        var result = await fixture.Service.ValidatePublicPromoAsync(promo.Code, "signed-in@gmail.com");

        Assert.True(result.Success);
        Assert.Equal(promo.Code, result.Data!.Code);
    }

    [Fact]
    public async Task Public_nfc_promo_uses_authenticated_email_and_rejects_batch_over_monthly_limit()
    {
        var fixture = new BookingFixture();
        var customer = fixture.AddCustomer(active: true, issued: true);
        var promo = fixture.AddPromo(PromoAudience.NfcCustomersOnly);
        promo.MonthlyUsageLimitPerCustomer = 1;
        var schedules = new[] { new PublicBookingRequestBlockDto(1, new DateOnly(2026, 10, 9), new TimeOnly(10, 0), new TimeOnly(11, 0)) };
        var request = new PublicBookingRequestSubmissionDto("Public Name", customer.Email, "09123456789", null, 0, schedules, promo.Code);

        var wrongIdentity = await fixture.Service.SubmitPublicRequestAsync(request, [1, 2, 3], "receipt.png", "image/png", "someone-else@example.com");
        var first = await fixture.Service.SubmitPublicRequestAsync(request, [1, 2, 3], "receipt.png", "image/png", customer.Email);
        fixture.Schedules.Items.Clear();
        var overLimit = await fixture.Service.SubmitPublicRequestAsync(request, [1, 2, 3], "receipt.png", "image/png", customer.Email);

        Assert.False(wrongIdentity.Success);
        Assert.True(first.Success);
        Assert.False(overLimit.Success);
        Assert.Contains("1 use per customer each month", overLimit.Message);
        Assert.Single(fixture.Bookings.Items);
    }
}

internal sealed class BookingFixture
{
    public MemoryRepository<Booking> Bookings { get; } = new();
    public MemoryRepository<Schedule> Schedules { get; } = new();
    public MemoryRepository<Promo> Promos { get; } = new();
    public MemoryRepository<Customer> Customers { get; } = new();
    public BookingService Service { get; }
    private long _customerId = 1;

    public BookingFixture()
    {
        var slots = new MemoryRepository<TimeSlot>(); slots.Items.Add(new() { Id = 1, StartTime = new(10, 0), EndTime = new(11, 0), DisplayName = "10-11", IsActive = true, SortOrder = 1 });
        var courts = new MemoryRepository<Court>(); courts.Items.Add(new() { Id = 1, Name = "Court 1", DisplayName = "Court 1", IsActive = true, OpenTime = new(6, 0), CloseTime = TimeOnly.MinValue });
        Service = new(Bookings, Schedules, slots, courts, new MemoryRepository<Notification>(), Promos,
            new MemoryRepository<InternalCoachProfile>(), Customers, new FixedRateService(), new NullEmailService(), new FixedClock(), new OpenBookingWindow());
    }

    public Customer AddCustomer(bool active, bool issued)
    {
        var id = _customerId++;
        var customer = new Customer { Id = id, FullName = $"Customer {id}", Username = $"customer-{id}", NormalizedUsername = $"CUSTOMER-{id}", Email = $"customer{id}@example.com", NormalizedEmail = $"CUSTOMER{ id }@EXAMPLE.COM".Replace(" ", ""), IsActive = active, NfcTokenHash = issued ? new byte[32] : null, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        Customers.Items.Add(customer); return customer;
    }

    public Promo AddPromo(PromoAudience audience)
    {
        var promo = new Promo { Id = 1, Code = "NFC", Description = "Members", Type = DiscountType.Percentage, Value = 10, Audience = audience, IsActive = true };
        Promos.Items.Add(promo); return promo;
    }

    public CreateBookingRequest Request(long? customerId, string name = "Manual", string email = "manual@example.com", int courtId = 1, int? promoId = null) =>
        new(courtId, new DateOnly(2026, 10, 8), new TimeOnly(10, 0), new TimeOnly(11, 0), name, email, "09123456789", null, 0, RateType.Booking, PromoId: promoId, CustomerId: customerId);
}

internal sealed class FixedRateService : IRateService
{
    public Task<decimal> CalculateRateAsync(TimeOnly startTime, TimeOnly endTime, RateType rateType = RateType.Booking) => Task.FromResult(500m);
    public Task<ApiResponse<IEnumerable<RateDto>>> GetAllAsync() => throw new NotSupportedException();
    public Task<ApiResponse<RateDto>> CreateAsync(CreateRateRequest request) => throw new NotSupportedException();
    public Task<ApiResponse<RateDto>> UpdateAsync(int id, UpdateRateRequest request) => throw new NotSupportedException();
    public Task<ApiResponse<bool>> DeleteAsync(int id) => throw new NotSupportedException();
}

internal sealed class NullEmailService : IEmailService
{
    public bool IsConfigured => false;
    public Task SendBookingConfirmationAsync(Booking booking, string courtName, string? coachEmail = null, string? coachName = null, bool isRescheduled = false, CancellationToken cancellationToken = default) => Task.CompletedTask;
    public Task SendBookingReminderAsync(Booking booking, string courtName, CancellationToken cancellationToken = default) => Task.CompletedTask;
    public Task SendBookingRequestAsync(Booking booking, string courtName, byte[] receiptBytes, string receiptFileName, string receiptContentType, CancellationToken cancellationToken = default) => Task.CompletedTask;
    public Task SendPublicBookingRequestAsync(PublicBookingRequestEmailDto request, byte[] receiptBytes, string receiptFileName, string receiptContentType, CancellationToken cancellationToken = default) => Task.CompletedTask;
    public Task SendTemporaryPasswordAsync(string email, string firstName, string temporaryPassword, CancellationToken cancellationToken = default) => Task.CompletedTask;
    public Task SendInternalCoachWelcomeAsync(string email, string name, string profileType, CancellationToken cancellationToken = default) => Task.CompletedTask;
    public Task SendCancellationAsync(Booking booking, string courtName, string reason, bool isDeclinedRequest = false, CancellationToken cancellationToken = default) => Task.CompletedTask;
    public Task SendStorageCleanupSummaryAsync(string deletedByName, string deletedByEmail, DateOnly fromDate, DateOnly throughDate, int scheduleCount, int bookingCount, int receiptCount, CancellationToken cancellationToken = default) => Task.CompletedTask;
}

internal sealed class OpenBookingWindow : IPublicBookingWindowService
{
    public Task<DateOnly?> GetBookingThroughDateAsync() => Task.FromResult<DateOnly?>(null);
    public Task<ApiResponse<PublicBookingWindowDto>> GetAsync() => throw new NotSupportedException();
    public Task<ApiResponse<PublicBookingWindowDto>> UpdateAsync(UpdatePublicBookingWindowRequest request, string userId) => throw new NotSupportedException();
}
