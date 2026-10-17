using System.ComponentModel.DataAnnotations;
using SubidhaIMS.Core.Enums;

namespace SubidhaIMS.Core.Entities;

public class Category
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public ICollection<Product> Products { get; set; } = new List<Product>();
}

public class Unit
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Symbol { get; set; } = string.Empty;
    public bool AllowsDecimal { get; set; } = false;
}

public class Product
{
    public long Id { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string? Barcode { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    public long CategoryId { get; set; }
    public Category Category { get; set; } = null!;

    public long UnitId { get; set; }
    public Unit Unit { get; set; } = null!;

    public decimal DefaultPurchaseCost { get; set; }
    public decimal DefaultSellingPrice { get; set; }
    public decimal ReorderLevel { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ProductStock? Stock { get; set; }
    public ICollection<StockMovement> StockMovements { get; set; } = new List<StockMovement>();
}

public class ProductStock
{
    public long ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public decimal QuantityOnHand { get; set; }
    public decimal AverageCost { get; set; }
    public decimal TotalValue { get; set; }

    [Timestamp]
    public uint Version { get; set; } // Npgsql automatically maps uint [Timestamp] to xmin

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class StockMovement
{
    public long Id { get; set; }
    public long ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public DateTime MovementDate { get; set; }
    public StockMovementType MovementType { get; set; }
    public decimal QuantityChange { get; set; } // + for inward, - for outward
    public decimal UnitCost { get; set; }
    public decimal BalanceQuantity { get; set; }
    public decimal BalanceAverageCost { get; set; }
    public string ReferenceNumber { get; set; } = string.Empty;
    public string? Remarks { get; set; }
    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;
}