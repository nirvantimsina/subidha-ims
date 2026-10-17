using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SubidhaIMS.Core.DTOs;
using SubidhaIMS.Infrastructure.Data;

namespace SubidhaIMS.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SettingsController : ControllerBase
{
    private readonly AppDbContext _db;

    public SettingsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("business")]
    public async Task<ActionResult<BusinessSettingsDto>> GetBusinessSettings()
    {
        var s = await _db.BusinessSettings.FirstOrDefaultAsync(x => x.Id == 1);
        if (s == null) return NotFound();

        return Ok(new BusinessSettingsDto(
            s.Id,
            s.BusinessName,
            s.Address,
            s.Phone,
            s.Email,
            s.PanNumber,
            s.IsVatRegistered,
            s.DefaultVatRate,
            s.CurrencyCode,
            s.InvoicePrefix,
            s.PurchasePrefix
        ));
    }

    [HttpPut("business")]
    public async Task<ActionResult<BusinessSettingsDto>> UpdateBusinessSettings([FromBody] UpdateBusinessSettingsDto dto)
    {
        var s = await _db.BusinessSettings.FirstOrDefaultAsync(x => x.Id == 1);
        if (s == null) return NotFound();

        s.BusinessName = dto.BusinessName.Trim();
        s.Address = dto.Address?.Trim();
        s.Phone = dto.Phone?.Trim();
        s.Email = dto.Email?.Trim();
        s.PanNumber = dto.PanNumber?.Trim();
        s.IsVatRegistered = dto.IsVatRegistered;
        s.DefaultVatRate = dto.DefaultVatRate;
        s.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new BusinessSettingsDto(
            s.Id,
            s.BusinessName,
            s.Address,
            s.Phone,
            s.Email,
            s.PanNumber,
            s.IsVatRegistered,
            s.DefaultVatRate,
            s.CurrencyCode,
            s.InvoicePrefix,
            s.PurchasePrefix
        ));
    }
}