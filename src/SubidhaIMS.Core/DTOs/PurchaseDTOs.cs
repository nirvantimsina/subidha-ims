using System.ComponentModel.DataAnnotations;
using SubidhaIMS.Core.Enums;

namespace SubidhaIMS.Core.DTOs;

public record SupplierDto(
    long Id,
    string Name,
    string? ContactPerson,
    string? Phone,
    string? PanNumber,
    string? Address,
    decimal CurrentBalance,
    bool IsActive
);

public record CreateSupplierDto(
    [Required, MaxLength(200)] string Name,
    [MaxLength(120)] string? ContactPerson,
    [MaxLength(30)] string? Phone,
    [MaxLength(20)] string? PanNumber,
    [MaxLength(300)] string? Address
);

public record PurchaseLineItemDto(
    [Range(1, long.MaxValue, ErrorMessage = "Product is required")] long ProductId,
    [Range(0.001, 1000000, ErrorMessage = "Quantity must be greater than zero")] decimal Quantity,
    [Range(0, 10000000, ErrorMessage = "Unit cost must be non-negative")] decimal UnitCost,
    [Range(0, 100)] decimal TaxRatePercent = 0m
);

public record CreatePurchaseDto(
    [Range(1, long.MaxValue, ErrorMessage = "Supplier is required")] long SupplierId,
    [Required, MaxLength(60)] string SupplierBillNo,
    DateTime PurchaseDate,
    PaymentMethod PaymentMethod,
    [Range(0, 100000000)] decimal DiscountTotal = 0m,
    [Range(0, 100000000)] decimal PaidAmount = 0m,
    string? Notes = null,
    [Required, MinLength(1, ErrorMessage = "At least one item line is required")] 
    List<PurchaseLineItemDto> Lines = null!
);

public record PurchaseLineDetailDto(
    long Id,
    long ProductId,
    string ProductName,
    string Sku,
    string UnitSymbol,
    decimal Quantity,
    decimal UnitCost,
    decimal TaxRate,
    decimal TaxAmount,
    decimal LineTotal
);

public record PurchaseDetailDto(
    long Id,
    string PurchaseNo,
    string SupplierBillNo,
    long SupplierId,
    string SupplierName,
    string? SupplierPan,
    DateTime PurchaseDate,
    string Status,
    string PaymentStatus,
    string PaymentMethod,
    decimal SubTotal,
    decimal DiscountTotal,
    decimal TaxTotal,
    decimal GrandTotal,
    decimal PaidAmount,
    string? Notes,
    DateTime CreatedAt,
    List<PurchaseLineDetailDto> Lines
);

public record PurchaseListDto(
    long Id,
    string PurchaseNo,
    string SupplierBillNo,
    string SupplierName,
    DateTime PurchaseDate,
    string PaymentStatus,
    string PaymentMethod,
    decimal GrandTotal,
    decimal PaidAmount,
    DateTime CreatedAt
);