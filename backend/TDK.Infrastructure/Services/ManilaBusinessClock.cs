using TDK.Application.Interfaces;

namespace TDK.Infrastructure.Services;

public sealed class ManilaBusinessClock : IBusinessClock
{
    private static readonly TimeZoneInfo ManilaTimeZone = ResolveManilaTimeZone();

    public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;

    public DateTimeOffset ToManilaTime(DateTimeOffset instant) =>
        TimeZoneInfo.ConvertTime(instant, ManilaTimeZone);

    public DateOnly ManilaToday => DateOnly.FromDateTime(ToManilaTime(UtcNow).DateTime);

    private static TimeZoneInfo ResolveManilaTimeZone()
    {
        if (TimeZoneInfo.TryFindSystemTimeZoneById("Asia/Manila", out var manilaTimeZone))
            return manilaTimeZone;

        // Windows hosts without IANA time-zone data use this equivalent UTC+08:00 zone.
        if (TimeZoneInfo.TryFindSystemTimeZoneById("Singapore Standard Time", out var windowsTimeZone))
            return windowsTimeZone;

        // The Philippines does not currently observe daylight saving time.
        return TimeZoneInfo.CreateCustomTimeZone(
            "Asia/Manila",
            TimeSpan.FromHours(8),
            "Philippine Standard Time",
            "Philippine Standard Time");
    }
}
