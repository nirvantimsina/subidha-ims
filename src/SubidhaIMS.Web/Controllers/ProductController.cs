using Microsoft.AspNetCore.Mvc;
using SubidhaIMS.Core.DTOs;
using SubidhaIMS.Core.Interfaces;

namespace SubidhaIMS.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IInventoryService _inventoryService;

    public ProductsController(IInventoryService inventoryService)
    {
        _inventoryService = inventoryService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductListDto>>> GetProducts(
        [FromQuery] string? search,
        [FromQuery] long? categoryId,
        [FromQuery] bool? lowStockOnly)
    {
        var products = await _inventoryService.GetProductsAsync(search, categoryId, lowStockOnly);
        return Ok(products);
    }

    [HttpGet("{id:long}")]
    public async Task<ActionResult<ProductDetailDto>> GetProduct(long id)
    {
        var product = await _inventoryService.GetProductByIdAsync(id);
        if (product == null) return NotFound();
        return Ok(product);
    }

    [HttpPost]
    public async Task<ActionResult<ProductDetailDto>> CreateProduct([FromBody] CreateProductDto dto)
    {
        try
        {
            var result = await _inventoryService.CreateProductAsync(dto);
            return CreatedAtAction(nameof(GetProduct), new { id = result.Id }, result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id:long}")]
    public async Task<ActionResult<ProductDetailDto>> UpdateProduct(long id, [FromBody] UpdateProductDto dto)
    {
        try
        {
            var result = await _inventoryService.UpdateProductAsync(id, dto);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:long}")]
    public async Task<IActionResult> DeleteProduct(long id)
    {
        var success = await _inventoryService.DeleteProductAsync(id);
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpGet("{id:long}/movements")]
    public async Task<ActionResult<IEnumerable<StockMovementDto>>> GetMovements(long id)
    {
        var movements = await _inventoryService.GetProductMovementHistoryAsync(id);
        return Ok(movements);
    }

    [HttpPost("adjust-stock")]
    public async Task<ActionResult<StockMovementDto>> AdjustStock([FromBody] StockAdjustmentRequestDto dto)
    {
        try
        {
            var result = await _inventoryService.RecordManualAdjustmentAsync(dto);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}