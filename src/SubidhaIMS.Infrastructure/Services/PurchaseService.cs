using Microsoft.EntityFrameworkCore;
using SubidhaIMS.Core.DTOs;
using SubidhaIMS.Core.Entities;
using SubidhaIMS.Core.Enums;
using SubidhaIMS.Core.Interfaces;
using SubidhaIMS.Infrastructure.Data;

namespace SubidhaIMS.Infrastructure.Services;

public class PurchaseService : IPurchaseService
{
    private readonly AppDbContext _db;
    private readonly IInventoryService _inventoryService;

    public PurchaseService(AppDbContext db, IInventoryService inventoryService)
    {
        _db = db;
        _inventoryService = inventoryService;
    }

    #region Supplier Management

    public async Task<IEnumerable<SupplierDto>> GetSuppliersAsync(string? search = null)
    {
        var query = _db.Suppliers.AsNoTracking().Where(s => s.IsActive);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(x => x.Name.ToLower().Contains(s) || 
                                     (x.PanNumber != null && x.PanNumber.Contains(s)) ||
                                     (x.Phone != null && x.Phone.Contains(s)));
        }

        return await query
            .OrderBy(s => s.Name)
            .Select(s => new SupplierDto(
                s.Id, s.Name, s.ContactPerson, s.Phone, s.PanNumber, s.Address, s.CurrentBalance, s.IsActive
            ))
            .ToListAsync();
    }

    public async Task<SupplierDto?> GetSupplierByIdAsync(long id)
    {
        var s = await _db.Suppliers.FindAsync(id);
        if (s == null) return null;
        return new SupplierDto(s.Id, s.Name, s.ContactPerson, s.Phone, s.PanNumber, s.Address, s.CurrentBalance, s.IsActive);
    }

    public async Task<SupplierDto> CreateSupplierAsync(CreateSupplierDto dto)
    {
        var supplier = new Supplier
        {
            Name = dto.Name.Trim(),
            ContactPerson = dto.ContactPerson?.Trim(),
            Phone = dto.Phone?.Trim(),
            PanNumber = dto.PanNumber?.Trim(),
            Address = dto.Address?.Trim(),
            CurrentBalance = 0m,
            IsActive = true
        };

        _db.Suppliers.Add(supplier);
        await _db.SaveChangesAsync();

        return new SupplierDto(supplier.Id, supplier.Name, supplier.ContactPerson, supplier.Phone, supplier.PanNumber, supplier.Address, 0m, true);
    }

    public async Task<SupplierDto> UpdateSupplierAsync(long id, CreateSupplierDto dto)
    {
        var s = await _db.Suppliers.FindAsync(id)
            ?? throw new KeyNotFoundException($"Supplier #{id} not found.");

        s.Name = dto.Name.Trim();
        s.ContactPerson = dto.ContactPerson?.Trim();
        s.Phone = dto.Phone?.Trim();
        s.PanNumber = dto.PanNumber?.Trim();
        s.Address = dto.Address?.Trim();

        await _db.SaveChangesAsync();
        return new SupplierDto(s.Id, s.Name, s.ContactPerson, s.Phone, s.PanNumber, s.Address, s.CurrentBalance, s.IsActive);
    }

    #endregion

    #region Purchase Book & Pipeline

    public async Task<IEnumerable<PurchaseListDto>> GetPurchasesAsync(DateTime? fromDate = null, DateTime? toDate = null, long? supplierId = null)
    {
        var query = _db.Purchases
            .AsNoTracking()
            .Include(p => p.Supplier)
            .AsQueryable();

        if (fromDate.HasValue) query = query.Where(p => p.PurchaseDate >= fromDate.Value.Date);
        if (toDate.HasValue) query = query.Where(p => p.PurchaseDate <= toDate.Value.Date);
        if (supplierId.HasValue && supplierId.Value > 0) query = query.Where(p => p.SupplierId == supplierId.Value);

        return await query
            .OrderByDescending(p => p.PurchaseDate)
            .ThenByDescending(p => p.Id)
            .Select(p => new PurchaseListDto(
                p.Id,
                p.PurchaseNo,
                p.SupplierBillNo,
                p.Supplier.Name,
                p.PurchaseDate,
                p.PaymentStatus.ToString(),
                p.PaymentMethod.ToString(),
                p.GrandTotal,
                p.PaidAmount,
                p.CreatedAt
            ))
            .ToListAsync();
    }

    public async Task<PurchaseDetailDto?> GetPurchaseByIdAsync(long id)
    {
        var p = await _db.Purchases
            .AsNoTracking()
            .Include(x => x.Supplier)
            .Include(x => x.Lines)
                .ThenInclude(l => l.Product)
                    .ThenInclude(pr => pr.Unit)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (p == null) return null;

        return new PurchaseDetailDto(
            p.Id,
            p.PurchaseNo,
            p.SupplierBillNo,
            p.SupplierId,
            p.Supplier.Name,
            p.Supplier.PanNumber,
            p.PurchaseDate,
            p.Status.ToString(),
            p.PaymentStatus.ToString(),
            p.PaymentMethod.ToString(),
            p.SubTotal,
            p.DiscountTotal,
            p.TaxTotal,
            p.GrandTotal,
            p.PaidAmount,
            p.Notes,
            p.CreatedAt,
            p.Lines.Select(l => new PurchaseLineDetailDto(
                l.Id,
                l.ProductId,
                l.Product.Name,
                l.Product.Sku,
                l.Product.Unit.Symbol,
                l.Quantity,
                l.UnitCost,
                l.TaxRate,
                l.TaxAmount,
                l.LineTotal
            )).ToList()
        );
    }

    public async Task<PurchaseDetailDto> RecordPurchaseAsync(CreatePurchaseDto dto, Guid? userId = null)
    {
        if (dto.Lines == null || dto.Lines.Count == 0)
            throw new InvalidOperationException("Cannot record a purchase without line items.");

        var supplier = await _db.Suppliers.FindAsync(dto.SupplierId)
            ?? throw new KeyNotFoundException($"Supplier #{dto.SupplierId} not found.");

        // Duplicate bill number check for this supplier
        if (await _db.Purchases.AnyAsync(p => p.SupplierId == dto.SupplierId && 
                                              p.SupplierBillNo.ToLower() == dto.SupplierBillNo.Trim().ToLower()))
        {
            throw new InvalidOperationException($"Supplier Bill No '{dto.SupplierBillNo}' has already been recorded for this supplier.");
        }

        using var transaction = await _db.Database.BeginTransactionAsync();

        // 1. Generate sequential purchase number (PUR-00001)
        var count = await _db.Purchases.CountAsync() + 1;
        var purchaseNo = $"PUR-{count:D5}";

        // 2. Calculate Line Totals
        decimal subTotal = 0m;
        decimal taxTotal = 0m;
        var purchaseLines = new List<PurchaseLine>();

        foreach (var item in dto.Lines)
        {
            var product = await _db.Products.FindAsync(item.ProductId)
                ?? throw new KeyNotFoundException($"Product #{item.ProductId} not found.");

            var lineCost = item.Quantity * item.UnitCost;
            var lineTax = Math.Round(lineCost * (item.TaxRatePercent / 100m), 2);
            var lineTotal = lineCost + lineTax;

            subTotal += lineCost;
            taxTotal += lineTax;

            purchaseLines.Add(new PurchaseLine
            {
                ProductId = item.ProductId,
                Quantity = item.Quantity,
                UnitCost = item.UnitCost,
                TaxRate = item.TaxRatePercent,
                TaxAmount = lineTax,
                LineTotal = lineTotal
            });
        }

        var grandTotal = (subTotal - dto.DiscountTotal) + taxTotal;
        if (grandTotal < 0) grandTotal = 0;

        var paidAmount = dto.PaidAmount > grandTotal ? grandTotal : dto.PaidAmount;
        var paymentStatus = paidAmount >= grandTotal ? PaymentStatus.Paid :
                            paidAmount > 0 ? PaymentStatus.Partial : PaymentStatus.Unpaid;

        // 3. Persist Purchase Header and Lines
        var purchase = new Purchase
        {
            PurchaseNo = purchaseNo,
            SupplierBillNo = dto.SupplierBillNo.Trim(),
            SupplierId = dto.SupplierId,
            PurchaseDate = dto.PurchaseDate.Date,
            Status = DocStatus.Posted,
            PaymentStatus = paymentStatus,
            PaymentMethod = dto.PaymentMethod,
            SubTotal = subTotal,
            DiscountTotal = dto.DiscountTotal,
            TaxTotal = taxTotal,
            GrandTotal = grandTotal,
            PaidAmount = paidAmount,
            Notes = dto.Notes?.Trim(),
            CreatedBy = userId ?? Guid.Empty,
            CreatedAt = DateTime.UtcNow,
            PostedAt = DateTime.UtcNow,
            Lines = purchaseLines
        };

        _db.Purchases.Add(purchase);
        await _db.SaveChangesAsync();

        // 4. Update Stock & Perpetual Moving Weighted Average for each item
        foreach (var line in purchaseLines)
        {
            await _inventoryService.RecordStockMovementAsync(
                productId: line.ProductId,
                movementType: StockMovementType.Purchase,
                quantityChange: line.Quantity,
                unitCost: line.UnitCost,
                referenceNumber: purchase.PurchaseNo,
                remarks: $"Supplier Bill: {purchase.SupplierBillNo}",
                movementDate: purchase.PurchaseDate
            );
        }

        // 5. Update Supplier Balance (if credit / partial)
        var unpaidAmount = grandTotal - paidAmount;
        if (unpaidAmount > 0)
        {
            supplier.CurrentBalance += unpaidAmount; // Shop owes supplier (credit balance)
        }

        // 6. AUTO-LEDGER POSTING (Balanced Double-Entry)
        // Accounts: 1010 (Cash), 1020 (Bank/Fonepay), 1040 (Inventory), 2010 (Accounts Payable)
        var ledgerEntry = new LedgerEntry
        {
            EntryDate = purchase.PurchaseDate,
            ReferenceNo = purchase.PurchaseNo,
            Description = $"Purchase from {supplier.Name} (Bill: {purchase.SupplierBillNo})"
        };

        // Debit: Inventory (Assets increase)
        var inventoryAccount = await _db.LedgerAccounts.FirstAsync(a => a.Code == "1040");
        ledgerEntry.Lines.Add(new LedgerLine
        {
            LedgerAccountId = inventoryAccount.Id,
            Debit = grandTotal,
            Credit = 0m
        });
        inventoryAccount.CurrentBalance += grandTotal;

        // Credit: Cash/Bank if paid
        if (paidAmount > 0)
        {
            var cashBankCode = (dto.PaymentMethod == PaymentMethod.BankTransfer || dto.PaymentMethod == PaymentMethod.FonepayQr) ? "1020" : "1010";
            var paymentAccount = await _db.LedgerAccounts.FirstAsync(a => a.Code == cashBankCode);
            ledgerEntry.Lines.Add(new LedgerLine
            {
                LedgerAccountId = paymentAccount.Id,
                Debit = 0m,
                Credit = paidAmount
            });
            paymentAccount.CurrentBalance -= paidAmount;
        }

        // Credit: Accounts Payable for remaining balance
        if (unpaidAmount > 0)
        {
            var apAccount = await _db.LedgerAccounts.FirstAsync(a => a.Code == "2010");
            ledgerEntry.Lines.Add(new LedgerLine
            {
                LedgerAccountId = apAccount.Id,
                Debit = 0m,
                Credit = unpaidAmount
            });
            apAccount.CurrentBalance += unpaidAmount;
        }

        _db.LedgerEntries.Add(ledgerEntry);

        // 7. Audit Log
        _db.AuditLogs.Add(new AuditLog
        {
            UserId = userId,
            EntityName = nameof(Purchase),
            EntityId = purchase.Id.ToString(),
            Action = "Post",
            Details = $"Recorded purchase {purchase.PurchaseNo} (NPR {purchase.GrandTotal}) from {supplier.Name}"
        });

        await _db.SaveChangesAsync();
        await transaction.CommitAsync();

        return (await GetPurchaseByIdAsync(purchase.Id))!;
    }

    #endregion
}