using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TDK.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ReconcileInternalCoachProfiles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Some development databases received an earlier draft of the rename that
            // created the new table beside the legacy table. Preserve any legacy rows
            // before removing that duplicate schema. On a clean database this is a no-op.
            migrationBuilder.Sql("SET @legacy_profiles_exist = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'StaffProfiles');");
            migrationBuilder.Sql("""
                SET @copy_legacy_profiles_sql = IF(
                    @legacy_profiles_exist > 0,
                    'INSERT IGNORE INTO `InternalCoachProfiles` (`Id`, `Name`, `Email`, `Phone`, `Type`, `ProfilePictureUrl`, `IsActive`, `CreatedAt`, `UpdatedAt`) SELECT `Id`, `Name`, `Email`, `Phone`, `Type`, `ProfilePictureUrl`, `IsActive`, `CreatedAt`, `UpdatedAt` FROM `StaffProfiles`',
                    'SELECT 1');
                """);
            migrationBuilder.Sql("PREPARE copy_legacy_profiles FROM @copy_legacy_profiles_sql;");
            migrationBuilder.Sql("EXECUTE copy_legacy_profiles;");
            migrationBuilder.Sql("DEALLOCATE PREPARE copy_legacy_profiles;");

            migrationBuilder.Sql("SET @legacy_profiles_fk = (SELECT CONSTRAINT_NAME FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'Bookings' AND REFERENCED_TABLE_NAME = 'StaffProfiles' LIMIT 1);");
            migrationBuilder.Sql("SET @drop_legacy_profiles_fk_sql = IF(@legacy_profiles_fk IS NULL, 'SELECT 1', CONCAT('ALTER TABLE `Bookings` DROP FOREIGN KEY `', REPLACE(@legacy_profiles_fk, '`', '``'), '`'));");
            migrationBuilder.Sql("PREPARE drop_legacy_profiles_fk FROM @drop_legacy_profiles_fk_sql;");
            migrationBuilder.Sql("EXECUTE drop_legacy_profiles_fk;");
            migrationBuilder.Sql("DEALLOCATE PREPARE drop_legacy_profiles_fk;");
            migrationBuilder.Sql("DROP TABLE IF EXISTS `StaffProfiles`;");

            migrationBuilder.UpdateData(
                table: "Courts",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 23, 21, 12, 40, 211, DateTimeKind.Utc).AddTicks(710), new DateTime(2026, 9, 23, 21, 12, 40, 211, DateTimeKind.Utc).AddTicks(714) });

            migrationBuilder.UpdateData(
                table: "Courts",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 23, 21, 12, 40, 211, DateTimeKind.Utc).AddTicks(718), new DateTime(2026, 9, 23, 21, 12, 40, 211, DateTimeKind.Utc).AddTicks(719) });

            migrationBuilder.UpdateData(
                table: "Rates",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 23, 21, 12, 40, 212, DateTimeKind.Utc).AddTicks(9102), new DateTime(2026, 9, 23, 21, 12, 40, 212, DateTimeKind.Utc).AddTicks(9106) });

            migrationBuilder.UpdateData(
                table: "Rates",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 23, 21, 12, 40, 212, DateTimeKind.Utc).AddTicks(9109), new DateTime(2026, 9, 23, 21, 12, 40, 212, DateTimeKind.Utc).AddTicks(9110) });

            migrationBuilder.UpdateData(
                table: "Rates",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 23, 21, 12, 40, 212, DateTimeKind.Utc).AddTicks(9113), new DateTime(2026, 9, 23, 21, 12, 40, 212, DateTimeKind.Utc).AddTicks(9114) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Courts",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 23, 18, 25, 49, 781, DateTimeKind.Utc).AddTicks(630), new DateTime(2026, 9, 23, 18, 25, 49, 781, DateTimeKind.Utc).AddTicks(633) });

            migrationBuilder.UpdateData(
                table: "Courts",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 23, 18, 25, 49, 781, DateTimeKind.Utc).AddTicks(637), new DateTime(2026, 9, 23, 18, 25, 49, 781, DateTimeKind.Utc).AddTicks(638) });

            migrationBuilder.UpdateData(
                table: "Rates",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 23, 18, 25, 49, 782, DateTimeKind.Utc).AddTicks(6766), new DateTime(2026, 9, 23, 18, 25, 49, 782, DateTimeKind.Utc).AddTicks(6770) });

            migrationBuilder.UpdateData(
                table: "Rates",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 23, 18, 25, 49, 782, DateTimeKind.Utc).AddTicks(6773), new DateTime(2026, 9, 23, 18, 25, 49, 782, DateTimeKind.Utc).AddTicks(6774) });

            migrationBuilder.UpdateData(
                table: "Rates",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 9, 23, 18, 25, 49, 782, DateTimeKind.Utc).AddTicks(6777), new DateTime(2026, 9, 23, 18, 25, 49, 782, DateTimeKind.Utc).AddTicks(6778) });
        }
    }
}
