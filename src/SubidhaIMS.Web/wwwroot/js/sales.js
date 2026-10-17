const SalesView = {
  rawSales: [],

  render: async (container) => {
    container.innerHTML = `
      <div class="flex flex-col gap-6">

        <!-- Top Command Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div class="flex flex-col gap-1.5">
            <div class="flex items-center gap-1.5 font-mono text-xs text-slate-500 uppercase tracking-wider font-semibold">
              <span>Billing</span>
              <span class="material-symbols-outlined text-[13px] text-slate-400">chevron_right</span>
              <span class="text-emerald-700 font-bold">बिक्री खाता</span>
            </div>
            <div class="flex items-center gap-2.5">
              <span class="material-symbols-outlined text-emerald-700 text-2xl">receipt_long</span>
              <h1 class="font-headline text-2xl font-bold text-slate-900 tracking-tight">Sales Book Register</h1>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2.5">
            <button onclick="SalesView.exportCsv()" 
                    class="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-xs transition-colors">
              <span class="material-symbols-outlined text-base text-emerald-600 leading-none">table_view</span>
              <span>Export CSV</span>
            </button>
            <a href="#pos" 
               class="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold font-headline rounded-lg shadow-sm shadow-emerald-500/20 transition-all">
              <span class="material-symbols-outlined text-base leading-none">add_circle</span>
              <span>New POS Bill</span>
            </a>
          </div>
        </div>

        <!-- Filter & Search Toolbar -->
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div class="relative flex-1 max-w-md">
            <span class="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg">search</span>
            <input type="text" id="sales-search" 
                   oninput="SalesView.filterSales(this.value)"
                   class="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:outline-none"
                   placeholder="Search invoice number or customer name...">
          </div>
          <span id="sales-count-badge" class="font-mono text-xs text-slate-500 self-center">Loading records...</span>
        </div>

        <!-- Sales Invoices Table Card -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div class="p-4 px-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-slate-600 text-lg">receipt</span>
              <h2 class="font-headline text-sm font-bold text-slate-900">Tax Invoices Log</h2>
            </div>
            <span class="font-mono text-xs text-slate-500 font-semibold">Nepal IRD Compliance Format</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead class="bg-slate-50 text-slate-600 font-mono text-[11px] uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th class="py-3 px-4">Invoice #</th>
                  <th class="py-3 px-4">Customer Name</th>
                  <th class="py-3 px-3">Date</th>
                  <th class="py-3 px-3">Tender</th>
                  <th class="py-3 px-4 text-right">Grand Total (NPR)</th>
                  <th class="py-3 px-4 text-right">Net Profit</th>
                  <th class="py-3 px-3 text-center">Payment Status</th>
                  <th class="py-3 px-4 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody id="sales-tbody" class="divide-y divide-slate-100 text-slate-800">
                <tr>
                  <td colspan="8" class="text-center py-12 text-slate-500">
                    <span class="material-symbols-outlined text-3xl animate-spin text-emerald-600 mb-2 leading-none">progress_activity</span>
                    <div>Loading sales register...</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;

    await SalesView.loadSales();
  },

  loadSales: async () => {
    try {
      const list = await api.get('/sales');
      SalesView.rawSales = list || [];
      SalesView.renderRows(SalesView.rawSales);
    } catch (err) {
      console.error('Failed to load sales register:', err);
      const tbody = document.getElementById('sales-tbody');
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-rose-600 font-semibold text-xs">${err.message}</td></tr>`;
      }
    }
  },

  filterSales: (query) => {
    const q = query.toLowerCase().trim();
    const filtered = SalesView.rawSales.filter(s =>
      s.invoiceNo.toLowerCase().includes(q) ||
      (s.customerName && s.customerName.toLowerCase().includes(q))
    );
    SalesView.renderRows(filtered);
  },

  renderRows: (sales) => {
    const tbody = document.getElementById('sales-tbody');
    const badge = document.getElementById('sales-count-badge');
    if (!tbody) return;

    if (badge) badge.innerText = `Showing ${sales.length} of ${SalesView.rawSales.length} bills`;

    if (!sales.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-12 text-slate-400">
            <span class="material-symbols-outlined text-3xl text-slate-300 block mb-1">receipt_long</span>
            <div class="text-xs font-semibold text-slate-600">No sales transactions found</div>
            <div class="text-[11px] text-slate-400 mt-0.5">Bills completed at the POS will appear here</div>
          </td>
        </tr>`;
      return;
    }

    const isMasked = localStorage.getItem('ims_mask_metrics') === 'true';
    const mask = '••••••';

    tbody.innerHTML = sales.map(s => `
      <tr class="hover:bg-slate-50 transition-colors">
        <td class="py-3 px-4 font-mono font-bold text-slate-900">${s.invoiceNo}</td>
        <td class="py-3 px-4 font-bold text-slate-900">${s.customerName || 'Walk-in Customer'}</td>
        <td class="py-3 px-3 font-mono text-slate-600">${UI.formatDate(s.saleDate)}</td>
        <td class="py-3 px-3">
          <span class="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-mono">
            ${s.paymentMethod}
          </span>
        </td>
        <td class="py-3 px-4 text-right font-mono font-bold text-slate-900">${UI.formatMoney(s.grandTotal)}</td>
        <td class="py-3 px-4 text-right font-mono font-bold text-emerald-700">
          ${isMasked ? mask : UI.formatMoney(s.totalProfit)}
        </td>
        <td class="py-3 px-3 text-center">
          <span class="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
            s.paymentStatus === 'Paid' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
              : 'bg-amber-50 text-amber-800 border border-amber-200'
          }">
            ${s.paymentStatus}
          </span>
        </td>
        <td class="py-3 px-4 text-center">
          <button onclick="PosView.printReceipt(${s.id})" 
                  class="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-slate-100 transition-colors" title="Print 80mm Receipt">
            <span class="material-symbols-outlined text-base leading-none">print</span>
          </button>
        </td>
      </tr>
    `).join('');
  },

  exportCsv: async () => {
    try {
      const sales = SalesView.rawSales.length ? SalesView.rawSales : await api.get('/sales');
      if (!sales.length) return UI.showAlert('No sales records to export', 'warning');

      const headers = ['Invoice No', 'Customer Name', 'Date', 'Payment Method', 'Payment Status', 'Grand Total (NPR)', 'Profit (NPR)'];
      const rows = sales.map(s => [
        s.invoiceNo,
        s.customerName || 'Walk-in Customer',
        s.saleDate.slice(0, 10),
        s.paymentMethod,
        s.paymentStatus,
        s.grandTotal.toFixed(2),
        s.totalProfit.toFixed(2)
      ]);

      Exporter.toCsv('Sales_Register_Nepal', headers, rows);
    } catch (err) {
      UI.showAlert(err.message, 'danger');
    }
  }
};