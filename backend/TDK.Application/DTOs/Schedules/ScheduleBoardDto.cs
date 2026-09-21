using TDK.Application.DTOs.Courts;
using TDK.Application.DTOs.Rates;

namespace TDK.Application.DTOs.Schedules;

public record ScheduleBoardDto(List<CourtScheduleDto> Courts, List<TimeSlotDto> TimeSlots, List<RateDto> Rates);
public record CourtScheduleDto(CourtDto Court, List<ScheduleDto> Schedules);
public record TimeSlotDto(int Id, TimeOnly StartTime, TimeOnly EndTime, string DisplayName);