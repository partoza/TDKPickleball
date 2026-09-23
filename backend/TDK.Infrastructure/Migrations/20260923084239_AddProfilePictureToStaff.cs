using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TDK.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProfilePictureToStaff : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ProfilePictureUrl",
                table: "StaffProfiles",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.UpdateData(
                table: "Courts",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 23, 8, 42, 37, 621, DateTimeKind.Utc).AddTicks(2831), new DateTime(2026, 9, 23, 8, 42, 37, 621, DateTimeKind.Utc).AddTicks(2835) });

            migrationBuilder.UpdateData(
                table: "Courts",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 23, 8, 42, 37, 621, DateTimeKind.Utc).AddTicks(2839), new DateTime(2026, 9, 23, 8, 42, 37, 621, DateTimeKind.Utc).AddTicks(2840) });

            migrationBuilder.UpdateData(
                table: "Rates",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 23, 8, 42, 37, 622, DateTimeKind.Utc).AddTicks(3533), new DateTime(2026, 9, 23, 8, 42, 37, 622, DateTimeKind.Utc).AddTicks(3534) });

            migrationBuilder.UpdateData(
                table: "Rates",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 23, 8, 42, 37, 622, DateTimeKind.Utc).AddTicks(3538), new DateTime(2026, 9, 23, 8, 42, 37, 622, DateTimeKind.Utc).AddTicks(3539) });

            migrationBuilder.UpdateData(
                table: "Rates",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 23, 8, 42, 37, 622, DateTimeKind.Utc).AddTicks(3543), new DateTime(2026, 9, 23, 8, 42, 37, 622, DateTimeKind.Utc).AddTicks(3544) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ProfilePictureUrl",
                table: "StaffProfiles");

            migrationBuilder.UpdateData(
                table: "Courts",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 23, 7, 56, 34, 43, DateTimeKind.Utc).AddTicks(6821), new DateTime(2026, 9, 23, 7, 56, 34, 43, DateTimeKind.Utc).AddTicks(6827) });

            migrationBuilder.UpdateData(
                table: "Courts",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 23, 7, 56, 34, 43, DateTimeKind.Utc).AddTicks(6832), new DateTime(2026, 9, 23, 7, 56, 34, 43, DateTimeKind.Utc).AddTicks(6833) });

            migrationBuilder.UpdateData(
                table: "Rates",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 23, 7, 56, 34, 45, DateTimeKind.Utc).AddTicks(5235), new DateTime(2026, 9, 23, 7, 56, 34, 45, DateTimeKind.Utc).AddTicks(5240) });

            migrationBuilder.UpdateData(
                table: "Rates",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 23, 7, 56, 34, 45, DateTimeKind.Utc).AddTicks(5245), new DateTime(2026, 9, 23, 7, 56, 34, 45, DateTimeKind.Utc).AddTicks(5246) });

            migrationBuilder.UpdateData(
                table: "Rates",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 23, 7, 56, 34, 45, DateTimeKind.Utc).AddTicks(5250), new DateTime(2026, 9, 23, 7, 56, 34, 45, DateTimeKind.Utc).AddTicks(5251) });
        }
    }
}
