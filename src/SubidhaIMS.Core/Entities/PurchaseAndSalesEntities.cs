using SubidhaIMS.Core.Enums;

namespace SubidhaIMS.Core.Entities;

public class Supplier
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ContactPerson { get; set; }
    public string? Phone { get; set; }
    public string? PanNumber { get; set; }
    public string? Address { get; set; }
    public decimal CurrentBalance { get; set; } = 0m;
    public bool IsActive { get; set; } = true;
}

public class Customer
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? PanNumber { get; set; }
    public string? Address { get; set; }
    public decimal CurrentBalance { get; set; } = 0m;
    public bool IsActive { get; set; } = true;
}

public class Purchase
{
    public long Id { get; set; }
    public string PurchaseNo { get; set; } = string.Empty;
    public string SupplierBillNo { get; set; } = string.Empty;
    public long SupplierId { get; set; }
    public Supplier Supplier { get; set; } = null!;

    public DateTime PurchaseDate { get; set; }
    public DocStatus Status { get; set; } = DocStatus.Draft;
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Unpaid;
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.Credit;

    public decimal SubTotal { get; set; }
    public decimal DiscountTotal { get; set; }
    public decimal TaxTotal { get; set; }
    public decimal GrandTotal { get; set; }
    public decimal PaidAmount { get; set; }

    public string? Notes { get; set; }
    public Guid CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? PostedAt { get; set; }

    public ICollection<PurchaseLine> Lines { get; set; } = new List<PurchaseLine>();
}

public class PurchaseLine
{
    public long Id { get; set; }
    public long PurchaseId { get; set; }
    public Purchase Purchase { get; set; } = null!;

    public long ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public decimal Quantity { get; set; }
    public decimal UnitCost { get; set; }
    public decimal TaxRate { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal LineTotal { get; set; }
}

public class Sale
{
    public long Id { get; set; }
    public string InvoiceNo { get; set; } = string.Empty;
    public long? CustomerId { get; set; }
    public Customer? Customer { get; set; }

    public string CustomerNameSnapshot { get; set; } = "Walk-in Customer";
    public string? CustomerPanSnapshot { get; set; }
    public DateTime SaleDate { get; set; }

    public DocStatus Status { get; set; } = DocStatus.Draft;
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Paid;
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.Cash;

    public decimal SubTotal { get; set; }
    public decimal DiscountTotal { get; set; }
    public decimal TaxTotal { get; set; }
    public decimal GrandTotal { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal TotalCogs { get; set; } // Sum of cost of goods sold at time of sale
    public decimal TotalProfit { get; set; } // (GrandTotal - TaxTotal) - TotalCogs

    public string? Notes { get; set; }
    public Guid CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? PostedAt { get; set; }

    public ICollection<SaleLine> Lines { get; set; } = new List<SaleLine>();
}

public class SaleLine
{
    public long Id { get; set; }
    public long SaleId { get; set; }
    public Sale Sale { get; set; } = null!;

    public long ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public string ProductNameSnapshot { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal UnitCostSnapshot { get; set; } // Captured from ProductStock.AverageCost at posting time
    public decimal TaxRate { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal LineTotal { get; set; }
    public decimal LineProfit { get; set; } // (LineTotal - TaxAmount) - (Quantity * UnitCostSnapshot)
}