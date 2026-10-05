using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TDK.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomerCardMembership : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ValidityDuration",
                table: "Rates",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ValidityUnit",
                table: "Rates",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "CardValidFrom",
                table: "Customers",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "CardValidThrough",
                table: "Customers",
                type: "date",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CustomerCardTransactions",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    CustomerId = table.Column<long>(type: "bigint", nullable: true),
                    Type = table.Column<int>(type: "int", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    ValidFrom = table.Column<DateOnly>(type: "date", nullable: false),
                    ValidThrough = table.Column<DateOnly>(type: "date", nullable: false),
                    ValidityDuration = table.Column<int>(type: "int", nullable: false),
                    ValidityUnit = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CustomerCardTransactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CustomerCardTransactions_Customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.UpdateData(
                table: "Rates",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "ValidityDuration", "ValidityUnit" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Rates",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "ValidityDuration", "ValidityUnit" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Rates",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "ValidityDuration", "ValidityUnit" },
                values: new object[] { null, null });

            migrationBuilder.CreateIndex(
                name: "IX_CustomerCardTransactions_CreatedAt",
                table: "CustomerCardTransactions",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerCardTransactions_CustomerId",
                table: "CustomerCardTransactions",
                column: "CustomerId");

            // Preserve existing issued cards with a one-year legacy validity period.
            // New purchases and renewals use the active Customer Card rate configuration.
            migrationBuilder.Sql("""
                UPDATE Customers
                SET CardValidFrom = DATE(COALESCE(NfcIssuedAt, CreatedAt)),
                    CardValidThrough = DATE_SUB(DATE_ADD(DATE(COALESCE(NfcIssuedAt, CreatedAt)), INTERVAL 1 YEAR), INTERVAL 1 DAY)
                WHERE NfcTokenHash IS NOT NULL
                  AND CardValidFrom IS NULL
                  AND CardValidThrough IS NULL;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CustomerCardTransactions");

            migrationBuilder.DropColumn(
                name: "ValidityDuration",
                table: "Rates");

            migrationBuilder.DropColumn(
                name: "ValidityUnit",
                table: "Rates");

            migrationBuilder.DropColumn(
                name: "CardValidFrom",
                table: "Customers");

            migrationBuilder.DropColumn(
                name: "CardValidThrough",
                table: "Customers");
        }
    }
}
