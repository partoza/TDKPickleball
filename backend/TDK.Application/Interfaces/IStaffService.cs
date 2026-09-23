using TDK.Application.DTOs.Common;
using TDK.Application.DTOs.Staff;
using TDK.Domain.Enums;

namespace TDK.Application.Interfaces;

public interface IStaffService
{
    Task<ApiResponse<IEnumerable<StaffProfileDto>>> GetAllAsync(StaffType? type = null);
    Task<ApiResponse<StaffProfileDto>> GetByIdAsync(int id);
    Task<ApiResponse<StaffProfileDto>> CreateAsync(CreateStaffProfileRequest request);
    Task<ApiResponse<StaffProfileDto>> UpdateAsync(int id, UpdateStaffProfileRequest request);
    Task<ApiResponse<bool>> DeleteAsync(int id);
}
