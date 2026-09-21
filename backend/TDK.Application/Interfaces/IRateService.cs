using TDK.Application.DTOs.Rates;
using TDK.Application.DTOs.Common;
using TDK.Domain.Enums;

namespace TDK.Application.Interfaces;

public interface IRateService
{
    Task<ApiResponse<IEnumerable<RateDto>>> GetAllAsync();
    Task<ApiResponse<RateDto>> CreateAsync(CreateRateRequest request);
    Task<ApiResponse<RateDto>> UpdateAsync(int id, UpdateRateRequest request);
    Task<ApiResponse<bool>> DeleteAsync(int id);
    Task<decimal> CalculateRateAsync(TimeOnly startTime, TimeOnly endTime, RateType rateType = RateType.Booking);
}
