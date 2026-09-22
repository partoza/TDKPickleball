using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using TDK.Infrastructure.Data;

#nullable disable

namespace TDK.Infrastructure.Migrations;

[DbContext(typeof(TdkDbContext))]
[Migration("20260923020000_AddBookingRescheduleTracking")]
public partial class AddBookingRescheduleTracking : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<DateTime>(
            name: "RescheduledAt",
            table: "Bookings",
            type: "datetime2",
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "RescheduledAt",
            table: "Bookings");
    }
}
