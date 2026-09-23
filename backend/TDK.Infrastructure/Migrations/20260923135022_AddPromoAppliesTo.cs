using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TDK.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPromoAppliesTo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AppliesTo",
                table: "Promos",
                type: "int",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Courts",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 23, 13, 50, 20, 619, DateTimeKind.Utc).AddTicks(2253), new DateTime(2026, 9, 23, 13, 50, 20, 619, DateTimeKind.Utc).AddTicks(2257) });

            migrationBuilder.UpdateData(
                table: "Courts",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 23, 13, 50, 20, 619, DateTimeKind.Utc).AddTicks(2262), new DateTime(2026, 9, 23, 13, 50, 20, 619, DateTimeKind.Utc).AddTicks(2263) });

            migrationBuilder.UpdateData(
                table: "Rates",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 23, 13, 50, 20, 620, DateTimeKind.Utc).AddTicks(8684), new DateTime(2026, 9, 23, 13, 50, 20, 620, DateTimeKind.Utc).AddTicks(8689) });

            migrationBuilder.UpdateData(
                table: "Rates",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 23, 13, 50, 20, 620, DateTimeKind.Utc).AddTicks(8692), new DateTime(2026, 9, 23, 13, 50, 20, 620, DateTimeKind.Utc).AddTicks(8693) });

            migrationBuilder.UpdateData(
                table: "Rates",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 23, 13, 50, 20, 620, DateTimeKind.Utc).AddTicks(8696), new DateTime(2026, 9, 23, 13, 50, 20, 620, DateTimeKind.Utc).AddTicks(8697) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AppliesTo",
                table: "Promos");

            migrationBuilder.UpdateData(
                table: "Courts",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 23, 8, 56, 34, 508, DateTimeKind.Utc).AddTicks(2508), new DateTime(2026, 9, 23, 8, 56, 34, 508, DateTimeKind.Utc).AddTicks(2512) });

            migrationBuilder.UpdateData(
                table: "Courts",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 23, 8, 56, 34, 508, DateTimeKind.Utc).AddTicks(2517), new DateTime(2026, 9, 23, 8, 56, 34, 508, DateTimeKind.Utc).AddTicks(2518) });

            migrationBuilder.UpdateData(
                table: "Rates",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 23, 8, 56, 34, 509, DateTimeKind.Utc).AddTicks(7919), new DateTime(2026, 9, 23, 8, 56, 34, 509, DateTimeKind.Utc).AddTicks(7922) });

            migrationBuilder.UpdateData(
                table: "Rates",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 23, 8, 56, 34, 509, DateTimeKind.Utc).AddTicks(7926), new DateTime(2026, 9, 23, 8, 56, 34, 509, DateTimeKind.Utc).AddTicks(7927) });

            migrationBuilder.UpdateData(
                table: "Rates",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 23, 8, 56, 34, 509, DateTimeKind.Utc).AddTicks(7931), new DateTime(2026, 9, 23, 8, 56, 34, 509, DateTimeKind.Utc).AddTicks(7932) });
        }
    }
}
