using TDK.Application.DTOs.Common;
using TDK.Application.DTOs.InternalCoaches;
using TDK.Domain.Enums;

namespace TDK.Application.Interfaces;

public interface IInternalCoachService
{
    Task<ApiResponse<IEnumerable<InternalCoachProfileDto>>> GetAllAsync(InternalCoachType? type = null);
    Task<ApiResponse<InternalCoachProfileDto>> GetByIdAsync(int id);
    Task<ApiResponse<InternalCoachProfileDto>> CreateAsync(CreateInternalCoachProfileRequest request);
    Task<ApiResponse<InternalCoachProfileDto>> UpdateAsync(int id, UpdateInternalCoachProfileRequest request);
    Task<ApiResponse<InternalCoachProfileDto>> UpdateProfileImageAsync(int id, Stream content, string fileName, string contentType, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> RemoveProfileImageAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> DeleteAsync(int id, CancellationToken cancellationToken = default);
}
