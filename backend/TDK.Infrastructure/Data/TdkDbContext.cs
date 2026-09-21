using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System.Reflection;
using TDK.Domain.Entities;
using TDK.Infrastructure.Identity;

namespace TDK.Infrastructure.Data;

public class TdkDbContext : IdentityDbContext<ApplicationUser>
{
    public TdkDbContext(DbContextOptions<TdkDbContext> options) : base(options)
    {
    }

    public DbSet<Court> Courts { get; set; }
    public DbSet<TimeSlot> TimeSlots { get; set; }
    public DbSet<Schedule> Schedules { get; set; }
    public DbSet<Booking> Bookings { get; set; }
    public DbSet<Rate> Rates { get; set; }
    public DbSet<Notification> Notifications { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
    }
}
