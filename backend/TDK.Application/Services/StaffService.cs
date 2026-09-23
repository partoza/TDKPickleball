using TDK.Application.DTOs.Common;
using TDK.Application.DTOs.Staff;
using TDK.Application.Interfaces;
using TDK.Domain.Entities;
using TDK.Domain.Enums;
using TDK.Domain.Interfaces;

namespace TDK.Application.Services;

public class StaffService : IStaffService
{
    private readonly IRepository<StaffProfile> _repo;

    public StaffService(IRepository<StaffProfile> repo)
    {
        _repo = repo;
    }

    public async Task<ApiResponse<IEnumerable<StaffProfileDto>>> GetAllAsync(StaffType? type = null)
    {
        var profiles = await _repo.GetAllAsync();
        if (type.HasValue)
        {
            profiles = profiles.Where(p => p.Type == type.Value);
        }
        
        var dtos = profiles.OrderBy(p => p.Name).Select(p => new StaffProfileDto(p.Id, p.Name, p.Email, p.Phone, p.Type, p.IsActive, p.ProfilePictureUrl));
        return ApiResponse<IEnumerable<StaffProfileDto>>.Ok(dtos);
    }

    public async Task<ApiResponse<StaffProfileDto>> GetByIdAsync(int id)
    {
        var p = await _repo.GetByIdAsync(id);
        if (p == null) return ApiResponse<StaffProfileDto>.Fail("Not found");
        return ApiResponse<StaffProfileDto>.Ok(new StaffProfileDto(p.Id, p.Name, p.Email, p.Phone, p.Type, p.IsActive, p.ProfilePictureUrl));
    }

    public async Task<ApiResponse<StaffProfileDto>> CreateAsync(CreateStaffProfileRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name)) return ApiResponse<StaffProfileDto>.Fail("Name is required");

        var profile = new StaffProfile
        {
            Name = request.Name.Trim(),
            Email = request.Email?.Trim(),
            Phone = request.Phone?.Trim(),
            Type = request.Type,
            ProfilePictureUrl = request.ProfilePictureUrl,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _repo.AddAsync(profile);
        await _repo.SaveChangesAsync();

        return ApiResponse<StaffProfileDto>.Ok(new StaffProfileDto(profile.Id, profile.Name, profile.Email, profile.Phone, profile.Type, profile.IsActive, profile.ProfilePictureUrl));
    }

    public async Task<ApiResponse<StaffProfileDto>> UpdateAsync(int id, UpdateStaffProfileRequest request)
    {
        var p = await _repo.GetByIdAsync(id);
        if (p == null) return ApiResponse<StaffProfileDto>.Fail("Not found");
        if (string.IsNullOrWhiteSpace(request.Name)) return ApiResponse<StaffProfileDto>.Fail("Name is required");

        p.Name = request.Name.Trim();
        p.Email = request.Email?.Trim();
        p.Phone = request.Phone?.Trim();
        p.Type = request.Type;
        p.ProfilePictureUrl = request.ProfilePictureUrl;
        p.IsActive = request.IsActive;
        p.UpdatedAt = DateTime.UtcNow;

        _repo.Update(p);
        await _repo.SaveChangesAsync();

        return ApiResponse<StaffProfileDto>.Ok(new StaffProfileDto(p.Id, p.Name, p.Email, p.Phone, p.Type, p.IsActive, p.ProfilePictureUrl));
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
