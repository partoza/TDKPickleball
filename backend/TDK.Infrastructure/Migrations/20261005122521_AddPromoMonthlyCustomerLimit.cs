using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TDK.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPromoMonthlyCustomerLimit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MonthlyUsageLimitPerCustomer",
                table: "Promos",
                type: "int",
                nullable: true);

            migrationBuilder.Sql(
                "UPDATE `Promos` SET `MonthlyUsageLimitPerCustomer` = 3 WHERE `Audience` = 'NfcCustomersOnly'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MonthlyUsageLimitPerCustomer",
                table: "Promos");
        }
    }
}
