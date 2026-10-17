using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SubidhaIMS.Core.DTOs;
using SubidhaIMS.Core.Entities;
using SubidhaIMS.Infrastructure.Data;

namespace SubidhaIMS.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CatalogController : ControllerBase
{
    private readonly AppDbContext _db;

    public CatalogController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("categories")]
    public async Task<ActionResult<IEnumerable<object>>> GetCategories([FromQuery] bool includeInactive = true)
    {
        try
        {
            var categories = await _db.Categories
                .AsNoTracking()
                .ToListAsync();

            var productCounts = await _db.Products
                .AsNoTracking()
                .GroupBy(p => p.CategoryId)
                .Select(g => new { CategoryId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.CategoryId, x => x.Count);

            var result = categories
                .Where(c => includeInactive || c.IsActive)
                .OrderBy(c => c.Name)
                .Select(c => new
                {
                    c.Id,
                    c.Name,
                    c.IsActive,
                    ProductCount = productCounts.TryGetValue(c.Id, out var count) ? count : 0
                });

            return Ok(result);
        }
        catch (Exception)
        {
            var fallback = await _db.Categories
                .AsNoTracking()
                .Select(c => new { c.Id, c.Name, IsActive = true, ProductCount = 0 })
                .ToListAsync();

            return Ok(fallback);
        }
    }

    [HttpPost("categories")]
    public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return BadRequest(new { message = "Category name is required." });
        }

        var category = new Category 
        { 
            Name = dto.Name.Trim(),
            IsActive = true 
        };

        _db.Categories.Add(category);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            id = category.Id,
            name = category.Name,
            isActive = category.IsActive,
            productCount = 0
        });
    }

    public record UpdateCategoryRequest(string Name, bool IsActive);

    [HttpPut("categories/{id:long}")]
    public async Task<IActionResult> UpdateCategory(long id, [FromBody] UpdateCategoryRequest dto)
    {
        var category = await _db.Categories.FindAsync(id);
        if (category == null)
        {
            return NotFound(new { message = $"Category #{id} not found." });
        }

        if (!string.IsNullOrWhiteSpace(dto.Name))
        {
            category.Name = dto.Name.Trim();
        }

        category.IsActive = dto.IsActive;

        await _db.SaveChangesAsync();

        return Ok(new 
        { 
            id = category.Id, 
            name = category.Name, 
            isActive = category.IsActive 
        });
    }

    [HttpGet("units")]
    public async Task<ActionResult<IEnumerable<UnitDto>>> GetUnits()
    {
        var units = await _db.Units
            .AsNoTracking()
            .Select(u => new UnitDto(u.Id, u.Name, u.Symbol, u.AllowsDecimal))
            .ToListAsync();
        return Ok(units);
    }

    [HttpPost("units")]
    public async Task<ActionResult<UnitDto>> CreateUnit([FromBody] CreateUnitDto dto)
    {
        var unit = new Unit
        {
            Name = dto.Name.Trim(),
            Symbol = dto.Symbol.Trim(),
            AllowsDecimal = dto.AllowsDecimal
        };
        _db.Units.Add(unit);
        await _db.SaveChangesAsync();
        return Ok(new UnitDto(unit.Id, unit.Name, unit.Symbol, unit.AllowsDecimal));
    }
}