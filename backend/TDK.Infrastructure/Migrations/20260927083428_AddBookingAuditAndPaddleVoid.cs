using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TDK.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBookingAuditAndPaddleVoid : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ListedByName",
                table: "Bookings",
                type: "varchar(200)",
                maxLength: 200,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "ListedByUserId",
                table: "Bookings",
                type: "varchar(450)",
                maxLength: 450,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateTime>(
                name: "PaddleRentalVoidedAt",
                table: "Bookings",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaddleRentalVoidedByName",
                table: "Bookings",
                type: "varchar(200)",
                maxLength: 200,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "PaddleRentalVoidedByUserId",
                table: "Bookings",
                type: "varchar(450)",
                maxLength: 450,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<decimal>(
                name: "VoidedPaddleRentalFee",
                table: "Bookings",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "VoidedPaddleRentalQuantity",
                table: "Bookings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            // Booking audit timestamps were historically saved as UTC values in
            // timezone-less MySQL datetime columns. Convert existing audit data
            // once so the storage contract is consistently Manila wall time.
            migrationBuilder.Sql("""
                UPDATE `Bookings`
                SET `CreatedAt` = DATE_ADD(`CreatedAt`, INTERVAL 8 HOUR),
                    `UpdatedAt` = CASE WHEN `UpdatedAt` IS NULL THEN NULL ELSE DATE_ADD(`UpdatedAt`, INTERVAL 8 HOUR) END,
                    `RescheduledAt` = CASE WHEN `RescheduledAt` IS NULL THEN NULL ELSE DATE_ADD(`RescheduledAt`, INTERVAL 8 HOUR) END,
                    `ListedByName` = COALESCE(`ListedByName`, 'Legacy record');
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                UPDATE `Bookings`
                SET `CreatedAt` = DATE_SUB(`CreatedAt`, INTERVAL 8 HOUR),
                    `UpdatedAt` = CASE WHEN `UpdatedAt` IS NULL THEN NULL ELSE DATE_SUB(`UpdatedAt`, INTERVAL 8 HOUR) END,
                    `RescheduledAt` = CASE WHEN `RescheduledAt` IS NULL THEN NULL ELSE DATE_SUB(`RescheduledAt`, INTERVAL 8 HOUR) END;
                """);

            migrationBuilder.DropColumn(
                name: "ListedByName",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "ListedByUserId",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "PaddleRentalVoidedAt",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "PaddleRentalVoidedByName",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "PaddleRentalVoidedByUserId",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "VoidedPaddleRentalFee",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "VoidedPaddleRentalQuantity",
                table: "Bookings");
        }
    }
}
