using TDK.Application.DTOs.Common;
using TDK.Application.DTOs.Storage;

namespace TDK.Application.Interfaces;

public interface IStorageManagementService
{
    Task<ApiResponse<StorageStatusDto>> GetStatusAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<BookingCleanupPreviewDto>> GetCleanupPreviewAsync(DateOnly fromDate, DateOnly throughDate, CancellationToken cancellationToken = default);
    Task<ApiResponse<IReadOnlyList<BookingCleanupHistoryDto>>> GetCleanupHistoryAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<BookingCleanupResultDto>> DeleteCompletedBookingsAsync(
        BookingCleanupRequest request,
        string userId,
        string userName,
        string userEmail,
        CancellationToken cancellationToken = default);
}
