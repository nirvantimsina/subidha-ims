using Microsoft.EntityFrameworkCore;
using SubidhaIMS.Core.DTOs;
using SubidhaIMS.Core.Enums;
using SubidhaIMS.Core.Interfaces;
using SubidhaIMS.Infrastructure.Data;

namespace SubidhaIMS.Infrastructure.Services;

public class ReportingService : IReportingService
{
    private readonly AppDbContext _db;

    public ReportingService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<DashboardMetricsDto> GetDashboardMetricsAsync()
    {
        var now = DateTime.UtcNow;
        var todayStart = DateTime.SpecifyKind(now.Date, DateTimeKind.Utc);
        var tomorrowStart = todayStart.AddDays(1);
        var monthStart = DateTime.SpecifyKind(new DateTime(now.Year, now.Month, 1), DateTimeKind.Utc);

        // 1. Direct scalar sums (100% translatable in EF Core SQL)
        var todaySales = await _db.Sales
            .AsNoTracking()
            .Where(s => s.SaleDate >= todayStart && s.SaleDate < tomorrowStart && s.Status == DocStatus.Posted)
            .SumAsync(s => (decimal?)s.GrandTotal) ?? 0m;

        var todayProfit = await _db.Sales
            .AsNoTracking()
            .Where(s => s.SaleDate >= todayStart && s.SaleDate < tomorrowStart && s.Status == DocStatus.Posted)
            .SumAsync(s => (decimal?)s.TotalProfit) ?? 0m;

        var monthSales = await _db.Sales
            .AsNoTracking()
            .Where(s => s.SaleDate >= monthStart && s.Status == DocStatus.Posted)
            .SumAsync(s => (decimal?)s.GrandTotal) ?? 0m;

        var monthProfit = await _db.Sales
            .AsNoTracking()
            .Where(s => s.SaleDate >= monthStart && s.Status == DocStatus.Posted)
            .SumAsync(s => (decimal?)s.TotalProfit) ?? 0m;

        var todayPurchases = await _db.Purchases
            .AsNoTracking()
            .Where(p => p.PurchaseDate >= todayStart && p.PurchaseDate < tomorrowStart && p.Status == DocStatus.Posted)
            .SumAsync(p => (decimal?)p.GrandTotal) ?? 0m;

        var monthPurchases = await _db.Purchases
            .AsNoTracking()
            .Where(p => p.PurchaseDate >= monthStart && p.Status == DocStatus.Posted)
            .SumAsync(p => (decimal?)p.GrandTotal) ?? 0m;

        // 2. Stock and ledger counts
        var totalStockValuation = await _db.ProductStocks.SumAsync(s => (decimal?)s.TotalValue) ?? 0m;
        var totalActiveProducts = await _db.Products.CountAsync(p => p.IsActive);

        var lowStockCount = await _db.Products
            .AsNoTracking()
            .Include(p => p.Stock)
            .CountAsync(p => p.IsActive && p.Stock != null && p.Stock.QuantityOnHand <= p.ReorderLevel);

        var totalReceivables = await _db.Customers.Where(c => c.IsActive).SumAsync(c => (decimal?)c.CurrentBalance) ?? 0m;
        var totalPayables = await _db.Suppliers.Where(s => s.IsActive).SumAsync(s => (decimal?)s.CurrentBalance) ?? 0m;

        return new DashboardMetricsDto(
            TodaySales: todaySales,
            TodayPurchases: todayPurchases,
            TodayProfit: todayProfit,
            MonthSales: monthSales,
            MonthPurchases: monthPurchases,
            MonthProfit: monthProfit,
            TotalStockValuation: totalStockValuation,
            TotalActiveProducts: totalActiveProducts,
            LowStockCount: lowStockCount,
            TotalReceivables: totalReceivables,
            TotalPayables: totalPayables
        );
    }

    public async Task<IEnumerable<TopProfitableProductDto>> GetTopProfitableProductsAsync(
        DateTime? fromDate = null, DateTime? toDate = null, int limit = 5)
    {
        var start = fromDate.HasValue ? DateTime.SpecifyKind(fromDate.Value.Date, DateTimeKind.Utc) : DateTime.MinValue;
        var end = toDate.HasValue ? DateTime.SpecifyKind(toDate.Value.Date.AddDays(1), DateTimeKind.Utc) : DateTime.MaxValue;

        var lines = await _db.SaleLines
            .AsNoTracking()
            .Include(l => l.Sale)
            .Include(l => l.Product)
            .Where(l => l.Sale.Status == DocStatus.Posted && l.Sale.SaleDate >= start && l.Sale.SaleDate < end)
            .Select(l => new
            {
                l.ProductId,
                l.Product.Sku,
                l.ProductNameSnapshot,
                l.Quantity,
                Revenue = l.LineTotal - l.TaxAmount,
                Cogs = l.Quantity * l.UnitCostSnapshot,
                l.LineProfit
            })
            .ToListAsync();

        return lines
            .GroupBy(l => new { l.ProductId, l.Sku, l.ProductNameSnapshot })
            .Select(g =>
            {
                var revenue = g.Sum(x => x.Revenue);
                var profit = g.Sum(x => x.LineProfit);
                return new TopProfitableProductDto(
                    g.Key.ProductId,
                    g.Key.Sku,
                    g.Key.ProductNameSnapshot,
                    g.Sum(x => x.Quantity),
                    revenue,
                    g.Sum(x => x.Cogs),
                    profit,
                    revenue > 0 ? Math.Round((profit / revenue) * 100m, 2) : 0m
                );
            })
            .OrderByDescending(x => x.TotalProfit)
            .Take(limit)
            .ToList();
    }

    public async Task<IEnumerable<StockLedgerEntryDto>> GetStockLedgerAsync(DateTime? fromDate = null, DateTime? toDate = null)
    {
        var start = fromDate.HasValue ? DateTime.SpecifyKind(fromDate.Value.Date, DateTimeKind.Utc) : DateTime.MinValue;
        var end = toDate.HasValue ? DateTime.SpecifyKind(toDate.Value.Date.AddDays(1), DateTimeKind.Utc) : DateTime.MaxValue;

        var products = await _db.Products
            .AsNoTracking()
            .Include(p => p.Unit)
            .Include(p => p.Stock)
            .Include(p => p.StockMovements)
            .Where(p => p.IsActive)
            .OrderBy(p => p.Name)
            .ToListAsync();

        var ledger = new List<StockLedgerEntryDto>();

        foreach (var p in products)
        {
            var priorMovements = p.StockMovements.Where(m => m.MovementDate < start).ToList();
            var periodMovements = p.StockMovements.Where(m => m.MovementDate >= start && m.MovementDate < end).ToList();

            var openingQty = priorMovements.Sum(m => m.QuantityChange);
            var inwardQty = periodMovements.Where(m => m.QuantityChange > 0).Sum(m => m.QuantityChange);
            var outwardQty = Math.Abs(periodMovements.Where(m => m.QuantityChange < 0).Sum(m => m.QuantityChange));
            var closingQty = openingQty + inwardQty - outwardQty;

            var avgCost = p.Stock?.AverageCost ?? p.DefaultPurchaseCost;
            var valuation = Math.Round(closingQty * avgCost, 2);

            ledger.Add(new StockLedgerEntryDto(
                p.Id,
                p.Sku,
                p.Name,
                p.Unit.Symbol,
                openingQty,
                inwardQty,
                outwardQty,
                closingQty,
                avgCost,
                valuation
            ));
        }

        return ledger;
    }

    public async Task<ProfitAndLossStatementDto> GetProfitAndLossAsync(DateTime fromDate, DateTime toDate)
    {
        // Explicitly enforce DateTimeKind.Utc for Npgsql compatibility
        var fromUtc = DateTime.SpecifyKind(fromDate.Date, DateTimeKind.Utc);
        var toUtc = DateTime.SpecifyKind(toDate.Date.AddDays(1), DateTimeKind.Utc);

        var sales = await _db.Sales
            .AsNoTracking()
            .Where(s => s.SaleDate >= fromUtc && s.SaleDate < toUtc && s.Status == DocStatus.Posted)
            .Select(s => new { Revenue = s.GrandTotal - s.TaxTotal, s.TotalCogs })
            .ToListAsync();

        var revenue = sales.Any() ? sales.Sum(x => x.Revenue) : 0m;
        var cogs = sales.Any() ? sales.Sum(x => x.TotalCogs) : 0m;
        var grossProfit = revenue - cogs;
        var netProfit = grossProfit; // Operating expenses can be subtracted here if tracked

        return new ProfitAndLossStatementDto(fromUtc, toUtc, revenue, cogs, grossProfit, 0m, netProfit);
    }

    public async Task<BalanceSheetStatementDto> GetBalanceSheetAsync(DateTime asOfDate)
    {
        // Explicitly enforce DateTimeKind.Utc
        var targetDateUtc = DateTime.SpecifyKind(asOfDate.Date.AddDays(1), DateTimeKind.Utc);
        
        var accounts = await _db.LedgerAccounts.AsNoTracking().ToListAsync();

        var assets = new List<BalanceSheetAccountLineDto>();
        var liabilities = new List<BalanceSheetAccountLineDto>();
        var equity = new List<BalanceSheetAccountLineDto>();

        foreach (var acc in accounts)
        {
            var line = new BalanceSheetAccountLineDto(acc.Code, acc.Name, acc.CurrentBalance);
            if (acc.Category == AccountCategory.Asset) assets.Add(line);
            else if (acc.Category == AccountCategory.Liability) liabilities.Add(line);
            else if (acc.Category == AccountCategory.Equity) equity.Add(line);
        }

        var salesToDate = await _db.Sales
            .AsNoTracking()
            .Where(s => s.SaleDate < targetDateUtc && s.Status == DocStatus.Posted)
            .SumAsync(s => (decimal?)s.TotalProfit) ?? 0m;

        var totalAssets = assets.Sum(a => a.Balance);
        var totalLiabilities = liabilities.Sum(l => l.Balance);
        var totalEquity = equity.Sum(e => e.Balance) + salesToDate;
        var totalLiabEquity = totalLiabilities + totalEquity;

        return new BalanceSheetStatementDto(
            AsOfDate: asOfDate.Date,
            CurrentAssets: assets,
            TotalCurrentAssets: totalAssets,
            CurrentLiabilities: liabilities,
            TotalCurrentLiabilities: totalLiabilities,
            Equity: equity,
            NetIncomeRetained: salesToDate,
            TotalEquity: totalEquity,
            TotalLiabilitiesAndEquity: totalLiabEquity,
            IsBalanced: Math.Abs(totalAssets - totalLiabEquity) < 1.0m
        );
    }
}