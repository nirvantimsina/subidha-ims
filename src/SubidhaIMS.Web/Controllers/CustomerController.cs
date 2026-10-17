using Microsoft.AspNetCore.Mvc;
using SubidhaIMS.Core.DTOs;
using SubidhaIMS.Core.Interfaces;

namespace SubidhaIMS.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CustomersController : ControllerBase
{
    private readonly ISalesService _salesService;

    public CustomersController(ISalesService salesService)
    {
        _salesService = salesService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CustomerDto>>> GetCustomers([FromQuery] string? search)
    {
        var customers = await _salesService.GetCustomersAsync(search);
        return Ok(customers);
    }

    [HttpGet("{id:long}")]
    public async Task<ActionResult<CustomerDto>> GetCustomer(long id)
    {
        var customer = await _salesService.GetCustomerByIdAsync(id);
        if (customer == null) return NotFound();
        return Ok(customer);
    }

    [HttpPost]
    public async Task<ActionResult<CustomerDto>> CreateCustomer([FromBody] CreateCustomerDto dto)
    {
        var result = await _salesService.CreateCustomerAsync(dto);
        return CreatedAtAction(nameof(GetCustomer), new { id = result.Id }, result);
    }
}