const StockView = {
  rawLedger: [],
  products: [],
  activeFilter: 'all', // 'all' | 'low' | 'out'

  render: async (container) => {
    container.innerHTML = `
      <div class="flex flex-col gap-6">

        <!-- Top Command Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div class="flex flex-col gap-1.5">
            <div class="flex items-center gap-1.5 font-mono text-xs text-slate-500 uppercase tracking-wider font-semibold">
              <span>Inventory</span>
              <span class="material-symbols-outlined text-[13px] text-slate-400">chevron_right</span>
              <span class="text-emerald-700 font-bold">स्टक खाता</span>
            </div>
            <div class="flex items-center gap-2.5">
              <span class="material-symbols-outlined text-emerald-700 text-2xl">shelves</span>
              <h1 class="font-headline text-2xl font-bold text-slate-900 tracking-tight">Stock Book &amp; Valuation</h1>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2.5">
            <button onclick="StockView.exportCsv()" 
                    class="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-xs transition-colors">
              <span class="material-symbols-outlined text-base text-emerald-600 leading-none">table_view</span>
              <span>Export CSV</span>
            </button>
            <button onclick="StockView.showAdjustModal()" 
                    class="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold font-headline rounded-lg shadow-sm transition-all">
              <span class="material-symbols-outlined text-base leading-none">tune</span>
              <span>Manual Adjustment</span>
            </button>
          </div>
        </div>

        <!-- Metric KPI Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div class="flex flex-col">
              <span class="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">Total Stock Value</span>
              <span id="stock-kpi-total-val" class="font-headline text-xl font-bold text-slate-900 mt-1 font-mono">••••••••</span>
              <span class="text-xs text-slate-500 mt-0.5">Weighted average basis (AVCO)</span>
            </div>
            <div class="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-xl">inventory_2</span>
            </div>
          </div>

          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div class="flex flex-col">
              <span class="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">Tracked Items</span>
              <span id="stock-kpi-total-skus" class="font-headline text-xl font-bold text-slate-900 mt-1 font-mono">0 SKUs</span>
              <span class="text-xs text-slate-500 mt-0.5">Active product catalog</span>
            </div>
            <div class="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-xl">category</span>
            </div>
          </div>

          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div class="flex flex-col">
              <span class="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">Stock Attention</span>
              <span id="stock-kpi-low-skus" class="font-headline text-xl font-bold text-rose-600 mt-1 font-mono">0 Alerts</span>
              <span class="text-xs text-slate-500 mt-0.5">Below reorder threshold</span>
            </div>
            <div class="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-xl">warning</span>
            </div>
          </div>
        </div>

        <!-- Filter & Search Bar -->
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div class="relative flex-1 max-w-md">
            <span class="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg">search</span>
            <input type="text" id="stock-search" 
                   oninput="StockView.filterTable()"
                   class="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:outline-none"
                   placeholder="Search by product name or SKU...">
          </div>

          <div class="flex items-center gap-1.5 font-mono text-xs overflow-x-auto pb-1 sm:pb-0">
            <button onclick="StockView.setFilter('all')" id="filter-btn-all"
                    class="px-3 py-1.5 rounded-lg font-bold transition-colors bg-slate-900 text-white">
              All Items
            </button>
            <button onclick="StockView.setFilter('low')" id="filter-btn-low"
                    class="px-3 py-1.5 rounded-lg font-bold transition-colors bg-slate-100 text-slate-600 hover:bg-slate-200">
              Low Stock
            </button>
            <button onclick="StockView.setFilter('out')" id="filter-btn-out"
                    class="px-3 py-1.5 rounded-lg font-bold transition-colors bg-slate-100 text-slate-600 hover:bg-slate-200">
              Out of Stock
            </button>
          </div>
        </div>

        <!-- Stock Ledger Register Table Card -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div class="p-4 px-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-slate-600 text-lg">fact_check</span>
              <h2 class="font-headline text-sm font-bold text-slate-900">Perpetual Stock Register</h2>
            </div>
            <span id="stock-filtered-count" class="font-mono text-xs text-slate-500 font-semibold">Showing items...</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead class="bg-slate-50 text-slate-600 font-mono text-[11px] uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th class="py-3 px-4">SKU</th>
                  <th class="py-3 px-4">Product Name</th>
                  <th class="py-3 px-3 text-center">Opening</th>
                  <th class="py-3 px-3 text-center text-emerald-700">Inward (+)</th>
                  <th class="py-3 px-3 text-center text-rose-700">Outward (−)</th>
                  <th class="py-3 px-4 text-center">Closing Balance</th>
                  <th class="py-3 px-4 text-right">Avg Unit Cost</th>
                  <th class="py-3 px-4 text-right">Total Valuation</th>
                </tr>
              </thead>
              <tbody id="stock-ledger-tbody" class="divide-y divide-slate-100 text-slate-800">
                <tr>
                  <td colspan="8" class="text-center py-12 text-slate-500">
                    <span class="material-symbols-outlined text-3xl animate-spin text-emerald-600 mb-2 leading-none">progress_activity</span>
                    <div>Calculating inventory ledger...</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <!-- Manual Stock Adjustment Modal -->
      <div class="modal fade" id="adjustModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content rounded-xl border border-slate-200 shadow-xl overflow-hidden">
            
            <div class="modal-header bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-emerald-700 text-xl leading-none">tune</span>
                <h3 class="font-headline text-base font-bold text-slate-900">Manual Stock Adjustment</h3>
              </div>
              <button type="button" class="text-slate-400 hover:text-slate-600 p-1" data-bs-dismiss="modal">
                <span class="material-symbols-outlined text-lg leading-none">close</span>
              </button>
            </div>

            <div class="modal-body p-6 flex flex-col gap-4">
              
              <div>
                <label class="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Select Product *</label>
                <select id="adj-product-id" 
                        class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none">
                </select>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Adjustment Type *</label>
                  <select id="adj-type" 
                          class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none">
                    <option value="4">Adjustment In (+ Surplus / Found)</option>
                    <option value="5">Adjustment Out (− Damaged / Missing)</option>
                  </select>
                </div>

                <div>
                  <label class="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Quantity *</label>
                  <input type="number" id="adj-qty" step="any" min="0.001" value="1" 
                         class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none">
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Reason / Remarks *</label>
                <input type="text" id="adj-reason" 
                       class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:outline-none" 
                       placeholder="e.g. Physical stock count discrepancy">
              </div>

            </div>

            <div class="modal-footer bg-slate-50/60 px-6 py-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button type="button" class="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors" data-bs-dismiss="modal">
                Cancel
              </button>
              <button type="button" onclick="StockView.saveAdjustment()" 
                      class="px-5 py-2 text-xs font-headline font-bold text-white bg-slate-900 hover:bg-slate-800 active:bg-black rounded-lg shadow-sm transition-all flex items-center gap-1.5">
                <span class="material-symbols-outlined text-base leading-none">check</span>
                <span>Apply &amp; Log Movement</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    `;

    await StockView.loadStockLedger();
  },

totalStockValuation: 0, // <-- Add this property to StockView

  loadStockLedger: async () => {
    try {
      const [ledger, products] = await Promise.all([
        api.get('/reports/stock-ledger'),
        api.get('/products')
      ]);

      StockView.rawLedger = ledger;
      StockView.products = products;

      // Calculate and store total valuation
      StockView.totalStockValuation = ledger.reduce((sum, item) => sum + (item.totalValuation || 0), 0);

      const skusEl = document.getElementById('stock-kpi-total-skus');
      if (skusEl) skusEl.innerText = `${ledger.length} SKUs`;

      // Match reorder thresholds from products
      const productMap = new Map(products.map(p => [p.id, p]));
      let lowStockCount = 0;

      ledger.forEach(l => {
        const p = productMap.get(l.productId);
        if (p && l.closingQuantity <= p.reorderLevel) {
          lowStockCount++;
        }
      });

      const lowEl = document.getElementById('stock-kpi-low-skus');
      if (lowEl) lowEl.innerText = `${lowStockCount} Alerts`;

      // Update the KPI card with masking check
      StockView.updateMetricCards();
      StockView.filterTable();
    } catch (err) {
      console.error('Failed to load stock ledger:', err);
    }
  },

  updateMetricCards: () => {
    const valEl = document.getElementById('stock-kpi-total-val');
    if (valEl) {
      valEl.innerText = UI.isMasked ? '••••••••' : UI.formatMoney(StockView.totalStockValuation);
    }
  },

  setFilter: (filter) => {
    StockView.activeFilter = filter;
    ['all', 'low', 'out'].forEach(f => {
      const btn = document.getElementById(`filter-btn-${f}`);
      if (btn) {
        if (f === filter) {
          btn.className = 'px-3 py-1.5 rounded-lg font-bold transition-colors bg-slate-900 text-white';
        } else {
          btn.className = 'px-3 py-1.5 rounded-lg font-bold transition-colors bg-slate-100 text-slate-600 hover:bg-slate-200';
        }
      }
    });
    StockView.filterTable();
  },

  filterTable: () => {
    const searchVal = (document.getElementById('stock-search')?.value || '').toLowerCase().trim();
    const productMap = new Map(StockView.products.map(p => [p.id, p]));

    const filtered = StockView.rawLedger.filter(item => {
      const p = productMap.get(item.productId);
      const matchesSearch = item.name.toLowerCase().includes(searchVal) || 
                            item.sku.toLowerCase().includes(searchVal);

      if (!matchesSearch) return false;

      if (StockView.activeFilter === 'out') {
        return item.closingQuantity <= 0;
      }
      if (StockView.activeFilter === 'low') {
        return p ? item.closingQuantity <= p.reorderLevel : item.closingQuantity <= 5;
      }
      return true;
    });

    StockView.renderTableRows(filtered);
  },

  renderTableRows: (ledger) => {
    const tbody = document.getElementById('stock-ledger-tbody');
    const countEl = document.getElementById('stock-filtered-count');
    if (!tbody) return;

    
    if (countEl) countEl.innerText = `Showing ${ledger.length} of ${StockView.rawLedger.length} items`;

    if (!ledger || !ledger.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-12 text-slate-400">
            <span class="material-symbols-outlined text-3xl text-slate-300 block mb-1">inventory_2</span>
            <div class="text-xs font-semibold text-slate-600">No stock records matched</div>
            <div class="text-[11px] text-slate-400 mt-0.5">Try clearing filters or search terms</div>
          </td>
        </tr>`;
      return;
    }

    const isMasked = UI.isMasked;
    const mask = '••••••';
    const productMap = new Map(StockView.products.map(p => [p.id, p]));

    tbody.innerHTML = ledger.map(l => {
      const p = productMap.get(l.productId);
      const isOut = l.closingQuantity <= 0;
      const isLow = p ? l.closingQuantity <= p.reorderLevel : false;

      let statusBadge = `
        <span class="inline-block px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
          ${l.closingQuantity} ${l.unitSymbol}
        </span>`;

      if (isOut) {
        statusBadge = `
          <span class="inline-block px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-100 text-slate-500 border border-slate-200">
            0 ${l.unitSymbol} (Out)
          </span>`;
      } else if (isLow) {
        statusBadge = `
          <span class="inline-block px-2 py-0.5 rounded text-xs font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
            ${l.closingQuantity} ${l.unitSymbol} (Low)
          </span>`;
      }

      return `
        <tr class="hover:bg-slate-50 transition-colors">
          <td class="py-3 px-4 font-mono font-bold text-slate-900 text-xs">${l.sku}</td>
          <td class="py-3 px-4 font-bold text-slate-900 text-xs">${l.name}</td>
          <td class="py-3 px-3 text-center font-mono font-medium text-slate-600">${l.openingQuantity} ${l.unitSymbol}</td>
          <td class="py-3 px-3 text-center font-mono font-semibold text-emerald-700 bg-emerald-50/40">
            ${l.inwardQuantity > 0 ? `+${l.inwardQuantity}` : '0'}
          </td>
          <td class="py-3 px-3 text-center font-mono font-semibold text-rose-700 bg-rose-50/40">
            ${l.outwardQuantity > 0 ? `−${l.outwardQuantity}` : '0'}
          </td>
          <td class="py-3 px-4 text-center font-mono">
            ${statusBadge}
          </td>
          <td class="py-3 px-4 text-right font-mono font-medium text-slate-700">${UI.formatMoney(l.averageUnitCost)}</td>
          <td class="py-3 px-4 text-right font-mono font-bold text-emerald-800">
            ${isMasked ? mask : UI.formatMoney(l.totalValuation)}
          </td>
        </tr>
      `;
    }).join('');
  },

  exportCsv: async () => {
    try {
      const ledger = StockView.rawLedger.length ? StockView.rawLedger : await api.get('/reports/stock-ledger');
      if (!ledger || !ledger.length) {
        return UI.showAlert('No stock records to export.', 'warning');
      }

      const headers = [
        'SKU',
        'Product Name',
        'Unit',
        'Opening Qty',
        'Inward (+)',
        'Outward (-)',
        'Closing Qty',
        'Weighted Avg Cost (NPR)',
        'Total Valuation (NPR)'
      ];

      const rows = ledger.map(l => [
        l.sku,
        l.name,
        l.unitSymbol,
        l.openingQuantity,
        l.inwardQuantity,
        l.outwardQuantity,
        l.closingQuantity,
        l.averageUnitCost.toFixed(2),
        l.totalValuation.toFixed(2)
      ]);

      Exporter.toCsv('Stock_Ledger_Nepal', headers, rows);
    } catch (err) {
      UI.showAlert(err.message, 'danger');
    }
  },

  showAdjustModal: async () => {
    try {
      if (!StockView.products.length) {
        StockView.products = await api.get('/products');
      }

      const prodSelect = document.getElementById('adj-product-id');
      if (prodSelect) {
        prodSelect.innerHTML = StockView.products.map(p => 
          `<option value="${p.id}">${p.name} (SKU: ${p.sku} | Available: ${p.quantityOnHand} ${p.unitSymbol})</option>`
        ).join('');
      }

      const reasonInput = document.getElementById('adj-reason');
      if (reasonInput) reasonInput.value = '';

      const qtyInput = document.getElementById('adj-qty');
      if (qtyInput) qtyInput.value = '1';

      new bootstrap.Modal(document.getElementById('adjustModal')).show();
    } catch (err) {
      UI.showAlert('Failed to load products for adjustment: ' + err.message, 'danger');
    }
  },

  saveAdjustment: async () => {
    const prodSelect = document.getElementById('adj-product-id');
    const typeSelect = document.getElementById('adj-type');
    const qtyInput = document.getElementById('adj-qty');
    const reasonInput = document.getElementById('adj-reason');

    const productId = parseInt(prodSelect?.value || '0');
    const movementType = parseInt(typeSelect?.value || '4');
    const quantity = parseFloat(qtyInput?.value || '0');
    const reason = reasonInput?.value.trim() || '';

    if (!productId) return UI.showAlert('Please select a product.', 'warning');
    if (isNaN(quantity) || quantity <= 0) return UI.showAlert('Adjustment quantity must be greater than zero.', 'warning');
    if (!reason) return UI.showAlert('A valid reason is required for the audit trail.', 'warning');

    try {
      await api.post('/products/adjust-stock', {
        productId,
        movementType,
        quantity,
        unitCost: 0,
        reason
      });

      const modalEl = document.getElementById('adjustModal');
      const modalInst = bootstrap.Modal.getInstance(modalEl);
      if (modalInst) modalInst.hide();

      UI.showAlert('Stock adjusted successfully. Immutable movement logged.', 'success');
      await StockView.loadStockLedger();
    } catch (err) {
      UI.showAlert(err.message, 'danger');
    }
  }
};