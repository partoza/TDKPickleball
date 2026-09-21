namespace TDK.Domain.Entities;

public class TimeSlot
{
    public int Id { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public string DisplayName { get; set; } = null!;
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
    public ICollection<Schedule> Schedules { get; set; } = new List<Schedule>();
}