using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TDK.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class MakeCustomerNfcAdminManaged : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Remove only the legacy customer rows created by the earlier automatic booking backfill.
            // Booking snapshots remain intact and the nullable relationship is cleared first.
            migrationBuilder.Sql(@"
                UPDATE Bookings b
                INNER JOIN Customers c ON c.Id = b.CustomerId
                SET b.CustomerId = NULL
                WHERE c.AdminNotes = 'Created automatically from unambiguous historical booking records.'
                  AND c.Username LIKE 'legacy-%';

                DELETE FROM Customers
                WHERE AdminNotes = 'Created automatically from unambiguous historical booking records.'
                  AND Username LIKE 'legacy-%';");

            migrationBuilder.AddColumn<string>(
                name: "NfcTokenProtected",
                table: "Customers",
                type: "varchar(1000)",
                maxLength: 1000,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NfcTokenProtected",
                table: "Customers");
        }
    }
}
