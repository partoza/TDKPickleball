using TDK.Application.DTOs.Schedules;
using TDK.Application.DTOs.Common;

namespace TDK.Application.Interfaces;

public interface IScheduleService
{
    Task<ApiResponse<ScheduleBoardDto>> GetBoardAsync(DateOnly date);
    Task<ApiResponse<IEnumerable<ScheduleDto>>> GetSchedulesAsync(DateOnly date, int? courtId);
    Task<ApiResponse<ScheduleDto>> GetByIdAsync(long id);
    Task<ApiResponse<ScheduleDto>> CreateAsync(int courtId, DateOnly date, int timeSlotId);
    Task<ApiResponse<ScheduleDto>> UpdateAsync(long id, UpdateScheduleRequest request, string userId);
    Task<ApiResponse<bool>> DeleteAsync(long id);
    Task<ApiResponse<bool>> BulkUpdateAsync(BulkUpdateRequest request, string userId);
    Task<ApiResponse<bool>> CopyScheduleAsync(CopyScheduleRequest request, string userId);
}