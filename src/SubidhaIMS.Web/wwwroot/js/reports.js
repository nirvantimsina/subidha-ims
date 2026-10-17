const ReportsView = {
  rawMetrics: null,
  topItems: null,

  render: async (container) => {
    container.innerHTML = `
      <div class="flex flex-col gap-6">
        
        <!-- Operational Command Bar -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div class="flex flex-col gap-1.5">
            <div class="flex items-center gap-1.5 font-mono text-xs text-slate-500 uppercase tracking-wider font-semibold">
              <span>Retail</span>
              <span class="material-symbols-outlined text-[13px] text-slate-400">chevron_right</span>
              <span>Main Counter</span>
              <span class="material-symbols-outlined text-[13px] text-slate-400">chevron_right</span>
              <span class="text-emerald-700 font-bold">Daily Overview</span>
            </div>
            <div class="flex items-center gap-3">
              <h1 class="font-headline text-2xl font-bold text-slate-900 tracking-tight">Main Counter Ops</h1>
              <div class="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                <span class="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                <span class="font-mono text-xs text-emerald-800 font-bold uppercase tracking-wide">Ready for Billing</span>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="flex items-center gap-2.5">
            <a href="#pos" class="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold font-headline rounded-lg shadow-sm shadow-emerald-500/20 transition-all">
              <span class="material-symbols-outlined text-base leading-none">add_circle</span>
              <span>Open POS</span>
            </a>
            <a href="#purchases" class="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-xs transition-colors">
              <span class="material-symbols-outlined text-base leading-none text-blue-600">move_to_inbox</span>
              <span>Inward Bill</span>
            </a>
          </div>
        </div>

        <!-- 4 Primary Executive KPI Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <!-- Card 1 -->
          <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between relative overflow-hidden group">
            <div class="flex items-start justify-between">
              <div class="flex flex-col">
                <span class="font-mono text-xs text-slate-500 font-semibold uppercase tracking-wider">Today's Sales</span>
                <span id="kpi-today-sales" class="font-headline text-2xl font-bold text-slate-900 mt-1 tracking-tight">••••••••</span>
              </div>
              <div class="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                <span class="material-symbols-outlined text-xl">payments</span>
              </div>
            </div>
            <div class="mt-4 pt-2.5 border-t border-slate-100 flex items-end justify-between">
              <div class="flex items-center gap-1 text-emerald-700 font-mono text-xs font-semibold">
                <span class="material-symbols-outlined text-sm leading-none">trending_up</span>
                <span>Active Counter</span>
              </div>
              <div class="flex items-end gap-1 h-5">
                <div class="w-1 bg-slate-200 rounded-t h-2"></div>
                <div class="w-1 bg-slate-200 rounded-t h-3"></div>
                <div class="w-1 bg-slate-200 rounded-t h-2.5"></div>
                <div class="w-1 bg-emerald-300 rounded-t h-4"></div>
                <div class="w-1 bg-emerald-500 rounded-t h-5"></div>
              </div>
            </div>
          </div>

          <!-- Card 2 -->
          <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between relative overflow-hidden group">
            <div class="flex items-start justify-between">
              <div class="flex flex-col">
                <span class="font-mono text-xs text-slate-500 font-semibold uppercase tracking-wider">Today's Profit</span>
                <span id="kpi-today-profit" class="font-headline text-2xl font-bold text-emerald-700 mt-1 tracking-tight">••••••••</span>
              </div>
              <div class="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                <span class="material-symbols-outlined text-xl">query_stats</span>
              </div>
            </div>
            <div class="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between font-mono text-xs text-slate-500">
              <span>Revenue − AVCO</span>
              <span class="text-blue-700 font-bold">Live Net</span>
            </div>
          </div>

          <!-- Card 3 -->
          <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between relative overflow-hidden group">
            <div class="flex items-start justify-between">
              <div class="flex flex-col">
                <span class="font-mono text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Stock Value</span>
                <span id="kpi-stock-val" class="font-headline text-2xl font-bold text-slate-900 mt-1 tracking-tight">••••••••</span>
              </div>
              <div class="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
                <span class="material-symbols-outlined text-xl">inventory</span>
              </div>
            </div>
            <div class="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between font-mono text-xs text-slate-500">
              <span id="kpi-product-count">-- active items</span>
              <span class="text-indigo-700 font-bold">AVCO Basis</span>
            </div>
          </div>

          <!-- Card 4 -->
          <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between relative overflow-hidden group">
            <div class="flex items-start justify-between">
              <div class="flex flex-col">
                <span class="font-mono text-xs text-slate-500 font-semibold uppercase tracking-wider">Low Stock Warnings</span>
                <div class="flex items-baseline gap-1.5 mt-1">
                  <span id="kpi-low-stock" class="font-headline text-2xl font-bold text-rose-600 tracking-tight">0</span>
                  <span class="font-mono text-xs text-slate-500 font-medium">Items Alerted</span>
                </div>
              </div>
              <div class="w-10 h-10 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <span class="material-symbols-outlined text-xl">crisis_alert</span>
              </div>
            </div>
            <div class="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between font-mono text-xs">
              <span class="text-slate-500">Reorder Thresholds</span>
              <span class="text-rose-600 font-bold">Restock Prompt</span>
            </div>
          </div>
        </div>

        <!-- Split Layout (8 col / 4 col) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div class="lg:col-span-8 flex flex-col gap-6">
            <!-- Top Profitable Table Card -->
            <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
              <div class="p-4 px-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-emerald-700 text-lg">trophy</span>
                  <h3 class="font-headline text-sm font-bold text-slate-900 tracking-tight">Top Profitable Items Sold</h3>
                </div>
                <span class="font-mono text-xs text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded font-semibold">Margin Contribution</span>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs border-collapse">
                  <thead class="bg-slate-50 text-slate-600 font-mono text-[11px] uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th class="py-3 px-4">Item &amp; SKU</th>
                      <th class="py-3 px-3 text-center">Qty Sold</th>
                      <th class="py-3 px-3 text-right">Revenue</th>
                      <th class="py-3 px-3 text-right">Profit</th>
                      <th class="py-3 px-4 text-right">Margin %</th>
                    </tr>
                  </thead>
                  <tbody id="top-profit-host" class="divide-y divide-slate-100 text-slate-800">
                    <tr>
                      <td colspan="5" class="text-center py-10 text-slate-500 font-medium">
                        Loading top products...
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Liquidity Snapshot -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div class="flex flex-col">
                  <span class="font-mono text-xs uppercase tracking-wider text-slate-500 font-bold">Customer Udharo (Khata)</span>
                  <span id="kpi-receivables" class="font-headline text-xl font-bold text-slate-900 mt-1 font-mono">••••••••</span>
                  <span class="text-xs text-slate-500 mt-0.5">Total unsettled receivables</span>
                </div>
                <div class="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-xl">credit_score</span>
                </div>
              </div>

              <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div class="flex flex-col">
                  <span class="font-mono text-xs uppercase tracking-wider text-slate-500 font-bold">Supplier Payables (Dues)</span>
                  <span id="kpi-payables" class="font-headline text-xl font-bold text-slate-900 mt-1 font-mono">••••••••</span>
                  <span class="text-xs text-slate-500 mt-0.5">Pending distributor bills</span>
                </div>
                <div class="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-xl">receipt</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Critical Reorder Alerts -->
          <div class="lg:col-span-4 flex flex-col gap-6">
            <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
              <div class="p-4 px-5 border-b border-slate-200 flex items-center justify-between bg-rose-50/40">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-rose-600 text-lg">warning</span>
                  <h3 class="font-headline text-sm font-bold text-slate-900 tracking-tight">Critical Reorders</h3>
                </div>
                <span id="reorder-badge" class="px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-200 font-mono text-xs font-bold rounded uppercase">0 Alert</span>
              </div>
              <div id="low-stock-host" class="p-3 divide-y divide-slate-100 max-h-[460px] overflow-y-auto">
                <div class="text-center py-10 text-slate-500 text-xs">Checking stock thresholds...</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    `;

    try {
      const metrics = await api.get('/reports/dashboard');
      ReportsView.rawMetrics = metrics;

      const lowStockEl = document.getElementById('kpi-low-stock');
      if (lowStockEl) lowStockEl.innerText = metrics.lowStockCount;

      const prodCountEl = document.getElementById('kpi-product-count');
      if (prodCountEl) prodCountEl.innerText = `${metrics.totalActiveProducts} Active SKUs`;

      ReportsView.updateMetricCards();

      const top = await api.get('/reports/top-profitable');
      ReportsView.topItems = top;
      ReportsView.renderTopProfitable(top);

      const lowStockItems = await api.get('/products?lowStockOnly=true');
      ReportsView.renderLowStock(lowStockItems);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      throw err;
    }
  },

  updateMetricCards: () => {
    if (!ReportsView.rawMetrics) return;
    const m = ReportsView.rawMetrics;
    const mask = '••••••••';

    const sSales = document.getElementById('kpi-today-sales');
    const sProfit = document.getElementById('kpi-today-profit');
    const sStock = document.getElementById('kpi-stock-val');
    const sRec = document.getElementById('kpi-receivables');
    const sPay = document.getElementById('kpi-payables');

    if (sSales) sSales.innerText = UI.isMasked ? mask : UI.formatMoney(m.todaySales);
    if (sProfit) sProfit.innerText = UI.isMasked ? mask : UI.formatMoney(m.todayProfit);
    if (sStock) sStock.innerText = UI.isMasked ? mask : UI.formatMoney(m.totalStockValuation);
    if (sRec) sRec.innerText = UI.isMasked ? mask : UI.formatMoney(m.totalReceivables);
    if (sPay) sPay.innerText = UI.isMasked ? mask : UI.formatMoney(m.totalPayables);
  },

  renderTopProfitable: (items) => {
    const host = document.getElementById('top-profit-host');
    if (!host) return;

    if (!items || !items.length) {
      host.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-slate-500 text-xs font-medium">No sales recorded yet</td></tr>';
      return;
    }

    const mask = '••••••';
    host.innerHTML = items.map(t => `
      <tr class="hover:bg-slate-50 transition-colors">
        <td class="py-3 px-4">
          <div class="flex flex-col">
            <span class="font-bold text-slate-900 text-xs">${t.name}</span>
            <span class="font-mono text-[11px] text-slate-500 font-medium">${t.sku}</span>
          </div>
        </td>
        <td class="py-3 px-3 text-center font-mono font-semibold text-slate-800">${t.totalQuantitySold}</td>
        <td class="py-3 px-3 text-right font-mono font-medium text-slate-700">${UI.isMasked ? mask : UI.formatMoney(t.totalRevenue)}</td>
        <td class="py-3 px-3 text-right font-mono font-bold text-emerald-700">${UI.isMasked ? mask : UI.formatMoney(t.totalProfit)}</td>
        <td class="py-3 px-4 text-right">
          <span class="inline-block px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            ${UI.isMasked ? '••%' : t.marginPercentage + '%'}
          </span>
        </td>
      </tr>
    `).join('');
  },

  renderLowStock: (items) => {
    const host = document.getElementById('low-stock-host');
    const badge = document.getElementById('reorder-badge');
    if (!host) return;

    if (badge) badge.innerText = `${items.length} ${items.length === 1 ? 'Alert' : 'Alerts'}`;

    if (!items || !items.length) {
      host.innerHTML = `
        <div class="text-center py-10 flex flex-col items-center justify-center text-slate-400">
          <span class="material-symbols-outlined text-3xl text-emerald-600 mb-1">check_circle</span>
          <span class="text-xs font-bold text-slate-700">Inventory is healthy</span>
          <span class="text-xs text-slate-500 mt-0.5">All items are above reorder levels</span>
        </div>`;
      return;
    }

    host.innerHTML = items.map(p => `
      <div class="p-3 flex flex-col gap-1.5 hover:bg-slate-50 rounded-lg transition-colors">
        <div class="flex justify-between items-start gap-2">
          <div class="flex flex-col min-w-0">
            <span class="font-bold text-xs text-slate-900 truncate">${p.name}</span>
            <span class="font-mono text-[11px] text-slate-500 font-medium">${p.sku}</span>
          </div>
          <span class="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 font-mono text-xs font-bold rounded shrink-0">
            Stock: ${p.quantityOnHand} ${p.unitSymbol}
          </span>
        </div>
        <div class="flex justify-between items-center text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>Min Alert: <strong class="text-slate-700">${p.reorderLevel}</strong></span>
          <a href="#purchases" class="text-emerald-700 hover:text-emerald-800 font-bold text-xs inline-flex items-center gap-0.5">
            <span>Inward Stock</span>
            <span class="material-symbols-outlined text-xs leading-none">arrow_forward</span>
          </a>
        </div>
      </div>
    `).join('');
  }
};