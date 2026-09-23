using TDK.Application.DTOs.Common;
using TDK.Application.DTOs.Promo;

namespace TDK.Application.Interfaces;

public interface IPromoService
{
    Task<ApiResponse<IEnumerable<PromoDto>>> GetAllAsync(bool includeInactive = false);
    Task<ApiResponse<PromoDto>> GetByIdAsync(int id);
    Task<ApiResponse<PromoDto>> GetByCodeAsync(string code);
    Task<ApiResponse<PromoDto>> CreateAsync(CreatePromoRequest request);
    Task<ApiResponse<PromoDto>> UpdateAsync(int id, UpdatePromoRequest request);
    Task<ApiResponse<bool>> DeleteAsync(int id);
}
