namespace TDK.Application.Interfaces;

public interface IBusinessClock
{
    DateTimeOffset UtcNow { get; }
    DateTime ManilaNow { get; }
    DateTimeOffset ToManilaTime(DateTimeOffset instant);
    DateOnly ManilaToday { get; }
}
