using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TDK.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddStaffProfiles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "StaffProfileId",
                table: "Bookings",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "StaffProfiles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Name = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Email = table.Column<string>(type: "varchar(254)", maxLength: 254, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Phone = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Type = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StaffProfiles", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

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

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_StaffProfileId",
                table: "Bookings",
                column: "StaffProfileId");

            migrationBuilder.AddForeignKey(
                name: "FK_Bookings_StaffProfiles_StaffProfileId",
                table: "Bookings",
                column: "StaffProfileId",
                principalTable: "StaffProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Bookings_StaffProfiles_StaffProfileId",
                table: "Bookings");

            migrationBuilder.DropTable(
                name: "StaffProfiles");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_StaffProfileId",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "StaffProfileId",
                table: "Bookings");

            migrationBuilder.UpdateData(
                table: "Courts",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 23, 6, 30, 7, 420, DateTimeKind.Utc).AddTicks(1126), new DateTime(2026, 9, 23, 6, 30, 7, 420, DateTimeKind.Utc).AddTicks(1129) });

            migrationBuilder.UpdateData(
                table: "Courts",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 23, 6, 30, 7, 420, DateTimeKind.Utc).AddTicks(1133), new DateTime(2026, 9, 23, 6, 30, 7, 420, DateTimeKind.Utc).AddTicks(1134) });

            migrationBuilder.UpdateData(
                table: "Rates",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 23, 6, 30, 7, 421, DateTimeKind.Utc).AddTicks(1180), new DateTime(2026, 9, 23, 6, 30, 7, 421, DateTimeKind.Utc).AddTicks(1183) });

            migrationBuilder.UpdateData(
                table: "Rates",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 23, 6, 30, 7, 421, DateTimeKind.Utc).AddTicks(1187), new DateTime(2026, 9, 23, 6, 30, 7, 421, DateTimeKind.Utc).AddTicks(1187) });

            migrationBuilder.UpdateData(
                table: "Rates",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 23, 6, 30, 7, 421, DateTimeKind.Utc).AddTicks(1191), new DateTime(2026, 9, 23, 6, 30, 7, 421, DateTimeKind.Utc).AddTicks(1192) });
        }
    }
}
