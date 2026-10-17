using Microsoft.AspNetCore.Mvc;
using SubidhaIMS.Core.DTOs;
using SubidhaIMS.Core.Interfaces;

namespace SubidhaIMS.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SalesController : ControllerBase
{
    private readonly ISalesService _salesService;

    public SalesController(ISalesService salesService)
    {
        _salesService = salesService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SaleListDto>>> GetSales(
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] long? customerId)
    {
        var list = await _salesService.GetSalesAsync(fromDate, toDate, customerId);
        return Ok(list);
    }

    [HttpGet("{id:long}")]
    public async Task<ActionResult<SaleDetailDto>> GetSale(long id)
    {
        var sale = await _salesService.GetSaleByIdAsync(id);
        if (sale == null) return NotFound();
        return Ok(sale);
    }

    [HttpPost]
    public async Task<ActionResult<SaleDetailDto>> RecordSale([FromBody] CreateSaleDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
            return BadRequest(new { message = errors });
        }

        try
        {
            var result = await _salesService.RecordSaleAsync(dto, null);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("{id:long}/invoice")]
    public async Task<ActionResult<PrintableInvoiceDto>> GetPrintableInvoice(long id)
    {
        var invoice = await _salesService.GetPrintableInvoiceAsync(id);
        if (invoice == null) return NotFound();
        return Ok(invoice);
    }
}