using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TDK.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPaddleRentalToBookings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "PaddleRentalFee",
                table: "Bookings",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "PaddleRentalQuantity",
                table: "Bookings",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PaddleRentalFee",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "PaddleRentalQuantity",
                table: "Bookings");
        }
    }
}
