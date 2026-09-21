using TDK.Application.DTOs.Common;
using TDK.Application.DTOs.Courts;
using TDK.Application.Interfaces;
using TDK.Domain.Entities;
using TDK.Domain.Interfaces;

namespace TDK.Application.Services;

public class CourtService : ICourtService
{
    private readonly IRepository<Court> _courtRepo;

    public CourtService(IRepository<Court> courtRepo)
    {
        _courtRepo = courtRepo;
    }

    public async Task<ApiResponse<IEnumerable<CourtDto>>> GetAllAsync()
    {
        var courts = await _courtRepo.GetAllAsync();
        var dtos = courts.OrderBy(c => c.SortOrder).Select(c => new CourtDto(c.Id, c.Name, c.DisplayName, c.IsActive, c.SortOrder, c.OpenTime, c.CloseTime));
        return ApiResponse<IEnumerable<CourtDto>>.Ok(dtos);
    }

    public async Task<ApiResponse<CourtDto>> GetByIdAsync(int id)
    {
        var court = await _courtRepo.GetByIdAsync(id);
        if (court == null) return ApiResponse<CourtDto>.Fail("Court not found");
        return ApiResponse<CourtDto>.Ok(new CourtDto(court.Id, court.Name, court.DisplayName, court.IsActive, court.SortOrder, court.OpenTime, court.CloseTime));
    }

    public async Task<ApiResponse<CourtDto>> CreateAsync(CreateCourtRequest request)
    {
        var court = new Court
        {
            Name = request.Name,
            DisplayName = request.DisplayName,
            IsActive = true,
            OpenTime = new TimeOnly(7, 0),
            CloseTime = TimeOnly.MinValue,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _courtRepo.AddAsync(court);
        await _courtRepo.SaveChangesAsync();
        return ApiResponse<CourtDto>.Ok(new CourtDto(court.Id, court.Name, court.DisplayName, court.IsActive, court.SortOrder, court.OpenTime, court.CloseTime));
    }

    public async Task<ApiResponse<CourtDto>> UpdateAsync(int id, UpdateCourtRequest request)
    {
        var court = await _courtRepo.GetByIdAsync(id);
        if (court == null) return ApiResponse<CourtDto>.Fail("Court not found");

        court.Name = request.Name;
        court.DisplayName = request.DisplayName;
        court.IsActive = request.IsActive;
        court.SortOrder = request.SortOrder;
        court.OpenTime = new TimeOnly(7, 0);
        court.CloseTime = TimeOnly.MinValue;
        court.UpdatedAt = DateTime.UtcNow;

        _courtRepo.Update(court);
        await _courtRepo.SaveChangesAsync();
        return ApiResponse<CourtDto>.Ok(new CourtDto(court.Id, court.Name, court.DisplayName, court.IsActive, court.SortOrder, court.OpenTime, court.CloseTime));
    }

    public async Task<ApiResponse<bool>> DeleteAsync(int id)
    {
        var court = await _courtRepo.GetByIdAsync(id);
        if (court == null) return ApiResponse<bool>.Fail("Court not found");
        _courtRepo.Delete(court);
        await _courtRepo.SaveChangesAsync();
        return ApiResponse<bool>.Ok(true);
    }
}
