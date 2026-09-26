using TDK.Application.DTOs.Bookings;
using TDK.Application.DTOs.Common;

namespace TDK.Application.Interfaces;

public interface IBookingService
{
    Task<ApiResponse<BookingAvailabilityDto>> GetAvailabilityAsync(DateOnly date, int courtId);
    Task<ApiResponse<PublicPromoDto>> ValidatePublicPromoAsync(string promoCode);
    Task<ApiResponse<PublicBookingRequestReceiptDto>> SubmitPublicRequestAsync(PublicBookingRequestSubmissionDto request, byte[] receiptBytes, string receiptFileName, string receiptContentType, CancellationToken cancellationToken = default);
    Task<ApiResponse<PublicPayMongoRequestResponseDto>> SubmitPayMongoRequestAsync(PublicBookingRequestSubmissionDto request, CancellationToken cancellationToken = default);
    Task<ApiResponse<RevenueSummaryDto>> GetRevenueAsync(DateOnly fromDate, DateOnly throughDate);
    Task<ApiResponse<BookingDto>> CreateAsync(CreateBookingRequest request, bool sendConfirmation = true);
    Task<ApiResponse<IEnumerable<BookingDto>>> GetAllAsync();
    Task<ApiResponse<BookingDto>> GetByIdAsync(long id);
    Task<ApiResponse<BookingDto>> VerifyAsync(string bookingReference);
    Task<ApiResponse<BookingDto>> UpdateAsync(long id, UpdateBookingRequest request);
    Task<ApiResponse<BookingDto>> RescheduleAsync(long id, RescheduleBookingRequest request);
    Task<ApiResponse<BookingDto>> AddPaddleRentalAsync(long id, int quantity);
    Task<ApiResponse<bool>> ConfirmAsync(long id);
    Task<ApiResponse<bool>> CancelAsync(long id);
    Task<ApiResponse<bool>> CompleteAsync(long id);
    Task<ApiResponse<bool>> DeleteAsync(long id);
    Task<ApiResponse<bool>> AttachReceiptAsync(long id, string fileName, string contentType);
    Task<ApiResponse<bool>> SendReceiptConfirmationAsync(long id, byte[] receiptBytes, string receiptFileName, string receiptContentType, CancellationToken cancellationToken = default);
    Task<ApiResponse<ReceiptInfoDto>> GetReceiptInfoAsync(long id);
}
