using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using TDK.Infrastructure.Data;

#nullable disable

namespace TDK.Infrastructure.Migrations;

[DbContext(typeof(TdkDbContext))]
[Migration("20260922030000_AddUserProfileImages")]
public partial class AddUserProfileImages : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "ProfileImagePublicId",
            table: "AspNetUsers",
            type: "nvarchar(255)",
            maxLength: 255,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "ProfileImageUrl",
            table: "AspNetUsers",
            type: "nvarchar(2048)",
            maxLength: 2048,
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "ProfileImagePublicId", table: "AspNetUsers");
        migrationBuilder.DropColumn(name: "ProfileImageUrl", table: "AspNetUsers");
    }
}
