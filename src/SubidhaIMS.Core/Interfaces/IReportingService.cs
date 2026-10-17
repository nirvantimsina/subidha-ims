using SubidhaIMS.Core.DTOs;

namespace SubidhaIMS.Core.Interfaces;

public interface IReportingService
{
    Task<DashboardMetricsDto> GetDashboardMetricsAsync();
    Task<IEnumerable<TopProfitableProductDto>> GetTopProfitableProductsAsync(DateTime? fromDate = null, DateTime? toDate = null, int limit = 5);
    Task<IEnumerable<StockLedgerEntryDto>> GetStockLedgerAsync(DateTime? fromDate = null, DateTime? toDate = null);
    Task<ProfitAndLossStatementDto> GetProfitAndLossAsync(DateTime fromDate, DateTime toDate);
    Task<BalanceSheetStatementDto> GetBalanceSheetAsync(DateTime asOfDate);
}