using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TDK.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ReconcilePromoUsageAfterCancellation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                UPDATE `Promos` AS `promo`
                SET `promo`.`CurrentUses` = (
                    SELECT COUNT(*)
                    FROM `Bookings` AS `booking`
                    WHERE `booking`.`PromoId` = `promo`.`Id`
                      AND `booking`.`Status` <> 2
                );
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Reconciliation cannot safely recreate historical over-counting.
        }
    }
}
