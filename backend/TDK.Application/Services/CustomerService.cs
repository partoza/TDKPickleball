using System.Net.Mail;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using TDK.Application.DTOs.Bookings;
using TDK.Application.DTOs.Common;
using TDK.Application.DTOs.Customers;
using TDK.Application.Interfaces;
using TDK.Domain.Entities;
using TDK.Domain.Enums;
using TDK.Domain.Interfaces;

namespace TDK.Application.Services;

public sealed partial class CustomerService : ICustomerService
{
    private const string UnavailableMessage = "This loyalty card is currently unavailable. Please contact The Dirty Kitchen for assistance.";
    private static readonly HashSet<string> ReservedUsernames = new(StringComparer.OrdinalIgnoreCase)
    { "admin", "api", "login", "booking", "schedule", "promos", "card" };

    private readonly IRepository<Customer> _customers;
    private readonly IRepository<Booking> _bookings;
    private readonly IRepository<Court> _courts;
    private readonly IRepository<Schedule> _schedules;
    private readonly IRepository<Promo> _promos;
    private readonly IBusinessClock _clock;
    private readonly INfcTokenProtector _tokenProtector;

    public CustomerService(IRepository<Customer> customers, IRepository<Booking> bookings,
        IRepository<Court> courts, IRepository<Schedule> schedules, IRepository<Promo> promos, IBusinessClock clock,
        INfcTokenProtector tokenProtector)
    {
        _customers = customers;
        _bookings = bookings;
        _courts = courts;
        _schedules = schedules;
        _promos = promos;
        _clock = clock;
        _tokenProtector = tokenProtector;
    }

    public async Task<ApiResponse<IEnumerable<CustomerSummaryDto>>> GetAllAsync(string? query, bool includeInactive)
    {
        var normalizedQuery = query?.Trim().ToUpperInvariant();
        var customers = await _customers.GetAllAsync();
        var result = customers
            .Where(customer => includeInactive || customer.IsActive)
            .Where(customer => string.IsNullOrWhiteSpace(normalizedQuery) ||
                customer.FullName.ToUpper().Contains(normalizedQuery) ||
                customer.NormalizedUsername.Contains(normalizedQuery) ||
                customer.NormalizedEmail.Contains(normalizedQuery) ||
                (customer.Phone ?? "").Contains(query!.Trim()) ||
                CustomerNumber(customer.Id).Contains(normalizedQuery))
            .OrderBy(customer => customer.FullName)
            .Select(customer => ToSummary(customer, true));
        return ApiResponse<IEnumerable<CustomerSummaryDto>>.Ok(result);
    }

    public Task<ApiResponse<IEnumerable<CustomerSummaryDto>>> SearchAsync(string? query) => GetAllAsync(query, false);

    public async Task<ApiResponse<CustomerDetailsDto>> GetByIdAsync(long id)
    {
        var customer = await _customers.GetByIdAsync(id);
        if (customer is null) return ApiResponse<CustomerDetailsDto>.Fail("Customer not found");
        var groups = await GetBookingGroupsAsync(customer.Id);
        return ApiResponse<CustomerDetailsDto>.Ok(new(ToSummary(customer, true), groups.Upcoming, groups.Pending, groups.Past, groups.Cancelled));
    }

    public async Task<ApiResponse<CreateCustomerDto>> CreateAsync(CreateCustomerRequest request, string frontendBaseUrl)
    {
        var validation = Validate(request.FullName, request.Username, request.Email, request.Phone, request.AdminNotes);
        if (validation is not null) return ApiResponse<CreateCustomerDto>.Fail(validation);
        var normalizedUsername = NormalizeUsername(request.Username);
        var normalizedEmail = NormalizeEmail(request.Email);
        var existing = await _customers.GetAllAsync();
        if (existing.Any(customer => customer.NormalizedUsername == normalizedUsername)) return ApiResponse<CreateCustomerDto>.Fail("Username is already in use");
        if (existing.Any(customer => customer.NormalizedEmail == normalizedEmail)) return ApiResponse<CreateCustomerDto>.Fail("Email is already in use");
        var now = _clock.UtcNow.UtcDateTime;
        var customer = new Customer
        {
            FullName = request.FullName.Trim(), Username = request.Username.Trim().ToLowerInvariant(), NormalizedUsername = normalizedUsername,
            Email = request.Email.Trim(), NormalizedEmail = normalizedEmail, Phone = NullIfWhiteSpace(request.Phone),
            AdminNotes = NullIfWhiteSpace(request.AdminNotes), IsActive = true, CreatedAt = now, UpdatedAt = now
        };
        var card = CreateCredential(customer, frontendBaseUrl);
        await _customers.AddAsync(customer);
        try { await _customers.SaveChangesAsync(); }
        catch { return ApiResponse<CreateCustomerDto>.Fail("Username or email is already in use"); }
        return ApiResponse<CreateCustomerDto>.Ok(new(ToSummary(customer, true), card), "Customer and NFC card created");
    }

    public async Task<ApiResponse<CustomerSummaryDto>> UpdateAsync(long id, UpdateCustomerRequest request)
    {
        var customer = await _customers.GetByIdAsync(id);
        if (customer is null) return ApiResponse<CustomerSummaryDto>.Fail("Customer not found");
        var validation = Validate(request.FullName, request.Username, request.Email, request.Phone, request.AdminNotes);
        if (validation is not null) return ApiResponse<CustomerSummaryDto>.Fail(validation);
        var normalizedUsername = NormalizeUsername(request.Username);
        var normalizedEmail = NormalizeEmail(request.Email);
        var existing = await _customers.GetAllAsync();
        if (existing.Any(other => other.Id != id && other.NormalizedUsername == normalizedUsername)) return ApiResponse<CustomerSummaryDto>.Fail("Username is already in use");
        if (existing.Any(other => other.Id != id && other.NormalizedEmail == normalizedEmail)) return ApiResponse<CustomerSummaryDto>.Fail("Email is already in use");
        customer.FullName = request.FullName.Trim(); customer.Username = request.Username.Trim().ToLowerInvariant();
        customer.NormalizedUsername = normalizedUsername; customer.Email = request.Email.Trim(); customer.NormalizedEmail = normalizedEmail;
        customer.Phone = NullIfWhiteSpace(request.Phone); customer.AdminNotes = NullIfWhiteSpace(request.AdminNotes); customer.UpdatedAt = _clock.UtcNow.UtcDateTime;
        _customers.Update(customer);
        try { await _customers.SaveChangesAsync(); }
        catch { return ApiResponse<CustomerSummaryDto>.Fail("Username or email is already in use"); }
        return ApiResponse<CustomerSummaryDto>.Ok(ToSummary(customer, true), "Customer updated");
    }

    public async Task<ApiResponse<CustomerSummaryDto>> SetActiveAsync(long id, bool active)
    {
        var customer = await _customers.GetByIdAsync(id);
        if (customer is null) return ApiResponse<CustomerSummaryDto>.Fail("Customer not found");
        customer.IsActive = active; customer.UpdatedAt = _clock.UtcNow.UtcDateTime;
        _customers.Update(customer); await _customers.SaveChangesAsync();
        return ApiResponse<CustomerSummaryDto>.Ok(ToSummary(customer, true), active ? "Customer activated" : "Customer deactivated");
    }

    public async Task<ApiResponse<NfcIssueDto>> GetNfcAsync(long id, string frontendBaseUrl)
    {
        var customer = await _customers.GetByIdAsync(id);
        if (customer is null) return ApiResponse<NfcIssueDto>.Fail("Customer not found");
        if (customer.NfcTokenHash is { Length: 32 } && !string.IsNullOrWhiteSpace(customer.NfcTokenProtected) &&
            _tokenProtector.TryUnprotect(customer.NfcTokenProtected, out var existingToken) && TokenMatches(customer, existingToken))
            return ApiResponse<NfcIssueDto>.Ok(new(CardUrl(frontendBaseUrl, customer.Username, existingToken), customer.NfcIssuedAt ?? customer.CreatedAt));

        var card = CreateCredential(customer, frontendBaseUrl);
        _customers.Update(customer);
        await _customers.SaveChangesAsync();
        return ApiResponse<NfcIssueDto>.Ok(card, "NFC card created");
    }

    public async Task<ApiResponse<bool>> DeleteAsync(long id)
    {
        var customer = await _customers.GetByIdAsync(id);
        if (customer is null) return ApiResponse<bool>.Fail("Customer not found");
        if (customer.IsActive) return ApiResponse<bool>.Fail("Deactivate the customer before deleting them");
        _customers.Delete(customer);
        await _customers.SaveChangesAsync();
        return ApiResponse<bool>.Ok(true, "Inactive customer deleted");
    }

    private NfcIssueDto CreateCredential(Customer customer, string frontendBaseUrl)
    {
        var tokenBytes = RandomNumberGenerator.GetBytes(32);
        var token = Convert.ToBase64String(tokenBytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
        var now = _clock.UtcNow.UtcDateTime;
        customer.NfcTokenHash = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        customer.NfcTokenProtected = _tokenProtector.Protect(token);
        customer.NfcIssuedAt = now; customer.NfcLastTappedAt = null; customer.UpdatedAt = now;
        return new(CardUrl(frontendBaseUrl, customer.Username, token), now);
    }

    public async Task<ApiResponse<CustomerCardDto>> ValidateCardAsync(string username, string token)
    {
        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(token) || token.Length > 200)
            return ApiResponse<CustomerCardDto>.Fail(UnavailableMessage);
        var normalizedUsername = NormalizeUsername(username);
        var customer = (await _customers.FindAsync(item => item.NormalizedUsername == normalizedUsername)).SingleOrDefault();
        if (customer is null || !customer.IsActive || customer.NfcTokenHash is not { Length: 32 })
            return ApiResponse<CustomerCardDto>.Fail(UnavailableMessage);
        if (!TokenMatches(customer, token))
            return ApiResponse<CustomerCardDto>.Fail(UnavailableMessage);
        customer.NfcLastTappedAt = _clock.UtcNow.UtcDateTime; customer.UpdatedAt = customer.NfcLastTappedAt.Value;
        _customers.Update(customer); await _customers.SaveChangesAsync();
        var groups = await GetBookingGroupsAsync(customer.Id);
        var today = _clock.ManilaToday;
        var eligiblePromos = (await _promos.GetAllAsync())
            .Where(promo => promo.IsActive && promo.Audience == PromoAudience.NfcCustomersOnly &&
                (!promo.MaxUses.HasValue || promo.CurrentUses < promo.MaxUses.Value) &&
                (!promo.StartDate.HasValue || DateOnly.FromDateTime(promo.StartDate.Value) <= today) &&
                (!promo.EndDate.HasValue || DateOnly.FromDateTime(promo.EndDate.Value) >= today))
            .Select(promo => new CustomerPromoDto(promo.Code, promo.Description, promo.Type.ToString(), promo.Value))
            .ToList();
        return ApiResponse<CustomerCardDto>.Ok(new(customer.FullName, customer.Username, CustomerNumber(customer.Id), customer.CreatedAt,
            groups.Upcoming, groups.Pending, groups.Past, groups.Cancelled, eligiblePromos));
    }

    private static bool TokenMatches(Customer customer, string token)
    {
        var suppliedHash = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return customer.NfcTokenHash is { Length: 32 } && CryptographicOperations.FixedTimeEquals(customer.NfcTokenHash, suppliedHash);
    }

    private static string CardUrl(string frontendBaseUrl, string username, string token) =>
        $"{frontendBaseUrl.TrimEnd('/')}/card/{Uri.EscapeDataString(username)}/{Uri.EscapeDataString(token)}";

    private async Task<(List<BookingDto> Upcoming, List<BookingDto> Pending, List<BookingDto> Past, List<BookingDto> Cancelled)> GetBookingGroupsAsync(long customerId)
    {
        var bookings = (await _bookings.FindAsync(booking => booking.CustomerId == customerId)).ToList();
        var courts = (await _courts.GetAllAsync()).ToDictionary(court => court.Id, court => court.Name);
        var ids = bookings.Select(booking => booking.Id).ToHashSet();
        var trainingIds = (await _schedules.GetAllAsync()).Where(schedule => schedule.BookingId.HasValue && ids.Contains(schedule.BookingId.Value) && schedule.Status == ScheduleStatus.Training).Select(schedule => schedule.BookingId!.Value).ToHashSet();
        var now = _clock.ToManilaTime(_clock.UtcNow).DateTime;
        BookingDto Map(Booking booking) => new(booking.Id, booking.BookingReference, booking.CourtId, courts.GetValueOrDefault(booking.CourtId, "Court"), booking.CustomerName,
            booking.Email, booking.Phone, booking.BookingDate, booking.StartTime, booking.EndTime, booking.Subtotal, booking.DiscountAmount, booking.TotalAmount,
            booking.AmountPaid, booking.Status == BookingStatus.Cancelled ? 0 : Math.Max(0, booking.TotalAmount - booking.AmountPaid), booking.Status, null,
            booking.CreatedAt, trainingIds.Contains(booking.Id) ? RateType.Training : RateType.Booking, false, booking.RescheduledAt, booking.InternalCoachProfileId,
            booking.PromoId, booking.PaddleRentalQuantity, booking.PaddleRentalFee);
        bool HasEnded(Booking booking) => booking.BookingDate.ToDateTime(booking.EndTime == TimeOnly.MinValue ? new TimeOnly(23, 59, 59) : booking.EndTime) < now;
        return (
            bookings.Where(b => b.Status is BookingStatus.Reserved or BookingStatus.Paid && !HasEnded(b)).OrderBy(b => b.BookingDate).ThenBy(b => b.StartTime).Select(Map).ToList(),
            bookings.Where(b => b.Status == BookingStatus.Requested).OrderBy(b => b.BookingDate).ThenBy(b => b.StartTime).Select(Map).ToList(),
            bookings.Where(b => b.Status == BookingStatus.Completed || (b.Status is BookingStatus.Reserved or BookingStatus.Paid && HasEnded(b))).OrderByDescending(b => b.BookingDate).ThenByDescending(b => b.StartTime).Select(Map).ToList(),
            bookings.Where(b => b.Status == BookingStatus.Cancelled).OrderByDescending(b => b.BookingDate).ThenByDescending(b => b.StartTime).Select(Map).ToList());
    }

    private static CustomerSummaryDto ToSummary(Customer customer, bool includeNotes) => new(customer.Id, CustomerNumber(customer.Id), customer.FullName, customer.Username,
        customer.Email, customer.Phone, customer.IsActive, customer.NfcTokenHash is { Length: 32 }, customer.NfcIssuedAt, customer.NfcLastTappedAt,
        customer.CreatedAt, customer.UpdatedAt, includeNotes ? customer.AdminNotes : null);
    private static string CustomerNumber(long id) => $"TDK-{id:D6}";
    private static string NormalizeUsername(string value) => value.Trim().ToUpperInvariant();
    private static string NormalizeEmail(string value) => value.Trim().ToUpperInvariant();
    private static string? NullIfWhiteSpace(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    private static string? Validate(string fullName, string username, string email, string? phone, string? notes)
    {
        if (string.IsNullOrWhiteSpace(fullName) || fullName.Trim().Length > 150) return "Full name is required and must be 150 characters or fewer";
        var candidate = username?.Trim() ?? "";
        if (!UsernamePattern().IsMatch(candidate)) return "Username must contain only lowercase letters, numbers, and hyphens";
        if (ReservedUsernames.Contains(candidate)) return "That username is reserved";
        if (!MailAddress.TryCreate(email?.Trim(), out _) || email.Trim().Length > 254) return "Enter a valid email address";
        if (phone?.Trim().Length > 30) return "Phone number must be 30 characters or fewer";
        if (notes?.Trim().Length > 1000) return "Admin notes must be 1000 characters or fewer";
        return null;
    }

    [GeneratedRegex("^[a-z0-9]+(?:-[a-z0-9]+)*$", RegexOptions.CultureInvariant)]
    private static partial Regex UsernamePattern();
}
