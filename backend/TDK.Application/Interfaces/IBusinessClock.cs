namespace TDK.Application.Interfaces;

public interface IBusinessClock
{
    DateTimeOffset UtcNow { get; }
    DateTimeOffset ToManilaTime(DateTimeOffset instant);
    DateOnly ManilaToday { get; }
}
