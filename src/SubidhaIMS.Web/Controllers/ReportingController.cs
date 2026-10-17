using Microsoft.AspNetCore.Mvc;
using SubidhaIMS.Core.DTOs;
using SubidhaIMS.Core.Interfaces;

namespace SubidhaIMS.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private readonly IReportingService _reportingService;

    public ReportsController(IReportingService reportingService)
    {
        _reportingService = reportingService;
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<DashboardMetricsDto>> GetDashboard()
    {
        var metrics = await _reportingService.GetDashboardMetricsAsync();
        return Ok(metrics);
    }

    [HttpGet("top-profitable")]
    public async Task<ActionResult<IEnumerable<TopProfitableProductDto>>> GetTopProfitable(
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] int limit = 5)
    {
        var products = await _reportingService.GetTopProfitableProductsAsync(fromDate, toDate, limit);
        return Ok(products);
    }

    [HttpGet("stock-ledger")]
    public async Task<ActionResult<IEnumerable<StockLedgerEntryDto>>> GetStockLedger(
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate)
    {
        var ledger = await _reportingService.GetStockLedgerAsync(fromDate, toDate);
        return Ok(ledger);
    }

    [HttpGet("profit-loss")]
    public async Task<ActionResult<ProfitAndLossStatementDto>> GetProfitAndLoss(
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate)
    {
        var from = fromDate ?? DateTime.UtcNow.AddDays(-30);
        var to = toDate ?? DateTime.UtcNow;

        var pnl = await _reportingService.GetProfitAndLossAsync(from, to);
        return Ok(pnl);
    }

    [HttpGet("balance-sheet")]
    public async Task<ActionResult<BalanceSheetStatementDto>> GetBalanceSheet([FromQuery] DateTime? asOfDate)
    {
        var date = asOfDate ?? DateTime.UtcNow;
        var balanceSheet = await _reportingService.GetBalanceSheetAsync(date);
        return Ok(balanceSheet);
    }
}