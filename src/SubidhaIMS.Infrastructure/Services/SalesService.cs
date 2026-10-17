using Microsoft.EntityFrameworkCore;
using SubidhaIMS.Core.DTOs;
using SubidhaIMS.Core.Entities;
using SubidhaIMS.Core.Enums;
using SubidhaIMS.Core.Interfaces;
using SubidhaIMS.Infrastructure.Data;

namespace SubidhaIMS.Infrastructure.Services;

public class SalesService : ISalesService
{
    private readonly AppDbContext _db;
    private readonly IInventoryService _inventoryService;

    public SalesService(AppDbContext db, IInventoryService inventoryService)
    {
        _db = db;
        _inventoryService = inventoryService;
    }

    #region Customer Directory

    public async Task<IEnumerable<CustomerDto>> GetCustomersAsync(string? search = null)
    {
        var query = _db.Customers.AsNoTracking().Where(c => c.IsActive);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(x => x.Name.ToLower().Contains(s) || 
                                     (x.Phone != null && x.Phone.Contains(s)) ||
                                     (x.PanNumber != null && x.PanNumber.Contains(s)));
        }

        return await query
            .OrderBy(c => c.Name)
            .Select(c => new CustomerDto(c.Id, c.Name, c.Phone, c.PanNumber, c.Address, c.CurrentBalance, c.IsActive))
            .ToListAsync();
    }

    public async Task<CustomerDto?> GetCustomerByIdAsync(long id)
    {
        var c = await _db.Customers.FindAsync(id);
        if (c == null) return null;
        return new CustomerDto(c.Id, c.Name, c.Phone, c.PanNumber, c.Address, c.CurrentBalance, c.IsActive);
    }

    public async Task<CustomerDto> CreateCustomerAsync(CreateCustomerDto dto)
    {
        var customer = new Customer
        {
            Name = dto.Name.Trim(),
            Phone = dto.Phone?.Trim(),
            PanNumber = dto.PanNumber?.Trim(),
            Address = dto.Address?.Trim(),
            CurrentBalance = 0m,
            IsActive = true
        };

        _db.Customers.Add(customer);
        await _db.SaveChangesAsync();

        return new CustomerDto(customer.Id, customer.Name, customer.Phone, customer.PanNumber, customer.Address, 0m, true);
    }

    #endregion

    #region Sales Book & POS Pipeline

    public async Task<IEnumerable<SaleListDto>> GetSalesAsync(DateTime? fromDate = null, DateTime? toDate = null, long? customerId = null)
    {
        var query = _db.Sales
            .AsNoTracking()
            .Include(s => s.Customer)
            .AsQueryable();

        // Safe UTC Conversion for Npgsql Timestamptz
        if (fromDate.HasValue)
        {
            var fromUtc = DateTime.SpecifyKind(fromDate.Value.Date, DateTimeKind.Utc);
            query = query.Where(s => s.SaleDate >= fromUtc);
        }

        if (toDate.HasValue)
        {
            var toUtc = DateTime.SpecifyKind(toDate.Value.Date.AddDays(1), DateTimeKind.Utc);
            query = query.Where(s => s.SaleDate < toUtc);
        }

        if (customerId.HasValue && customerId.Value > 0)
        {
            query = query.Where(s => s.CustomerId == customerId.Value);
        }

        return await query
            .OrderByDescending(s => s.SaleDate)
            .ThenByDescending(s => s.Id)
            .Select(s => new SaleListDto(
                s.Id,
                s.InvoiceNo,
                s.Customer != null ? s.Customer.Name : s.CustomerNameSnapshot,
                s.SaleDate,
                s.PaymentStatus.ToString(),
                s.PaymentMethod.ToString(),
                s.GrandTotal,
                s.PaidAmount,
                s.TotalProfit,
                s.CreatedAt
            ))
            .ToListAsync();
    }

    public async Task<SaleDetailDto?> GetSaleByIdAsync(long id)
    {
        var s = await _db.Sales
            .AsNoTracking()
            .Include(x => x.Customer)
            .Include(x => x.Lines)
                .ThenInclude(l => l.Product)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (s == null) return null;

        return new SaleDetailDto(
            s.Id,
            s.InvoiceNo,
            s.CustomerId,
            s.Customer?.Name ?? s.CustomerNameSnapshot,
            s.Customer?.PanNumber ?? s.CustomerPanSnapshot,
            s.SaleDate,
            s.Status.ToString(),
            s.PaymentStatus.ToString(),
            s.PaymentMethod.ToString(),
            s.SubTotal,
            s.DiscountTotal,
            s.TaxTotal,
            s.GrandTotal,
            s.PaidAmount,
            s.TotalCogs,
            s.TotalProfit,
            s.Notes,
            s.CreatedAt,
            s.Lines.Select(l => new SaleLineDetailDto(
                l.Id,
                l.ProductId,
                l.ProductNameSnapshot,
                l.Product.Sku,
                l.Quantity,
                l.UnitPrice,
                l.UnitCostSnapshot,
                l.TaxRate,
                l.TaxAmount,
                l.LineTotal,
                l.LineProfit
            )).ToList()
        );
    }

    public async Task<SaleDetailDto> RecordSaleAsync(CreateSaleDto dto, Guid? userId = null)
    {
        if (dto.Lines == null || dto.Lines.Count == 0)
            throw new InvalidOperationException("Cannot record a sale without items.");

        Customer? customer = null;
        if (dto.CustomerId.HasValue && dto.CustomerId.Value > 0)
        {
            customer = await _db.Customers.FindAsync(dto.CustomerId.Value)
                ?? throw new KeyNotFoundException($"Customer #{dto.CustomerId.Value} not found.");
        }

        using var transaction = await _db.Database.BeginTransactionAsync();

        // 1. Generate sequential bill number (INV-00001)
        var count = await _db.Sales.CountAsync() + 1;
        var invoiceNo = $"INV-{count:D5}";

        decimal subTotal = 0m;
        decimal taxTotal = 0m;
        decimal totalCogs = 0m;
        var saleLines = new List<SaleLine>();

        // 2. Process Lines with Custom Selling Price Priority
        foreach (var item in dto.Lines)
        {
            var product = await _db.Products
                .Include(p => p.Stock)
                .FirstOrDefaultAsync(p => p.Id == item.ProductId)
                ?? throw new KeyNotFoundException($"Product #{item.ProductId} not found.");

            var currentStock = product.Stock?.QuantityOnHand ?? 0m;
            if (currentStock < item.Quantity)
            {
                throw new InvalidOperationException(
                    $"Insufficient stock for '{product.Name}'. Available: {currentStock}, Requested: {item.Quantity}");
            }

            // CRITICAL: Take the custom unit price entered by counter staff.
            // Only fallback to default price if item.UnitPrice was completely 0.
            var effectiveUnitPrice = item.UnitPrice > 0 ? item.UnitPrice : product.DefaultSellingPrice;

            var unitCost = product.Stock?.AverageCost ?? product.DefaultPurchaseCost;
            var lineRevenue = item.Quantity * effectiveUnitPrice;
            var lineTax = Math.Round(lineRevenue * (item.TaxRatePercent / 100m), 2);
            var lineTotal = lineRevenue + lineTax;
            var lineCogs = Math.Round(item.Quantity * unitCost, 2);
            var lineProfit = lineRevenue - lineCogs;

            subTotal += lineRevenue;
            taxTotal += lineTax;
            totalCogs += lineCogs;

            saleLines.Add(new SaleLine
            {
                ProductId = item.ProductId,
                ProductNameSnapshot = product.Name,
                Quantity = item.Quantity,
                UnitPrice = effectiveUnitPrice, // Saves custom price into immutable line
                UnitCostSnapshot = unitCost,
                TaxRate = item.TaxRatePercent,
                TaxAmount = lineTax,
                LineTotal = lineTotal,
                LineProfit = lineProfit
            });
        }

        var grandTotal = (subTotal - dto.DiscountTotal) + taxTotal;
        if (grandTotal < 0) grandTotal = 0;

        // Counter sales are always paid in full immediately
        var paidAmount = grandTotal;
        var paymentStatus = PaymentStatus.Paid;
        var totalProfit = (grandTotal - taxTotal) - totalCogs;

        // Ensure SaleDate is strictly UTC for Npgsql
        var saleDateUtc = DateTime.SpecifyKind(dto.SaleDate == default ? DateTime.UtcNow : dto.SaleDate, DateTimeKind.Utc);

        // 3. Persist Sale Header and Lines
        var sale = new Sale
        {
            InvoiceNo = invoiceNo,
            CustomerId = customer?.Id,
            CustomerNameSnapshot = customer?.Name ?? (!string.IsNullOrWhiteSpace(dto.CustomerNameSnapshot) ? dto.CustomerNameSnapshot : "Walk-in Customer"),
            CustomerPanSnapshot = customer?.PanNumber ?? dto.CustomerPanSnapshot,
            SaleDate = saleDateUtc,
            Status = DocStatus.Posted,
            PaymentStatus = paymentStatus,
            PaymentMethod = dto.PaymentMethod,
            SubTotal = subTotal,
            DiscountTotal = dto.DiscountTotal,
            TaxTotal = taxTotal,
            GrandTotal = grandTotal,
            PaidAmount = paidAmount,
            TotalCogs = totalCogs,
            TotalProfit = totalProfit,
            Notes = dto.Notes?.Trim(),
            CreatedBy = userId ?? Guid.Empty,
            CreatedAt = DateTime.UtcNow,
            PostedAt = DateTime.UtcNow,
            Lines = saleLines
        };

        _db.Sales.Add(sale);
        await _db.SaveChangesAsync();

        // 4. Deduct inventory and append to Stock Movements ledger (-Qty)
        foreach (var line in saleLines)
        {
            await _inventoryService.RecordStockMovementAsync(
                productId: line.ProductId,
                movementType: StockMovementType.Sale,
                quantityChange: -line.Quantity,
                unitCost: line.UnitCostSnapshot,
                referenceNumber: sale.InvoiceNo,
                remarks: $"Bill to: {sale.CustomerNameSnapshot}",
                movementDate: sale.SaleDate
            );
        }

        // 6. Balanced Double-Entry Ledger Posting
        var ledgerEntry = new LedgerEntry
        {
            EntryDate = sale.SaleDate,
            ReferenceNo = sale.InvoiceNo,
            Description = $"Sale Bill #{sale.InvoiceNo} - {sale.CustomerNameSnapshot}"
        };

        // --- Leg 1: Immediate Settlement (Cash or Bank/QR) ---
        var cashBankCode = (dto.PaymentMethod == PaymentMethod.BankTransfer || dto.PaymentMethod == PaymentMethod.FonepayQr) ? "1020" : "1010";
        var payAccount = await _db.LedgerAccounts.FirstAsync(a => a.Code == cashBankCode);
        ledgerEntry.Lines.Add(new LedgerLine
        {
            LedgerAccountId = payAccount.Id,
            Debit = grandTotal,
            Credit = 0m
        });
        payAccount.CurrentBalance += grandTotal;

        // Credit: Sales Revenue (excl. Tax)
        var revenueAmount = grandTotal - taxTotal;
        var revAccount = await _db.LedgerAccounts.FirstAsync(a => a.Code == "4010");
        ledgerEntry.Lines.Add(new LedgerLine
        {
            LedgerAccountId = revAccount.Id,
            Debit = 0m,
            Credit = revenueAmount
        });
        revAccount.CurrentBalance += revenueAmount;

        // Credit: VAT Payable (if tax exists)
        if (taxTotal > 0)
        {
            var vatAccount = await _db.LedgerAccounts.FirstAsync(a => a.Code == "2020");
            ledgerEntry.Lines.Add(new LedgerLine
            {
                LedgerAccountId = vatAccount.Id,
                Debit = 0m,
                Credit = taxTotal
            });
            vatAccount.CurrentBalance += taxTotal;
        }

        // --- Leg 2: Inventory & COGS ---
        if (totalCogs > 0)
        {
            // Debit: COGS
            var cogsAccount = await _db.LedgerAccounts.FirstAsync(a => a.Code == "5010");
            ledgerEntry.Lines.Add(new LedgerLine
            {
                LedgerAccountId = cogsAccount.Id,
                Debit = totalCogs,
                Credit = 0m
            });
            cogsAccount.CurrentBalance += totalCogs;

            // Credit: Inventory Asset
            var invAccount = await _db.LedgerAccounts.FirstAsync(a => a.Code == "1040");
            ledgerEntry.Lines.Add(new LedgerLine
            {
                LedgerAccountId = invAccount.Id,
                Debit = 0m,
                Credit = totalCogs
            });
            invAccount.CurrentBalance -= totalCogs;
        }

        _db.LedgerEntries.Add(ledgerEntry);

        // 7. Audit Logging
        _db.AuditLogs.Add(new AuditLog
        {
            UserId = userId,
            EntityName = nameof(Sale),
            EntityId = sale.Id.ToString(),
            Action = "Post",
            Details = $"Finalized sale {sale.InvoiceNo} total NPR {sale.GrandTotal} (Profit: NPR {sale.TotalProfit})"
        });

        await _db.SaveChangesAsync();
        await transaction.CommitAsync();

        return (await GetSaleByIdAsync(sale.Id))!;
    }

    private static decimal taxTaxTotalSafe(decimal tax) => tax;

    public async Task<PrintableInvoiceDto?> GetPrintableInvoiceAsync(long id)
    {
        var sale = await _db.Sales
            .AsNoTracking()
            .Include(s => s.Customer)
            .Include(s => s.Lines)
                .ThenInclude(l => l.Product)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (sale == null) return null;

        var settings = await _db.BusinessSettings.FirstAsync();

        return new PrintableInvoiceDto(
            ShopName: settings.BusinessName,
            ShopAddress: settings.Address,
            ShopPhone: settings.Phone,
            ShopPan: settings.PanNumber,
            IsVatRegistered: settings.IsVatRegistered,
            InvoiceNo: sale.InvoiceNo,
            DateGregorian: sale.SaleDate,
            CustomerName: sale.Customer?.Name ?? sale.CustomerNameSnapshot,
            CustomerPhone: sale.Customer?.Phone,
            CustomerPan: sale.Customer?.PanNumber ?? sale.CustomerPanSnapshot,
            PaymentMethod: sale.PaymentMethod == PaymentMethod.FonepayQr ? "QR" : sale.PaymentMethod.ToString(),
            PaymentStatus: sale.PaymentStatus.ToString(),
            SubTotal: sale.SubTotal,
            DiscountTotal: sale.DiscountTotal,
            TaxTotal: sale.TaxTotal,
            GrandTotal: sale.GrandTotal,
            PaidAmount: sale.PaidAmount,
            ChangeAmount: sale.PaidAmount > sale.GrandTotal ? sale.PaidAmount - sale.GrandTotal : 0m,
            Lines: sale.Lines.Select(l => new PrintableInvoiceLineDto(
                Sku: l.Product.Sku,
                Name: l.ProductNameSnapshot,
                Quantity: l.Quantity,
                UnitPrice: l.UnitPrice,
                TaxAmount: l.TaxAmount,
                LineTotal: l.LineTotal
            )).ToList()
        );
    }

    #endregion
}