using Microsoft.AspNetCore.Mvc;
using SubidhaIMS.Core.DTOs;
using SubidhaIMS.Core.Interfaces;

namespace SubidhaIMS.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SuppliersController : ControllerBase
{
    private readonly IPurchaseService _purchaseService;

    public SuppliersController(IPurchaseService purchaseService)
    {
        _purchaseService = purchaseService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SupplierDto>>> GetSuppliers([FromQuery] string? search)
    {
        var suppliers = await _purchaseService.GetSuppliersAsync(search);
        return Ok(suppliers);
    }

    [HttpGet("{id:long}")]
    public async Task<ActionResult<SupplierDto>> GetSupplier(long id)
    {
        var supplier = await _purchaseService.GetSupplierByIdAsync(id);
        if (supplier == null) return NotFound();
        return Ok(supplier);
    }

    [HttpPost]
    public async Task<ActionResult<SupplierDto>> CreateSupplier([FromBody] CreateSupplierDto dto)
    {
        var result = await _purchaseService.CreateSupplierAsync(dto);
        return CreatedAtAction(nameof(GetSupplier), new { id = result.Id }, result);
    }

    [HttpPut("{id:long}")]
    public async Task<ActionResult<SupplierDto>> UpdateSupplier(long id, [FromBody] CreateSupplierDto dto)
    {
        try
        {
            var result = await _purchaseService.UpdateSupplierAsync(id, dto);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }
}