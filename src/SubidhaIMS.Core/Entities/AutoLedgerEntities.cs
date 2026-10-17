using SubidhaIMS.Core.Enums;

namespace SubidhaIMS.Core.Entities;

public class LedgerAccount
{
    public long Id { get; set; }
    public string Code { get; set; } = string.Empty; // e.g., "1010", "4010"
    public string Name { get; set; } = string.Empty; // e.g., "Cash in Hand", "Inventory"
    public AccountCategory Category { get; set; }
    public decimal CurrentBalance { get; set; } = 0m;
}

public class LedgerEntry
{
    public long Id { get; set; }
    public DateTime EntryDate { get; set; }
    public string ReferenceNo { get; set; } = string.Empty; // InvoiceNo or PurchaseNo
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<LedgerLine> Lines { get; set; } = new List<LedgerLine>();
}

public class LedgerLine
{
    public long Id { get; set; }
    public long LedgerEntryId { get; set; }
    public LedgerEntry LedgerEntry { get; set; } = null!;

    public long LedgerAccountId { get; set; }
    public LedgerAccount LedgerAccount { get; set; } = null!;

    public decimal Debit { get; set; } = 0m;
    public decimal Credit { get; set; } = 0m;
}