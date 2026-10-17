using System.ComponentModel.DataAnnotations;
using SubidhaIMS.Core.Enums;

namespace SubidhaIMS.Core.DTOs;

public record CustomerDto(
    long Id,
    string Name,
    string? Phone,
    string? PanNumber,
    string? Address,
    decimal CurrentBalance,
    bool IsActive
);

public record CreateCustomerDto(
    [Required, MaxLength(200)] string Name,
    [MaxLength(30)] string? Phone,
    [MaxLength(20)] string? PanNumber,
    [MaxLength(300)] string? Address
);

public record SaleLineItemDto(
    [Range(1, long.MaxValue, ErrorMessage = "Product is required")] long ProductId,
    [Range(0.001, 1000000, ErrorMessage = "Quantity must be greater than zero")] decimal Quantity,
    [Range(0, 100000000, ErrorMessage = "Unit price cannot be negative")] decimal UnitPrice,
    [Range(0, 100)] decimal TaxRatePercent = 0m
);

public record CreateSaleDto(
    long? CustomerId,
    string? CustomerNameSnapshot,
    string? CustomerPanSnapshot,
    DateTime SaleDate,
    PaymentMethod PaymentMethod,
    [Range(0, 100000000)] decimal DiscountTotal = 0m,
    [Range(0, 100000000)] decimal PaidAmount = 0m,
    string? Notes = null,
    [Required, MinLength(1, ErrorMessage = "At least one item is required to complete a sale")] 
    List<SaleLineItemDto> Lines = null!
);

public record SaleLineDetailDto(
    long Id,
    long ProductId,
    string ProductName,
    string Sku,
    decimal Quantity,
    decimal UnitPrice,
    decimal UnitCostSnapshot,
    decimal TaxRate,
    decimal TaxAmount,
    decimal LineTotal,
    decimal LineProfit
);

public record SaleDetailDto(
    long Id,
    string InvoiceNo,
    long? CustomerId,
    string CustomerName,
    string? CustomerPan,
    DateTime SaleDate,
    string Status,
    string PaymentStatus,
    string PaymentMethod,
    decimal SubTotal,
    decimal DiscountTotal,
    decimal TaxTotal,
    decimal GrandTotal,
    decimal PaidAmount,
    decimal TotalCogs,
    decimal TotalProfit,
    string? Notes,
    DateTime CreatedAt,
    List<SaleLineDetailDto> Lines
);

public record SaleListDto(
    long Id,
    string InvoiceNo,
    string CustomerName,
    DateTime SaleDate,
    string PaymentStatus,
    string PaymentMethod,
    decimal GrandTotal,
    decimal PaidAmount,
    decimal TotalProfit,
    DateTime CreatedAt
);

public record PrintableInvoiceDto(
    string ShopName,
    string? ShopAddress,
    string? ShopPhone,
    string? ShopPan,
    bool IsVatRegistered,
    string InvoiceNo,
    DateTime DateGregorian,
    string CustomerName,
    string? CustomerPhone,
    string? CustomerPan,
    string PaymentMethod,
    string PaymentStatus,
    decimal SubTotal,
    decimal DiscountTotal,
    decimal TaxTotal,
    decimal GrandTotal,
    decimal PaidAmount,
    decimal ChangeAmount,
    List<PrintableInvoiceLineDto> Lines
);

public record PrintableInvoiceLineDto(
    string Sku,
    string Name,
    decimal Quantity,
    decimal UnitPrice,
    decimal TaxAmount,
    decimal LineTotal
);