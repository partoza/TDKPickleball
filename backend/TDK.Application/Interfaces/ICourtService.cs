using TDK.Application.DTOs.Courts;
using TDK.Application.DTOs.Common;

namespace TDK.Application.Interfaces;

public interface ICourtService
{
    Task<ApiResponse<IEnumerable<CourtDto>>> GetAllAsync();
    Task<ApiResponse<CourtDto>> GetByIdAsync(int id);
    Task<ApiResponse<CourtDto>> CreateAsync(CreateCourtRequest request);
    Task<ApiResponse<CourtDto>> UpdateAsync(int id, UpdateCourtRequest request);
    Task<ApiResponse<bool>> DeleteAsync(int id);
}