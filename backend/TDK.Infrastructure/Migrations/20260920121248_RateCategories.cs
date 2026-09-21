using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TDK.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RateCategories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "RateType",
                table: "Rates",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.UpdateData(
                table: "Courts",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 20, 12, 12, 46, 920, DateTimeKind.Utc).AddTicks(9050), new DateTime(2026, 9, 20, 12, 12, 46, 920, DateTimeKind.Utc).AddTicks(9054) });

            migrationBuilder.UpdateData(
                table: "Courts",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 20, 12, 12, 46, 920, DateTimeKind.Utc).AddTicks(9059), new DateTime(2026, 9, 20, 12, 12, 46, 920, DateTimeKind.Utc).AddTicks(9060) });

            migrationBuilder.UpdateData(
                table: "Rates",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "RateType", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 20, 12, 12, 46, 922, DateTimeKind.Utc).AddTicks(197), 0, new DateTime(2026, 9, 20, 12, 12, 46, 922, DateTimeKind.Utc).AddTicks(199) });

            migrationBuilder.UpdateData(
                table: "Rates",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "RateType", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 20, 12, 12, 46, 922, DateTimeKind.Utc).AddTicks(203), 0, new DateTime(2026, 9, 20, 12, 12, 46, 922, DateTimeKind.Utc).AddTicks(204) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RateType",
                table: "Rates");

            migrationBuilder.UpdateData(
                table: "Courts",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 20, 11, 33, 40, 182, DateTimeKind.Utc).AddTicks(267), new DateTime(2026, 9, 20, 11, 33, 40, 182, DateTimeKind.Utc).AddTicks(272) });

            migrationBuilder.UpdateData(
                table: "Courts",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 20, 11, 33, 40, 182, DateTimeKind.Utc).AddTicks(277), new DateTime(2026, 9, 20, 11, 33, 40, 182, DateTimeKind.Utc).AddTicks(278) });

            migrationBuilder.UpdateData(
                table: "Rates",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 20, 11, 33, 40, 183, DateTimeKind.Utc).AddTicks(3558), new DateTime(2026, 9, 20, 11, 33, 40, 183, DateTimeKind.Utc).AddTicks(3565) });

            migrationBuilder.UpdateData(
                table: "Rates",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 20, 11, 33, 40, 183, DateTimeKind.Utc).AddTicks(3569), new DateTime(2026, 9, 20, 11, 33, 40, 183, DateTimeKind.Utc).AddTicks(3571) });
        }
    }
}
