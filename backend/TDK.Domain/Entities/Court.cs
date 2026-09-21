namespace TDK.Domain.Entities;

public class Court
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string DisplayName { get; set; } = null!;
    public bool IsActive { get; set; }
    public int SortOrder { get; set; }
    public TimeOnly OpenTime { get; set; } = new(7, 0);
    public TimeOnly CloseTime { get; set; } = new(0, 0);
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public ICollection<Schedule> Schedules { get; set; } = new List<Schedule>();
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}
