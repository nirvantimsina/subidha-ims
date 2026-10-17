const PurchasesView = {
  products: [],
  suppliers: [],

  render: async (container) => {
    container.innerHTML = `
      <div class="flex flex-col gap-6">

        <!-- Top Command Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-1.5 font-mono text-xs text-slate-500 uppercase tracking-wider">
              <span>Inventory</span>
              <span class="material-symbols-outlined text-[12px]">chevron_right</span>
              <span class="text-emerald-700 font-semibold">खरिद खाता</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-emerald-700 text-2xl">local_shipping</span>
              <h1 class="font-headline text-2xl font-bold text-slate-900 tracking-tight">Purchase Book</h1>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2">
            <button onclick="PurchasesView.exportCsv()" 
                    class="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-xs transition-colors">
              <span class="material-symbols-outlined text-base text-emerald-600">table_view</span>
              <span>Export CSV</span>
            </button>
            <button onclick="PurchasesView.showAddModal()" 
                    class="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold font-headline rounded-lg shadow-sm shadow-emerald-500/20 transition-all">
              <span class="material-symbols-outlined text-base">add_circle</span>
              <span>Record Supplier Bill</span>
            </button>
          </div>
        </div>

        <!-- Purchases Register Table Card -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div class="p-4 px-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-slate-500 text-lg">receipt</span>
              <h2 class="font-headline text-sm font-bold text-slate-900">Inward Invoices Log</h2>
            </div>
            <span class="font-mono text-xs text-slate-500">Auto-updates AVCO stock</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead class="bg-slate-50/80 text-slate-600 font-mono text-[11px] uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th class="py-3 px-4">Internal Ref</th>
                  <th class="py-3 px-4">Supplier Bill #</th>
                  <th class="py-3 px-4">Supplier Name</th>
                  <th class="py-3 px-4">Inward Date</th>
                  <th class="py-3 px-4 text-right">Grand Total (NPR)</th>
                  <th class="py-3 px-4 text-center">Payment Status</th>
                </tr>
              </thead>
              <tbody id="purchases-tbody" class="divide-y divide-slate-100 text-slate-800">
                <tr>
                  <td colspan="6" class="text-center py-12 text-slate-400">
                    <span class="material-symbols-outlined text-3xl animate-spin text-emerald-600 mb-2">progress_activity</span>
                    <div>Loading purchase registers...</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <!-- Inward Purchase Bill Modal -->
      <div class="modal fade" id="purchaseModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered">
          <div class="modal-content rounded-xl border border-slate-200 shadow-xl overflow-hidden">
            
            <div class="modal-header bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-emerald-700 text-xl">inventory</span>
                <h3 class="font-headline text-base font-bold text-slate-900">Inward Purchase Bill Entry</h3>
              </div>
              <button type="button" class="text-slate-400 hover:text-slate-600 p-1" data-bs-dismiss="modal">
                <span class="material-symbols-outlined text-lg leading-none">close</span>
              </button>
            </div>

            <div class="modal-body p-6 flex flex-col gap-5">
              
              <!-- Supplier & Bill Number Inputs -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Supplier / Distributor *</label>
                  <select id="pur-supplier-id" 
                          class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none">
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Supplier Bill Number *</label>
                  <input type="text" id="pur-bill-no" 
                         class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:outline-none" 
                         placeholder="e.g. HTD-1029">
                </div>
              </div>

              <!-- Lines Table Container -->
              <div class="flex flex-col gap-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-semibold text-slate-700 uppercase tracking-wider">Line Items</span>
                  <button type="button" onclick="PurchasesView.addLine()" 
                          class="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800">
                    <span class="material-symbols-outlined text-sm">add</span>
                    <span>Add Item Line</span>
                  </button>
                </div>

                <div class="border border-slate-200 rounded-lg overflow-x-auto max-h-[40vh]">
                  <table class="w-full text-left text-xs border-collapse">
                    <thead class="bg-slate-50 text-slate-600 font-mono text-[10px] uppercase tracking-wider border-b border-slate-200 sticky top-0">
                      <tr>
                        <th class="py-2.5 px-3">Product</th>
                        <th class="py-2.5 px-2 w-28 text-center">Inward Qty</th>
                        <th class="py-2.5 px-2 w-32 text-right">Unit Cost (NPR)</th>
                        <th class="py-2.5 px-2 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody id="pur-modal-lines" class="divide-y divide-slate-100 text-slate-800">
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            <div class="modal-footer bg-slate-50/60 px-6 py-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button type="button" class="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors" data-bs-dismiss="modal">
                Cancel
              </button>
              <button type="button" onclick="PurchasesView.savePurchase()" 
                      class="px-5 py-2 text-xs font-headline font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm shadow-emerald-500/20 transition-all flex items-center gap-1.5">
                <span class="material-symbols-outlined text-base">check</span>
                <span>Post &amp; Update Stock</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    `;

    await PurchasesView.loadPurchases();
  },

  loadPurchases: async () => {
    try {
      const list = await api.get('/purchases');
      const tbody = document.getElementById('purchases-tbody');
      if (!tbody) return;

      if (!list || !list.length) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" class="text-center py-12 text-slate-400">
              <span class="material-symbols-outlined text-3xl text-slate-300 block mb-1">inventory_2</span>
              <div class="text-xs font-medium text-slate-600">No purchases recorded yet</div>
              <div class="text-[11px]">Click "Record Supplier Bill" to receive items</div>
            </td>
          </tr>`;
        return;
      }

      tbody.innerHTML = list.map(p => `
        <tr class="hover:bg-slate-50/70 transition-colors">
          <td class="py-3 px-4 font-mono font-bold text-slate-900">${p.purchaseNo}</td>
          <td class="py-3 px-4 font-mono text-slate-600">${p.supplierBillNo}</td>
          <td class="py-3 px-4 font-semibold text-slate-900">${p.supplierName}</td>
          <td class="py-3 px-4 font-mono text-slate-600">${UI.formatDate(p.purchaseDate)}</td>
          <td class="py-3 px-4 text-right font-mono font-bold text-slate-900">${UI.formatMoney(p.grandTotal)}</td>
          <td class="py-3 px-4 text-center">
            <span class="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
              p.paymentStatus === 'Paid'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                : 'bg-amber-50 text-amber-800 border border-amber-200/60'
            }">
              ${p.paymentStatus}
            </span>
          </td>
        </tr>
      `).join('');
    } catch (err) {
      console.error('Failed to load purchases:', err);
    }
  },

  exportCsv: async () => {
    try {
      const purchases = await api.get('/purchases');
      if (!purchases || !purchases.length) {
        return UI.showAlert('No purchase records to export', 'warning');
      }

      const headers = [
        'Internal Ref',
        'Supplier Bill #',
        'Supplier Name',
        'Date',
        'Payment Method',
        'Payment Status',
        'Grand Total (NPR)'
      ];

      const rows = purchases.map(p => [
        p.purchaseNo,
        p.supplierBillNo,
        p.supplierName,
        p.purchaseDate.slice(0, 10),
        p.paymentMethod,
        p.paymentStatus,
        p.grandTotal.toFixed(2)
      ]);

      Exporter.toCsv('Purchase_Register_Nepal', headers, rows);
    } catch (err) {
      UI.showAlert(err.message, 'danger');
    }
  },

  showAddModal: async () => {
    try {
      const [suppliers, products] = await Promise.all([
        api.get('/suppliers'),
        api.get('/products')
      ]);

      PurchasesView.suppliers = suppliers;
      PurchasesView.products = products;

      const supSelect = document.getElementById('pur-supplier-id');
      if (supSelect) {
        supSelect.innerHTML = suppliers.map(s => 
          `<option value="${s.id}">${s.name} ${s.panNumber ? `(PAN: ${s.panNumber})` : ''}</option>`
        ).join('');
      }

      const linesTbody = document.getElementById('pur-modal-lines');
      if (linesTbody) {
        linesTbody.innerHTML = '';
        PurchasesView.addLine();
      }

      const billInput = document.getElementById('pur-bill-no');
      if (billInput) billInput.value = '';

      new bootstrap.Modal(document.getElementById('purchaseModal')).show();
    } catch (err) {
      UI.showAlert('Failed to initialize purchase form: ' + err.message, 'danger');
    }
  },

  addLine: () => {
    const tbody = document.getElementById('pur-modal-lines');
    if (!tbody) return;

    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50/50';
    tr.innerHTML = `
      <td class="py-2 px-3">
        <select class="pur-prod-select w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs font-medium text-slate-800 focus:border-emerald-600 focus:outline-none">
          ${PurchasesView.products.map(p => `<option value="${p.id}">${p.name} (${p.sku})</option>`).join('')}
        </select>
      </td>
      <td class="py-2 px-2 text-center">
        <input type="number" step="any" min="0.001" value="1" 
               class="pur-qty w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-center font-mono text-xs font-bold text-slate-900 focus:border-emerald-600 focus:outline-none">
      </td>
      <td class="py-2 px-2 text-right">
        <input type="number" step="any" min="0" value="0" 
               class="pur-cost w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-right font-mono text-xs font-bold text-slate-900 focus:border-emerald-600 focus:outline-none">
      </td>
      <td class="py-2 px-2 text-center">
        <button type="button" onclick="this.closest('tr').remove()" 
                class="text-slate-400 hover:text-rose-600 p-1 transition-colors" title="Remove line">
          <span class="material-symbols-outlined text-base leading-none">delete</span>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  },

  savePurchase: async () => {
    const supplierSelect = document.getElementById('pur-supplier-id');
    const billInput = document.getElementById('pur-bill-no');

    const supplierId = parseInt(supplierSelect?.value || '0');
    const billNo = billInput?.value.trim() || '';

    const lines = [];
    document.querySelectorAll('#pur-modal-lines tr').forEach(tr => {
      const prodSelect = tr.querySelector('.pur-prod-select');
      const qtyInput = tr.querySelector('.pur-qty');
      const costInput = tr.querySelector('.pur-cost');

      if (prodSelect && qtyInput && costInput) {
        lines.push({
          productId: parseInt(prodSelect.value),
          quantity: parseFloat(qtyInput.value) || 0,
          unitCost: parseFloat(costInput.value) || 0,
          taxRatePercent: 0
        });
      }
    });

    if (!supplierId) return UI.showAlert('Please select a valid supplier.', 'warning');
    if (!billNo) return UI.showAlert('Supplier Bill Number is required.', 'warning');
    if (!lines.length) return UI.showAlert('At least one item line is required.', 'warning');

    const invalidLine = lines.find(l => l.quantity <= 0);
    if (invalidLine) return UI.showAlert('Quantities must be greater than zero.', 'warning');

    const totalCost = lines.reduce((s, l) => s + (l.quantity * l.unitCost), 0);

    try {
      await api.post('/purchases', {
        supplierId,
        supplierBillNo: billNo,
        purchaseDate: new Date().toISOString(),
        paymentMethod: 1, // Cash
        paidAmount: totalCost,
        lines
      });

      const modalEl = document.getElementById('purchaseModal');
      const modalInst = bootstrap.Modal.getInstance(modalEl);
      if (modalInst) modalInst.hide();

      UI.showAlert('Purchase bill inwarded! Weighted average cost updated.', 'success');
      await PurchasesView.loadPurchases();
    } catch (err) {
      UI.showAlert(err.message, 'danger');
    }
  }
};