using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TDK.Infrastructure.Migrations
{
    /// <summary>
    /// Compatibility checkpoint retained because this migration identifier may already exist
    /// in deployed databases. The data-preserving rename is performed by the preceding
    /// RenameStaffProfilesToInternalCoaches migration.
    /// </summary>
    public partial class AddInternalCoachProfile : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
