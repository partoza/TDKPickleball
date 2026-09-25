using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TDK.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RenameStaffProfilesToInternalCoaches : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Bookings_StaffProfiles_StaffProfileId",
                table: "Bookings");

            migrationBuilder.RenameTable(
                name: "StaffProfiles",
                newName: "InternalCoachProfiles");

            // Older MariaDB versions do not support the RENAME COLUMN syntax emitted by
            // Pomelo for RenameColumn. CHANGE COLUMN works on both MySQL and MariaDB.
            migrationBuilder.Sql(
                "ALTER TABLE `Bookings` CHANGE COLUMN `StaffProfileId` `InternalCoachProfileId` int NULL;");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_StaffProfileId",
                table: "Bookings");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_InternalCoachProfileId",
                table: "Bookings",
                column: "InternalCoachProfileId");

            // MySQL and TiDB retain the PRIMARY KEY when a table is renamed. Avoid
            // DropPrimaryKey/AddPrimaryKey here because Pomelo implements that pair
            // with a temporary stored procedure, and TiDB does not support the
            // generated procedure syntax.

            migrationBuilder.AddForeignKey(
                name: "FK_Bookings_InternalCoachProfiles_InternalCoachProfileId",
                table: "Bookings",
                column: "InternalCoachProfileId",
                principalTable: "InternalCoachProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.UpdateData(
                table: "Courts",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 23, 18, 18, 16, 823, DateTimeKind.Utc).AddTicks(3969), new DateTime(2026, 9, 23, 18, 18, 16, 823, DateTimeKind.Utc).AddTicks(3973) });

            migrationBuilder.UpdateData(
                table: "Courts",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 23, 18, 18, 16, 823, DateTimeKind.Utc).AddTicks(3977), new DateTime(2026, 9, 23, 18, 18, 16, 823, DateTimeKind.Utc).AddTicks(3978) });

            migrationBuilder.UpdateData(
                table: "Rates",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 23, 18, 18, 16, 825, DateTimeKind.Utc).AddTicks(1293), new DateTime(2026, 9, 23, 18, 18, 16, 825, DateTimeKind.Utc).AddTicks(1297) });

            migrationBuilder.UpdateData(
                table: "Rates",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 23, 18, 18, 16, 825, DateTimeKind.Utc).AddTicks(1300), new DateTime(2026, 9, 23, 18, 18, 16, 825, DateTimeKind.Utc).AddTicks(1301) });

            migrationBuilder.UpdateData(
                table: "Rates",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 23, 18, 18, 16, 825, DateTimeKind.Utc).AddTicks(1304), new DateTime(2026, 9, 23, 18, 18, 16, 825, DateTimeKind.Utc).AddTicks(1304) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Bookings_InternalCoachProfiles_InternalCoachProfileId",
                table: "Bookings");

            migrationBuilder.RenameTable(
                name: "InternalCoachProfiles",
                newName: "StaffProfiles");

            migrationBuilder.Sql(
                "ALTER TABLE `Bookings` CHANGE COLUMN `InternalCoachProfileId` `StaffProfileId` int NULL;");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_InternalCoachProfileId",
                table: "Bookings");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_StaffProfileId",
                table: "Bookings",
                column: "StaffProfileId");

            // Renaming the table also preserves its PRIMARY KEY on rollback.

            migrationBuilder.AddForeignKey(
                name: "FK_Bookings_StaffProfiles_StaffProfileId",
                table: "Bookings",
                column: "StaffProfileId",
                principalTable: "StaffProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

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
    }
}
