using SubidhaIMS.Core.DTOs;
using SubidhaIMS.Core.Enums;

namespace SubidhaIMS.Core.Interfaces;

public interface IInventoryService
{
    Task<IEnumerable<ProductListDto>> GetProductsAsync(string? search = null, long? categoryId = null, bool? lowStockOnly = null);
    Task<ProductDetailDto?> GetProductByIdAsync(long id);
    Task<ProductDetailDto> CreateProductAsync(CreateProductDto dto, Guid? userId = null);
    Task<ProductDetailDto> UpdateProductAsync(long id, UpdateProductDto dto, Guid? userId = null);
    Task<bool> DeleteProductAsync(long id, Guid? userId = null);

    Task RecordStockMovementAsync(
        long productId,
        StockMovementType movementType,
        decimal quantityChange,
        decimal unitCost,
        string referenceNumber,
        string? remarks = null,
        DateTime? movementDate = null,
        CancellationToken cancellationToken = default);

    Task<IEnumerable<StockMovementDto>> GetProductMovementHistoryAsync(long productId);
    Task<StockMovementDto> RecordManualAdjustmentAsync(StockAdjustmentRequestDto dto, Guid? userId = null);
}