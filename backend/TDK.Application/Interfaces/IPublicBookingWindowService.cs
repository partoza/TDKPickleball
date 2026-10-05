using TDK.Application.DTOs.Common;
using TDK.Application.DTOs.Schedules;

namespace TDK.Application.Interfaces;

public interface IPublicBookingWindowService
{
    Task<ApiResponse<PublicBookingWindowDto>> GetAsync();
    Task<DateOnly?> GetBookingThroughDateAsync();
    Task<ApiResponse<PublicBookingWindowDto>> UpdateAsync(UpdatePublicBookingWindowRequest request, string userId);
}
