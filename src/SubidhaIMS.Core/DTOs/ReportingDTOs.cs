namespace SubidhaIMS.Core.DTOs;

public record DashboardMetricsDto(
    decimal TodaySales,
    decimal TodayPurchases,
    decimal TodayProfit,
    decimal MonthSales,
    decimal MonthPurchases,
    decimal MonthProfit,
    decimal TotalStockValuation,
    int TotalActiveProducts,
    int LowStockCount,
    decimal TotalReceivables,
    decimal TotalPayables
);

public record TopProfitableProductDto(
    long ProductId,
    string Sku,
    string Name,
    decimal TotalQuantitySold,
    decimal TotalRevenue,
    decimal TotalCogs,
    decimal TotalProfit,
    decimal MarginPercentage
);

public record StockLedgerEntryDto(
    long ProductId,
    string Sku,
    string Name,
    string UnitSymbol,
    decimal OpeningQuantity,
    decimal InwardQuantity,
    decimal OutwardQuantity,
    decimal ClosingQuantity,
    decimal AverageUnitCost,
    decimal TotalValuation
);

public record ProfitAndLossStatementDto(
    DateTime FromDate,
    DateTime ToDate,
    decimal SalesRevenue,
    decimal CostOfGoodsSold,
    decimal GrossProfit,
    decimal OperatingExpenses,
    decimal NetProfit
);

public record BalanceSheetAccountLineDto(
    string AccountCode,
    string AccountName,
    decimal Balance
);

public record BalanceSheetStatementDto(
    DateTime AsOfDate,
    List<BalanceSheetAccountLineDto> CurrentAssets,
    decimal TotalCurrentAssets,
    List<BalanceSheetAccountLineDto> CurrentLiabilities,
    decimal TotalCurrentLiabilities,
    List<BalanceSheetAccountLineDto> Equity,
    decimal NetIncomeRetained,
    decimal TotalEquity,
    decimal TotalLiabilitiesAndEquity,
    bool IsBalanced
);