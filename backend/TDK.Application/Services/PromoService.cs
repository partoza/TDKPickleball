using TDK.Application.DTOs.Common;
using TDK.Application.DTOs.Promo;
using TDK.Application.Interfaces;
using TDK.Domain.Entities;
using TDK.Domain.Interfaces;

namespace TDK.Application.Services;

public class PromoService : IPromoService
{
    private readonly IRepository<Promo> _repo;

    public PromoService(IRepository<Promo> repo)
    {
        _repo = repo;
    }

    public async Task<ApiResponse<IEnumerable<PromoDto>>> GetAllAsync(bool includeInactive = false)
    {
        var promos = await _repo.GetAllAsync();
        if (!includeInactive)
        {
            promos = promos.Where(p => p.IsActive);
        }
        
        var dtos = promos.OrderByDescending(p => p.CreatedAt).Select(p => new PromoDto(
            p.Id, p.Code, p.Description, p.Type, p.Value, p.StartDate, p.EndDate, p.MaxUses, p.CurrentUses, p.AppliesTo, p.IsActive
        ));
        
        return ApiResponse<IEnumerable<PromoDto>>.Ok(dtos);
    }

    public async Task<ApiResponse<PromoDto>> GetByIdAsync(int id)
    {
        var p = await _repo.GetByIdAsync(id);
        if (p == null) return ApiResponse<PromoDto>.Fail("Promo not found");
        return ApiResponse<PromoDto>.Ok(new PromoDto(
            p.Id, p.Code, p.Description, p.Type, p.Value, p.StartDate, p.EndDate, p.MaxUses, p.CurrentUses, p.AppliesTo, p.IsActive
        ));
    }

    public async Task<ApiResponse<PromoDto>> GetByCodeAsync(string code)
    {
        var all = await _repo.GetAllAsync();
        var p = all.FirstOrDefault(x => x.Code.Equals(code, StringComparison.OrdinalIgnoreCase));
        if (p == null) return ApiResponse<PromoDto>.Fail("Promo not found");
        return ApiResponse<PromoDto>.Ok(new PromoDto(
            p.Id, p.Code, p.Description, p.Type, p.Value, p.StartDate, p.EndDate, p.MaxUses, p.CurrentUses, p.AppliesTo, p.IsActive
        ));
    }

    public async Task<ApiResponse<PromoDto>> CreateAsync(CreatePromoRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Code)) return ApiResponse<PromoDto>.Fail("Code is required");
        
        var all = await _repo.GetAllAsync();
        if (all.Any(x => x.Code.Equals(request.Code.Trim(), StringComparison.OrdinalIgnoreCase)))
            return ApiResponse<PromoDto>.Fail("Promo code already exists");

        var p = new Promo
        {
            Code = request.Code.Trim().ToUpperInvariant(),
            Description = request.Description.Trim(),
            Type = request.Type,
            Value = request.Value,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            AppliesTo = request.AppliesTo,
            MaxUses = request.MaxUses,
            IsActive = true,
            CurrentUses = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _repo.AddAsync(p);
        await _repo.SaveChangesAsync();

        return ApiResponse<PromoDto>.Ok(new PromoDto(
            p.Id, p.Code, p.Description, p.Type, p.Value, p.StartDate, p.EndDate, p.MaxUses, p.CurrentUses, p.AppliesTo, p.IsActive
        ));
    }

    public async Task<ApiResponse<PromoDto>> UpdateAsync(int id, UpdatePromoRequest request)
    {
        var p = await _repo.GetByIdAsync(id);
        if (p == null) return ApiResponse<PromoDto>.Fail("Promo not found");

        var all = await _repo.GetAllAsync();
        if (all.Any(x => x.Id != id && x.Code.Equals(request.Code.Trim(), StringComparison.OrdinalIgnoreCase)))
            return ApiResponse<PromoDto>.Fail("Promo code already exists");

        p.Code = request.Code.Trim().ToUpperInvariant();
        p.Description = request.Description.Trim();
        p.Type = request.Type;
        p.Value = request.Value;
        p.StartDate = request.StartDate;
        p.EndDate = request.EndDate;
        p.MaxUses = request.MaxUses;
        p.AppliesTo = request.AppliesTo;
        p.IsActive = request.IsActive;
        p.UpdatedAt = DateTime.UtcNow;

        _repo.Update(p);
        await _repo.SaveChangesAsync();

        return ApiResponse<PromoDto>.Ok(new PromoDto(
            p.Id, p.Code, p.Description, p.Type, p.Value, p.StartDate, p.EndDate, p.MaxUses, p.CurrentUses, p.AppliesTo, p.IsActive
        ));
    }

    public async Task<ApiResponse<bool>> DeleteAsync(int id)
    {
        var p = await _repo.GetByIdAsync(id);
        if (p != null)
        {
            _repo.Delete(p);
            await _repo.SaveChangesAsync();
        }
        return ApiResponse<bool>.Ok(true);
    }
}
