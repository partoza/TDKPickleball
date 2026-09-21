namespace TDK.Application.DTOs.Courts;

public record CourtDto(int Id, string Name, string DisplayName, bool IsActive, int SortOrder, TimeOnly OpenTime, TimeOnly CloseTime);
public record CreateCourtRequest(string Name, string DisplayName, TimeOnly OpenTime, TimeOnly CloseTime);
public record UpdateCourtRequest(string Name, string DisplayName, bool IsActive, int SortOrder, TimeOnly OpenTime, TimeOnly CloseTime);
