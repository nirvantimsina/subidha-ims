using SubidhaIMS.Core.DTOs;

namespace SubidhaIMS.Core.Interfaces;

public interface IPurchaseService
{
    // Suppliers
    Task<IEnumerable<SupplierDto>> GetSuppliersAsync(string? search = null);
    Task<SupplierDto?> GetSupplierByIdAsync(long id);
    Task<SupplierDto> CreateSupplierAsync(CreateSupplierDto dto);
    Task<SupplierDto> UpdateSupplierAsync(long id, CreateSupplierDto dto);

    // Purchase Inward & Book
    Task<IEnumerable<PurchaseListDto>> GetPurchasesAsync(DateTime? fromDate = null, DateTime? toDate = null, long? supplierId = null);
    Task<PurchaseDetailDto?> GetPurchaseByIdAsync(long id);
    Task<PurchaseDetailDto> RecordPurchaseAsync(CreatePurchaseDto dto, Guid? userId = null);
}