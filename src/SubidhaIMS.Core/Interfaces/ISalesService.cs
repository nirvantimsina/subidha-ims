using SubidhaIMS.Core.DTOs;

namespace SubidhaIMS.Core.Interfaces;

public interface ISalesService
{
    // Customer Directory
    Task<IEnumerable<CustomerDto>> GetCustomersAsync(string? search = null);
    Task<CustomerDto?> GetCustomerByIdAsync(long id);
    Task<CustomerDto> CreateCustomerAsync(CreateCustomerDto dto);

    // Sales Book & POS Execution
    Task<IEnumerable<SaleListDto>> GetSalesAsync(DateTime? fromDate = null, DateTime? toDate = null, long? customerId = null);
    Task<SaleDetailDto?> GetSaleByIdAsync(long id);
    Task<SaleDetailDto> RecordSaleAsync(CreateSaleDto dto, Guid? userId = null);

    // Invoice Printing
    Task<PrintableInvoiceDto?> GetPrintableInvoiceAsync(long id);
}