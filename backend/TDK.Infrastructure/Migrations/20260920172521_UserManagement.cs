using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TDK.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UserManagement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "MustChangePassword",
                table: "AspNetUsers",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.UpdateData(
                table: "Courts",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 20, 17, 25, 19, 864, DateTimeKind.Utc).AddTicks(3764), new DateTime(2026, 9, 20, 17, 25, 19, 864, DateTimeKind.Utc).AddTicks(3767) });

            migrationBuilder.UpdateData(
                table: "Courts",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 20, 17, 25, 19, 864, DateTimeKind.Utc).AddTicks(3771), new DateTime(2026, 9, 20, 17, 25, 19, 864, DateTimeKind.Utc).AddTicks(3772) });

            migrationBuilder.UpdateData(
                table: "Rates",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 20, 17, 25, 19, 865, DateTimeKind.Utc).AddTicks(1997), new DateTime(2026, 9, 20, 17, 25, 19, 865, DateTimeKind.Utc).AddTicks(1998) });

            migrationBuilder.UpdateData(
                table: "Rates",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 20, 17, 25, 19, 865, DateTimeKind.Utc).AddTicks(2001), new DateTime(2026, 9, 20, 17, 25, 19, 865, DateTimeKind.Utc).AddTicks(2002) });

            migrationBuilder.InsertData(
                table: "Rates",
                columns: new[] { "Id", "CreatedAt", "EndTime", "IsActive", "PricePerHour", "RateType", "StartTime", "UpdatedAt" },
                values: new object[] { 3, new DateTime(2026, 9, 20, 17, 25, 19, 865, DateTimeKind.Utc).AddTicks(2005), new TimeOnly(0, 0, 0), true, 300m, 1, new TimeOnly(7, 0, 0), new DateTime(2026, 9, 20, 17, 25, 19, 865, DateTimeKind.Utc).AddTicks(2006) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Rates",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DropColumn(
                name: "MustChangePassword",
                table: "AspNetUsers");

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
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 20, 12, 12, 46, 922, DateTimeKind.Utc).AddTicks(197), new DateTime(2026, 9, 20, 12, 12, 46, 922, DateTimeKind.Utc).AddTicks(199) });

            migrationBuilder.UpdateData(
                table: "Rates",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 20, 12, 12, 46, 922, DateTimeKind.Utc).AddTicks(203), new DateTime(2026, 9, 20, 12, 12, 46, 922, DateTimeKind.Utc).AddTicks(204) });
        }
    }
}
