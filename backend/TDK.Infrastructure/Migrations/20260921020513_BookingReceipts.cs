using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TDK.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class BookingReceipts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ReceiptContentType",
                table: "Bookings",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReceiptFileName",
                table: "Bookings",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Courts",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 21, 2, 5, 11, 901, DateTimeKind.Utc).AddTicks(861), new DateTime(2026, 9, 21, 2, 5, 11, 901, DateTimeKind.Utc).AddTicks(865) });

            migrationBuilder.UpdateData(
                table: "Courts",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 21, 2, 5, 11, 901, DateTimeKind.Utc).AddTicks(869), new DateTime(2026, 9, 21, 2, 5, 11, 901, DateTimeKind.Utc).AddTicks(870) });

            migrationBuilder.UpdateData(
                table: "Rates",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 21, 2, 5, 11, 902, DateTimeKind.Utc).AddTicks(2667), new DateTime(2026, 9, 21, 2, 5, 11, 902, DateTimeKind.Utc).AddTicks(2670) });

            migrationBuilder.UpdateData(
                table: "Rates",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 21, 2, 5, 11, 902, DateTimeKind.Utc).AddTicks(2674), new DateTime(2026, 9, 21, 2, 5, 11, 902, DateTimeKind.Utc).AddTicks(2675) });

            migrationBuilder.UpdateData(
                table: "Rates",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 21, 2, 5, 11, 902, DateTimeKind.Utc).AddTicks(2679), new DateTime(2026, 9, 21, 2, 5, 11, 902, DateTimeKind.Utc).AddTicks(2679) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ReceiptContentType",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "ReceiptFileName",
                table: "Bookings");

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

            migrationBuilder.UpdateData(
                table: "Rates",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 20, 17, 25, 19, 865, DateTimeKind.Utc).AddTicks(2005), new DateTime(2026, 9, 20, 17, 25, 19, 865, DateTimeKind.Utc).AddTicks(2006) });
        }
    }
}
