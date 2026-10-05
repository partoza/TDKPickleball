using TDK.Application.DTOs.Bookings;

namespace TDK.Application.DTOs.Customers;

public record CustomerSummaryDto(
    long Id, string CustomerNumber, string FullName, string Username, string Email, string? Phone,
    bool IsActive, bool HasNfcCard, DateTime? NfcIssuedAt, DateTime? NfcLastTappedAt,
    DateTime CreatedAt, DateTime UpdatedAt, string? AdminNotes = null);

public record CustomerDetailsDto(
    CustomerSummaryDto Customer,
    IReadOnlyList<BookingDto> Upcoming,
    IReadOnlyList<BookingDto> Pending,
    IReadOnlyList<BookingDto> Past,
    IReadOnlyList<BookingDto> Cancelled);

public record CreateCustomerRequest(string FullName, string Username, string Email, string? Phone, string? AdminNotes);
public record UpdateCustomerRequest(string FullName, string Username, string Email, string? Phone, string? AdminNotes);
public record NfcIssueDto(string Url, DateTime IssuedAt);
public record CustomerPromoDto(string Code, string Description, string DiscountType, decimal Value);
public record CustomerCardDto(
    string FullName, string Username, string CustomerNumber, DateTime MemberSince,
    IReadOnlyList<BookingDto> Upcoming, IReadOnlyList<BookingDto> Pending,
    IReadOnlyList<BookingDto> Past, IReadOnlyList<BookingDto> Cancelled,
    IReadOnlyList<CustomerPromoDto> EligiblePromos);
