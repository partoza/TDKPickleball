using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TDK.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomerNfcLoyalty : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Audience",
                table: "Promos",
                type: "varchar(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "Everyone")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<long>(
                name: "CustomerId",
                table: "Bookings",
                type: "bigint",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Customers",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    FullName = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Username = table.Column<string>(type: "varchar(60)", maxLength: 60, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    NormalizedUsername = table.Column<string>(type: "varchar(60)", maxLength: 60, nullable: false, collation: "utf8mb4_bin")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Email = table.Column<string>(type: "varchar(254)", maxLength: 254, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    NormalizedEmail = table.Column<string>(type: "varchar(254)", maxLength: 254, nullable: false, collation: "utf8mb4_bin")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Phone = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    NfcTokenHash = table.Column<byte[]>(type: "varbinary(32)", maxLength: 32, nullable: true),
                    NfcIssuedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    NfcLastTappedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    AdminNotes = table.Column<string>(type: "varchar(1000)", maxLength: 1000, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Customers", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            // Preserve existing booking snapshots and only create/link a legacy customer when
            // a normalized email maps to exactly one normalized name. Ambiguous identities stay unlinked.
            migrationBuilder.Sql(@"
                INSERT INTO Customers
                    (FullName, Username, NormalizedUsername, Email, NormalizedEmail, Phone, IsActive,
                     NfcTokenHash, NfcIssuedAt, NfcLastTappedAt, CreatedAt, UpdatedAt, AdminNotes)
                SELECT
                    MIN(TRIM(b.CustomerName)),
                    CONCAT('legacy-', MIN(b.Id)),
                    UPPER(CONCAT('legacy-', MIN(b.Id))),
                    MIN(TRIM(b.Email)),
                    UPPER(TRIM(b.Email)),
                    NULLIF(MIN(TRIM(COALESCE(b.Phone, ''))), ''),
                    TRUE, NULL, NULL, NULL, UTC_TIMESTAMP(6), UTC_TIMESTAMP(6),
                    'Created automatically from unambiguous historical booking records.'
                FROM Bookings b
                WHERE TRIM(COALESCE(b.Email, '')) <> ''
                GROUP BY UPPER(TRIM(b.Email))
                HAVING COUNT(DISTINCT UPPER(TRIM(b.CustomerName))) = 1;");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_CustomerId",
                table: "Bookings",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_Customers_NormalizedEmail",
                table: "Customers",
                column: "NormalizedEmail",
                unique: true);

            migrationBuilder.Sql(@"
                UPDATE Bookings b
                INNER JOIN Customers c ON c.NormalizedEmail = UPPER(TRIM(b.Email))
                INNER JOIN (
                    SELECT NormalizedEmail
                    FROM Customers
                    GROUP BY NormalizedEmail
                    HAVING COUNT(*) = 1
                ) unique_customer ON unique_customer.NormalizedEmail = c.NormalizedEmail
                SET b.CustomerId = c.Id
                WHERE b.CustomerId IS NULL;");

            migrationBuilder.CreateIndex(
                name: "IX_Customers_NormalizedUsername",
                table: "Customers",
                column: "NormalizedUsername",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Bookings_Customers_CustomerId",
                table: "Bookings",
                column: "CustomerId",
                principalTable: "Customers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Bookings_Customers_CustomerId",
                table: "Bookings");

            migrationBuilder.DropTable(
                name: "Customers");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_CustomerId",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "Audience",
                table: "Promos");

            migrationBuilder.DropColumn(
                name: "CustomerId",
                table: "Bookings");
        }
    }
}
