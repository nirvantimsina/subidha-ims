using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SubidhaIMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCategoryIsActive : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "BusinessSettings",
                keyColumn: "Id",
                keyValue: 1,
                column: "UpdatedAt",
                value: new DateTime(2026, 10, 16, 13, 19, 9, 224, DateTimeKind.Utc).AddTicks(5690));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "BusinessSettings",
                keyColumn: "Id",
                keyValue: 1,
                column: "UpdatedAt",
                value: new DateTime(2026, 10, 16, 9, 2, 43, 509, DateTimeKind.Utc).AddTicks(4498));
        }
    }
}
