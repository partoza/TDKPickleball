using TDK.Application.DTOs.Common;
using TDK.Application.DTOs.Schedules;
using TDK.Application.Interfaces;
using TDK.Domain.Entities;
using TDK.Domain.Interfaces;

namespace TDK.Application.Services;

public class PublicBookingWindowService : IPublicBookingWindowService
{
    private const int SettingsId = 1;
    private readonly IRepository<PublicBookingWindow> _repository;
    private readonly IBusinessClock _clock;

    public PublicBookingWindowService(IRepository<PublicBookingWindow> repository, IBusinessClock clock)
    {
        _repository = repository;
        _clock = clock;
    }

    public async Task<ApiResponse<PublicBookingWindowDto>> GetAsync() =>
        ApiResponse<PublicBookingWindowDto>.Ok(new(await GetBookingThroughDateAsync()));

    public async Task<DateOnly?> GetBookingThroughDateAsync() =>
        (await _repository.GetByIdAsync(SettingsId))?.BookingThroughDate;

    public async Task<ApiResponse<PublicBookingWindowDto>> UpdateAsync(UpdatePublicBookingWindowRequest request, string userId)
    {
        var today = DateOnly.FromDateTime(_clock.ManilaNow);
        if (request.BookingThroughDate.HasValue && request.BookingThroughDate.Value < today)
            return ApiResponse<PublicBookingWindowDto>.Fail("The public booking end date cannot be earlier than today");

        var settings = await _repository.GetByIdAsync(SettingsId);
        var isNew = settings is null;
        if (settings is null)
        {
            settings = new PublicBookingWindow { Id = SettingsId };
            await _repository.AddAsync(settings);
        }

        settings.BookingThroughDate = request.BookingThroughDate;
        settings.UpdatedAt = _clock.UtcNow.UtcDateTime;
        settings.UpdatedByUserId = userId;
        if (!isNew) _repository.Update(settings);
        await _repository.SaveChangesAsync();

        var message = settings.BookingThroughDate.HasValue
            ? $"Public bookings are open through {settings.BookingThroughDate:MMMM d, yyyy}"
            : "The public booking date limit has been removed";
        return ApiResponse<PublicBookingWindowDto>.Ok(new(settings.BookingThroughDate), message);
    }
}
