using System.ComponentModel.DataAnnotations;
using SubidhaIMS.Core.Enums;

namespace SubidhaIMS.Core.DTOs;

public record StockMovementDto(
    long Id,
    long ProductId,
    string ProductName,
    string Sku,
    DateTime MovementDate,
    string MovementType,
    decimal QuantityChange,
    decimal UnitCost,
    decimal BalanceQuantity,
    decimal BalanceAverageCost,
    string ReferenceNumber,
    string? Remarks
);

public record StockAdjustmentRequestDto(
    [Range(1, long.MaxValue)] long ProductId,
    [Required] StockMovementType MovementType,
    [Range(0.001, 1000000)] decimal Quantity,
    [Range(0, 10000000)] decimal UnitCost,
    [Required, MaxLength(300)] string Reason
);