using Microsoft.AspNetCore.Mvc;
using SubidhaIMS.Core.DTOs;
using SubidhaIMS.Core.Interfaces;

namespace SubidhaIMS.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PurchasesController : ControllerBase
{
    private readonly IPurchaseService _purchaseService;

    public PurchasesController(IPurchaseService purchaseService)
    {
        _purchaseService = purchaseService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PurchaseListDto>>> GetPurchases(
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] long? supplierId)
    {
        var list = await _purchaseService.GetPurchasesAsync(fromDate, toDate, supplierId);
        return Ok(list);
    }

    [HttpGet("{id:long}")]
    public async Task<ActionResult<PurchaseDetailDto>> GetPurchase(long id)
    {
        var purchase = await _purchaseService.GetPurchaseByIdAsync(id);
        if (purchase == null) return NotFound();
        return Ok(purchase);
    }

    [HttpPost]
    public async Task<ActionResult<PurchaseDetailDto>> RecordPurchase([FromBody] CreatePurchaseDto dto)
    {
        try
        {
            var result = await _purchaseService.RecordPurchaseAsync(dto);
            return CreatedAtAction(nameof(GetPurchase), new { id = result.Id }, result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}