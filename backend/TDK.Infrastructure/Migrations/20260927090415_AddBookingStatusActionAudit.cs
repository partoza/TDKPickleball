using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TDK.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBookingStatusActionAudit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CancelledAt",
                table: "Bookings",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CancelledByName",
                table: "Bookings",
                type: "varchar(200)",
                maxLength: 200,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "CancelledByUserId",
                table: "Bookings",
                type: "varchar(450)",
                maxLength: 450,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateTime>(
                name: "ConfirmedAt",
                table: "Bookings",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ConfirmedByName",
                table: "Bookings",
                type: "varchar(200)",
                maxLength: 200,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "ConfirmedByUserId",
                table: "Bookings",
                type: "varchar(450)",
                maxLength: 450,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "RescheduledByName",
                table: "Bookings",
                type: "varchar(200)",
                maxLength: 200,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "RescheduledByUserId",
                table: "Bookings",
                type: "varchar(450)",
                maxLength: 450,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.Sql("""
                UPDATE `Bookings`
                SET `CancelledAt` = COALESCE(`UpdatedAt`, `CreatedAt`),
                    `CancelledByName` = 'Legacy record'
                WHERE `Status` = 2;

                UPDATE `Bookings`
                SET `RescheduledByName` = 'Legacy record'
                WHERE `RescheduledAt` IS NOT NULL;

                UPDATE `Bookings`
                SET `ConfirmedAt` = COALESCE(`UpdatedAt`, `CreatedAt`),
                    `ConfirmedByName` = 'Legacy record'
                WHERE `Status` IN (1, 3);
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CancelledAt",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "CancelledByName",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "CancelledByUserId",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "ConfirmedAt",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "ConfirmedByName",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "ConfirmedByUserId",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "RescheduledByName",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "RescheduledByUserId",
                table: "Bookings");
        }
    }
}
