using System.ComponentModel.DataAnnotations;

namespace SubidhaIMS.Core.DTOs;

public record CategoryDto(long Id, string Name, bool IsActive, int ProductCount);
public record CreateCategoryDto([Required, MaxLength(100)] string Name);
public record UpdateCategoryDto(string Name, bool IsActive);

public record UnitDto(long Id, string Name, string Symbol, bool AllowsDecimal);
public record CreateUnitDto([Required, MaxLength(40)] string Name, [Required, MaxLength(10)] string Symbol, bool AllowsDecimal);

public record ProductListDto(
    long Id,
    string Sku,
    string? Barcode,
    string Name,
    string CategoryName,
    string UnitSymbol,
    decimal DefaultPurchaseCost,
    decimal DefaultSellingPrice,
    decimal QuantityOnHand,
    decimal AverageCost,
    decimal StockValue,
    decimal ReorderLevel,
    bool IsLowStock,
    bool IsActive
);

public record ProductDetailDto(
    long Id,
    string Sku,
    string? Barcode,
    string Name,
    string? Description,
    long CategoryId,
    string CategoryName,
    long UnitId,
    string UnitName,
    string UnitSymbol,
    decimal DefaultPurchaseCost,
    decimal DefaultSellingPrice,
    decimal ReorderLevel,
    decimal QuantityOnHand,
    decimal AverageCost,
    decimal StockValue,
    bool IsActive,
    DateTime CreatedAt
);

public record CreateProductDto(
    [Required, MaxLength(50)] string Sku,
    [MaxLength(50)] string? Barcode,
    [Required, MaxLength(200)] string Name,
    string? Description,
    [Range(1, long.MaxValue, ErrorMessage = "Valid Category is required")] long CategoryId,
    [Range(1, long.MaxValue, ErrorMessage = "Valid Unit is required")] long UnitId,
    [Range(0, 100000000)] decimal DefaultPurchaseCost,
    [Range(0, 100000000)] decimal DefaultSellingPrice,
    [Range(0, 1000000)] decimal ReorderLevel,
    decimal InitialStockQuantity = 0,
    decimal InitialStockUnitCost = 0
);

public record UpdateProductDto(
    [Required, MaxLength(50)] string Sku,
    [MaxLength(50)] string? Barcode,
    [Required, MaxLength(200)] string Name,
    string? Description,
    [Range(1, long.MaxValue)] long CategoryId,
    [Range(1, long.MaxValue)] long UnitId,
    [Range(0, 100000000)] decimal DefaultPurchaseCost,
    [Range(0, 100000000)] decimal DefaultSellingPrice,
    [Range(0, 1000000)] decimal ReorderLevel,
    bool IsActive
);