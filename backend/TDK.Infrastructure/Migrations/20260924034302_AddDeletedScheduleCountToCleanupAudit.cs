using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TDK.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDeletedScheduleCountToCleanupAudit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DeletedScheduleCount",
                table: "BookingCleanupAudits",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.UpdateData(
                table: "Courts",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 24, 3, 43, 0, 926, DateTimeKind.Utc).AddTicks(5973), new DateTime(2026, 9, 24, 3, 43, 0, 926, DateTimeKind.Utc).AddTicks(5978) });

            migrationBuilder.UpdateData(
                table: "Courts",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 24, 3, 43, 0, 926, DateTimeKind.Utc).AddTicks(5982), new DateTime(2026, 9, 24, 3, 43, 0, 926, DateTimeKind.Utc).AddTicks(5983) });

            migrationBuilder.UpdateData(
                table: "Rates",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 24, 3, 43, 0, 928, DateTimeKind.Utc).AddTicks(5007), new DateTime(2026, 9, 24, 3, 43, 0, 928, DateTimeKind.Utc).AddTicks(5011) });

            migrationBuilder.UpdateData(
                table: "Rates",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 24, 3, 43, 0, 928, DateTimeKind.Utc).AddTicks(5016), new DateTime(2026, 9, 24, 3, 43, 0, 928, DateTimeKind.Utc).AddTicks(5017) });

            migrationBuilder.UpdateData(
                table: "Rates",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 24, 3, 43, 0, 928, DateTimeKind.Utc).AddTicks(5020), new DateTime(2026, 9, 24, 3, 43, 0, 928, DateTimeKind.Utc).AddTicks(5021) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DeletedScheduleCount",
                table: "BookingCleanupAudits");

            migrationBuilder.UpdateData(
                table: "Courts",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 23, 21, 12, 40, 211, DateTimeKind.Utc).AddTicks(710), new DateTime(2026, 9, 23, 21, 12, 40, 211, DateTimeKind.Utc).AddTicks(714) });

            migrationBuilder.UpdateData(
                table: "Courts",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 23, 21, 12, 40, 211, DateTimeKind.Utc).AddTicks(718), new DateTime(2026, 9, 23, 21, 12, 40, 211, DateTimeKind.Utc).AddTicks(719) });

            migrationBuilder.UpdateData(
                table: "Rates",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 23, 21, 12, 40, 212, DateTimeKind.Utc).AddTicks(9102), new DateTime(2026, 9, 23, 21, 12, 40, 212, DateTimeKind.Utc).AddTicks(9106) });

            migrationBuilder.UpdateData(
                table: "Rates",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 23, 21, 12, 40, 212, DateTimeKind.Utc).AddTicks(9109), new DateTime(2026, 9, 23, 21, 12, 40, 212, DateTimeKind.Utc).AddTicks(9110) });

            migrationBuilder.UpdateData(
                table: "Rates",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 23, 21, 12, 40, 212, DateTimeKind.Utc).AddTicks(9113), new DateTime(2026, 9, 23, 21, 12, 40, 212, DateTimeKind.Utc).AddTicks(9114) });
        }
    }
}
