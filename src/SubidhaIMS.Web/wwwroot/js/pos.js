const PosView = {
  cart: [],
  products: [],
  categories: [],
  selectedCategoryId: null,
  selectedCategoryName: null,
  customerSearchTimeout: null,
  selectedCustomer: null,

  render: async (container) => {
    container.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <!-- Left: Product Selection Panel (8 Columns) -->
        <div class="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
          
          <!-- Search & Barcode Scan Bar -->
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
            <div class="relative flex-1">
              <span class="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg">barcode_scanner</span>
              <input type="text" id="pos-search" 
                     oninput="PosView.handleSearch(this.value)"
                     onkeydown="PosView.handleBarcodeInput(event)"
                     class="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:outline-none"
                     placeholder="Search product name, SKU, or scan barcode [F2]...">
            </div>
          </div>

          <!-- Category Filter Pills -->
          <div class="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono font-bold" id="pos-category-pills">
            <!-- Dynamically populated -->
          </div>

          <!-- Product Cards Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[calc(100vh-270px)] overflow-y-auto pr-1" id="pos-product-grid">
            <div class="col-span-full py-16 text-center text-slate-400">
              <span class="material-symbols-outlined text-3xl animate-spin text-emerald-600 mb-2 leading-none">progress_activity</span>
              <div>Loading product catalog...</div>
            </div>
          </div>
        </div>

        <!-- Right: Current Cart & Checkout Panel (4 Columns) -->
        <div class="lg:col-span-5 xl:col-span-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col h-[calc(100vh-100px)] sticky top-20">
          
          <!-- Cart Header -->
          <div class="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-emerald-700 text-xl">shopping_cart</span>
              <h2 class="font-headline text-sm font-bold text-slate-900">Current Bill</h2>
            </div>
            <button onclick="PosView.clearCart()" 
                    class="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 transition-colors">
              <span class="material-symbols-outlined text-sm leading-none">delete_sweep</span>
              <span>Reset</span>
            </button>
          </div>

          <!-- Customer Lookup Section -->
          <div class="p-3 border-b border-slate-200 bg-slate-50/30 flex flex-col gap-2 text-xs">
            <div class="flex items-center justify-between">
              <span class="font-mono text-[10px] text-slate-500 font-bold uppercase tracking-wider">Customer</span>
              <span id="pos-customer-pan-badge" class="font-mono text-[10px] text-slate-400">Walk-in</span>
            </div>
            <div class="relative">
              <input type="text" id="pos-customer-input" 
                     oninput="PosView.handleCustomerSearch(this.value)"
                     class="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none"
                     placeholder="Walk-in Customer (or search Khata name/phone)...">
            </div>
          </div>

          <!-- Cart Line Items List -->
          <div class="flex-1 overflow-y-auto p-3 divide-y divide-slate-100" id="pos-cart-items">
            <div class="py-16 text-center text-slate-400">
              <span class="material-symbols-outlined text-4xl text-slate-300 block mb-1">production_quantity_limits</span>
              <span class="text-xs font-semibold text-slate-600">Cart is empty</span>
              <span class="text-[11px] text-slate-400 block mt-0.5">Click or scan items to add</span>
            </div>
          </div>

          <!-- Summary & Checkout Footer -->
          <div class="p-4 border-t border-slate-200 bg-slate-50/80 flex flex-col gap-3">
            <div class="flex flex-col gap-1 text-xs font-mono">
              <div class="flex justify-between text-slate-600">
                <span>Sub Total:</span>
                <span id="pos-subtotal" class="font-semibold text-slate-800">NPR 0.00</span>
              </div>
              <div class="flex justify-between text-slate-600">
                <span>Tax / VAT (13%):</span>
                <span id="pos-tax" class="font-semibold text-slate-800">NPR 0.00</span>
              </div>
              <div class="flex justify-between text-base font-bold text-slate-900 pt-1 border-t border-slate-200">
                <span>Grand Total:</span>
                <span id="pos-grand-total" class="text-emerald-800">NPR 0.00</span>
              </div>
            </div>

            <!-- Payment Method Radio Pills -->
            <div class="grid grid-cols-4 gap-1.5 pt-1 font-mono text-[11px] font-bold">
              <label class="cursor-pointer">
                <input type="radio" name="paymentMethod" value="Cash" checked class="peer sr-only">
                <div class="py-1.5 text-center rounded-lg border border-slate-200 bg-white peer-checked:bg-emerald-600 peer-checked:text-white peer-checked:border-emerald-600 transition-colors">
                  Cash
                </div>
              </label>
              <label class="cursor-pointer">
                <input type="radio" name="paymentMethod" value="QR" class="peer sr-only">
                <div class="py-1.5 text-center rounded-lg border border-slate-200 bg-white peer-checked:bg-emerald-600 peer-checked:text-white peer-checked:border-emerald-600 transition-colors">
                  QR
                </div>
              </label>
              <label class="cursor-pointer">
                <input type="radio" name="paymentMethod" value="Bank" class="peer sr-only">
                <div class="py-1.5 text-center rounded-lg border border-slate-200 bg-white peer-checked:bg-emerald-600 peer-checked:text-white peer-checked:border-emerald-600 transition-colors">
                  Bank
                </div>
              </label>
            </div>

            <!-- Finalize Checkout Trigger Button -->
            <button type="button" 
                    onclick="PosView.promptConfirmBill()"
                    id="pos-submit-btn"
                    class="w-full py-3 bg-slate-900 hover:bg-slate-800 active:bg-black text-white font-headline font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2">
              <span class="material-symbols-outlined text-lg leading-none">check_circle</span>
              <span>Finalize &amp; Print Bill</span>
            </button>
          </div>

        </div>

      </div>

      <!-- Bill Confirmation Modal Popup -->
      <div class="modal fade" id="confirmBillModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered" style="max-width: 440px;">
          <div class="modal-content rounded-xl border border-slate-300 shadow-2xl overflow-hidden bg-white">
            
            <div class="modal-header bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-emerald-700 text-xl leading-none">receipt_long</span>
                <h3 class="font-headline text-base font-bold text-slate-900">Confirm Transaction?</h3>
              </div>
              <button type="button" class="text-slate-400 hover:text-slate-600 p-1" data-bs-dismiss="modal">
                <span class="material-symbols-outlined text-lg leading-none">close</span>
              </button>
            </div>

            <div class="modal-body p-5 flex flex-col gap-4 text-xs">
              <div class="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex flex-col gap-2 font-mono">
                <div class="flex justify-between text-slate-600">
                  <span>Customer:</span>
                  <span id="confirm-customer-name" class="font-bold text-slate-900">Walk-in Customer</span>
                </div>
                <div class="flex justify-between text-slate-600">
                  <span>Payment Mode:</span>
                  <span id="confirm-payment-method" class="font-bold text-emerald-800">Cash</span>
                </div>
                <div class="flex justify-between text-slate-600">
                  <span>Total Items:</span>
                  <span id="confirm-total-items" class="font-bold text-slate-900">0</span>
                </div>
                <div class="flex justify-between items-center pt-2 border-t border-slate-200 text-sm">
                  <span class="font-bold text-slate-900 font-sans">Payable Total:</span>
                  <span id="confirm-grand-total" class="font-bold text-lg text-emerald-700">NPR 0.00</span>
                </div>
              </div>

              <div class="text-[11px] text-slate-500">
                Are you sure you want to commit this invoice and deduct units from local stock?
              </div>
            </div>

            <div class="modal-footer bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
              <button type="button" 
                      class="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition-colors" 
                      data-bs-dismiss="modal">
                No, Go Back
              </button>
              
              <button type="button" 
                      onclick="PosView.executeCheckout()" 
                      id="confirm-checkout-btn"
                      class="px-5 py-2 text-xs font-headline font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm transition-all flex items-center gap-1.5">
                <span class="material-symbols-outlined text-base leading-none">print</span>
                <span>Yes, Confirm &amp; Print</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    `;

    await PosView.loadCatalog();
  },

  loadCatalog: async () => {
    try {
      const [prods, cats] = await Promise.all([
        api.get('/products'),
        api.get('/catalog/categories?includeInactive=false').catch(() => api.get('/catalog/categories'))
      ]);

      PosView.products = prods || [];
      PosView.categories = (cats || []).filter(c => (c.isActive ?? c.IsActive ?? true));

      PosView.renderCategories();
      PosView.renderGrid();
    } catch (err) {
      console.error('Failed to load POS catalog:', err);
    }
  },

  renderCategories: () => {
    const pillsHost = document.getElementById('pos-category-pills');
    if (!pillsHost) return;

    const isAllSelected = PosView.selectedCategoryId === null;

    pillsHost.innerHTML = `
      <button type="button" 
              class="category-pill px-3.5 py-1.5 rounded-lg font-semibold whitespace-nowrap shadow-xs transition-colors cursor-pointer ${
                isAllSelected 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }" 
              onclick="PosView.filterCategory(null)">
        All Products
      </button>
      ${PosView.categories.map(c => {
        const isSelected = PosView.selectedCategoryId != null && PosView.selectedCategoryId == c.id;
        return `
          <button type="button" 
                  class="category-pill px-3.5 py-1.5 rounded-lg font-semibold whitespace-nowrap shadow-xs transition-colors cursor-pointer ${
                    isSelected 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }" 
                  onclick="PosView.filterCategory(${c.id})">
            ${c.name}
          </button>
        `;
      }).join('')}
    `;
  },

  filterCategory: (catId) => {
    PosView.selectedCategoryId = catId !== null && catId !== undefined ? parseInt(catId, 10) : null;
    const cat = PosView.categories.find(c => c.id == PosView.selectedCategoryId);
    PosView.selectedCategoryName = cat ? cat.name.toLowerCase() : null;

    PosView.renderCategories();
    const searchVal = document.getElementById('pos-search')?.value || '';
    PosView.renderGrid(searchVal);
  },

  handleSearch: (val) => {
    PosView.renderGrid(val);
  },

  handleBarcodeInput: (e) => {
    if (e.key === 'Enter') {
      const code = e.target.value.trim().toLowerCase();
      if (!code) return;

      const matched = PosView.products.find(p => 
        (p.barcode && p.barcode.toLowerCase() === code) || 
        p.sku.toLowerCase() === code
      );

      if (matched) {
        PosView.addToCart(matched.id);
        e.target.value = '';
        PosView.renderGrid('');
      }
    }
  },

  renderGrid: (search = '') => {
    const grid = document.getElementById('pos-product-grid');
    if (!grid) return;

    const query = (search || '').toLowerCase().trim();

    const filtered = PosView.products.filter(p => {
      const matchesSearch = !query || 
                            (p.name && p.name.toLowerCase().includes(query)) ||
                            (p.sku && p.sku.toLowerCase().includes(query)) ||
                            (p.barcode && p.barcode.toLowerCase().includes(query));

      let matchesCategory = true;
      if (PosView.selectedCategoryId !== null) {
        if (p.categoryId != null) {
          matchesCategory = (p.categoryId == PosView.selectedCategoryId);
        } else if (p.categoryName && PosView.selectedCategoryName) {
          matchesCategory = (p.categoryName.toLowerCase() === PosView.selectedCategoryName);
        }
      }

      return matchesSearch && matchesCategory;
    });

    if (!filtered.length) {
      grid.innerHTML = `
        <div class="col-span-full py-16 text-center text-slate-400">
          <span class="material-symbols-outlined text-3xl mb-1 text-slate-300">inventory_2</span>
          <div class="text-xs font-semibold text-slate-700">No products found</div>
          <div class="text-[11px] text-slate-400 mt-0.5">Try changing search query or category filter</div>
        </div>`;
      return;
    }

    grid.innerHTML = filtered.map(p => {
      const isOutOfStock = p.quantityOnHand <= 0;
      const isLowStock = p.quantityOnHand <= p.reorderLevel;

      return `
        <div onclick="${isOutOfStock ? '' : `PosView.addToCart(${p.id})`}" 
             class="group p-3 rounded-xl border border-slate-200 bg-white flex flex-col justify-between transition-all select-none ${
               isOutOfStock ? 'opacity-40 cursor-not-allowed bg-slate-50' : 'hover:border-emerald-500 hover:shadow-xs cursor-pointer active:scale-[0.98]'
             }">
          <div class="flex flex-col">
            <span class="font-bold text-xs text-slate-900 group-hover:text-emerald-700 line-clamp-2 leading-snug">
              ${p.name}
            </span>
            <span class="font-mono text-[10px] text-slate-500 font-medium mt-1">${p.sku}</span>
          </div>

          <div class="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
              isOutOfStock 
                ? 'bg-slate-100 text-slate-500' 
                : isLowStock 
                  ? 'bg-rose-50 text-rose-700 border border-rose-200/60' 
                  : 'bg-slate-100 text-slate-700'
            }">
              ${isOutOfStock ? 'No Stock' : `${p.quantityOnHand}${p.unitSymbol || 'pcs'}`}
            </span>
            <span class="font-mono text-xs font-bold text-slate-900">
              ${UI.formatMoney(p.defaultSellingPrice)}
            </span>
          </div>
        </div>
      `;
    }).join('');
  },

  addToCart: (productId) => {
    const prod = PosView.products.find(p => p.id === productId);
    if (!prod) return;

    const existing = PosView.cart.find(c => c.productId === productId);
    if (existing) {
      if (existing.quantity + 1 > prod.quantityOnHand) {
        return UI.showAlert(`Cannot add more. Only ${prod.quantityOnHand} units in stock.`, 'warning');
      }
      existing.quantity += 1;
    } else {
      PosView.cart.push({
        productId: prod.id,
        name: prod.name,
        sku: prod.sku,
        unitSymbol: prod.unitSymbol || 'pcs',
        // CRITICAL: unitPrice is mutable and tracks user edits
        unitPrice: Number(prod.defaultSellingPrice || 0),
        quantity: 1,
        maxStock: prod.quantityOnHand
      });
    }

    PosView.renderCart();
  },

  // CRITICAL FIX: Explicitly updates custom selling price on keystroke / change
  updateCartPrice: (productId, newPrice) => {
    const item = PosView.cart.find(c => c.productId === productId);
    if (!item) return;

    const parsed = parseFloat(newPrice);
    if (!isNaN(parsed) && parsed >= 0) {
      item.unitPrice = parsed;
    }
    PosView.renderCartTotalsOnly();
  },

  updateCartQty: (productId, newQty) => {
    const item = PosView.cart.find(c => c.productId === productId);
    if (!item) return;

    const parsed = parseFloat(newQty);
    if (isNaN(parsed) || parsed <= 0) {
      PosView.removeFromCart(productId);
      return;
    }

    if (parsed > item.maxStock) {
      UI.showAlert(`Warning: Stock quantity is ${item.maxStock}`, 'warning');
    }

    item.quantity = parsed;
    PosView.renderCart();
  },

  removeFromCart: (productId) => {
    PosView.cart = PosView.cart.filter(c => c.productId !== productId);
    PosView.renderCart();
  },

  clearCart: () => {
    PosView.cart = [];
    PosView.selectedCustomer = null;
    const custInput = document.getElementById('pos-customer-input');
    if (custInput) custInput.value = '';
    const panBadge = document.getElementById('pos-customer-pan-badge');
    if (panBadge) panBadge.innerText = 'Walk-in';
    PosView.renderCart();
  },

  renderCart: () => {
    const cartHost = document.getElementById('pos-cart-items');
    if (!cartHost) return;

    if (!PosView.cart.length) {
      cartHost.innerHTML = `
        <div class="py-16 text-center text-slate-400">
          <span class="material-symbols-outlined text-4xl text-slate-300 block mb-1">production_quantity_limits</span>
          <span class="text-xs font-semibold text-slate-600">Cart is empty</span>
          <span class="text-[11px] text-slate-400 block mt-0.5">Click or scan items to add</span>
        </div>`;
      PosView.renderCartTotalsOnly();
      return;
    }

    cartHost.innerHTML = PosView.cart.map(item => `
      <div class="py-2.5 flex flex-col gap-1.5">
        <div class="flex items-start justify-between gap-2">
          <div class="flex flex-col min-w-0">
            <span class="font-bold text-xs text-slate-900 truncate">${item.name}</span>
            <span class="font-mono text-[10px] text-slate-400">${item.sku}</span>
          </div>
          <button onclick="PosView.removeFromCart(${item.productId})" class="text-slate-400 hover:text-rose-600 p-0.5 rounded">
            <span class="material-symbols-outlined text-base leading-none">close</span>
          </button>
        </div>

        <div class="flex items-center justify-between gap-2 text-xs">
          <!-- Qty controls -->
          <div class="flex items-center border border-slate-200 rounded-md bg-white">
            <button onclick="PosView.updateCartQty(${item.productId}, ${item.quantity - 1})" class="px-2 py-0.5 text-slate-500 hover:bg-slate-100 rounded-l font-bold">−</button>
            <input type="number" step="any" min="1" value="${item.quantity}" 
                   onchange="PosView.updateCartQty(${item.productId}, this.value)"
                   class="w-12 text-center font-mono font-bold text-slate-900 border-none outline-none py-0.5 text-xs bg-transparent">
            <button onclick="PosView.updateCartQty(${item.productId}, ${item.quantity + 1})" class="px-2 py-0.5 text-slate-500 hover:bg-slate-100 rounded-r font-bold">+</button>
          </div>

          <!-- Custom Selling Price Input -->
          <div class="flex items-center gap-1 font-mono">
            <span class="text-[11px] text-slate-400">@</span>
            <input type="number" step="any" min="0" value="${item.unitPrice}" 
                   oninput="PosView.updateCartPrice(${item.productId}, this.value)"
                   title="Custom Rate"
                   class="w-20 px-1.5 py-0.5 border border-slate-200 rounded text-right font-mono font-bold text-slate-900 focus:border-emerald-600 focus:outline-none bg-slate-50 focus:bg-white text-xs">
          </div>

          <!-- Line Subtotal -->
          <span class="font-mono font-bold text-slate-900 text-right min-w-[70px]">
            ${UI.formatMoney(item.unitPrice * item.quantity)}
          </span>
        </div>
      </div>
    `).join('');

    PosView.renderCartTotalsOnly();
  },

  renderCartTotalsOnly: () => {
    const subtotal = PosView.cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    
    // Check if store is VAT-registered from cached business settings or default to 13%
    const isVatRegistered = SettingsView?.businessSettings?.isVatRegistered ?? true;
    const vatRate = isVatRegistered ? (SettingsView?.businessSettings?.defaultVatRate ?? 13) : 0;

    const tax = Math.round((subtotal * (vatRate / 100)) * 100) / 100;
    const grand = subtotal + tax; // 30,000 + 3,900 = 33,900

    const subEl = document.getElementById('pos-subtotal');
    const taxEl = document.getElementById('pos-tax');
    const grandEl = document.getElementById('pos-grand-total');

    if (subEl) subEl.innerText = UI.formatMoney(subtotal);
    if (taxEl) taxEl.innerText = UI.formatMoney(tax);
    if (grandEl) grandEl.innerText = UI.formatMoney(grand);
  },

  // Customer Autocomplete for Khata / Udharo
  handleCustomerSearch: (q) => {
    clearTimeout(PosView.customerSearchTimeout);
    const drop = document.getElementById('pos-customer-dropdown');
    if (!q || q.length < 2) {
      if (drop) drop.classList.add('hidden');
      return;
    }

    PosView.customerSearchTimeout = setTimeout(async () => {
      try {
        const results = await api.get(`/customers?query=${encodeURIComponent(q)}`).catch(() => []);
        if (!drop) return;

        if (!results || !results.length) {
          drop.innerHTML = `<div class="p-2 text-slate-400 text-xs">No customer matched. Will save as new.</div>`;
          drop.classList.remove('hidden');
          return;
        }

        drop.innerHTML = results.map(c => `
          <div onclick="PosView.selectCustomer(${JSON.stringify(c).replace(/"/g, '&quot;')})" 
               class="p-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 flex items-center justify-between">
            <div class="flex flex-col">
              <span class="font-bold text-slate-900 text-xs">${c.name}</span>
              <span class="font-mono text-[10px] text-slate-500">${c.phone || 'No phone'} ${c.panNumber ? '| PAN: ' + c.panNumber : ''}</span>
            </div>
            <span class="font-mono text-[11px] font-bold ${c.currentBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}">
              Udharo: ${UI.formatMoney(c.currentBalance)}
            </span>
          </div>
        `).join('');
        drop.classList.remove('hidden');
      } catch (err) {
        console.error(err);
      }
    }, 250);
  },

  selectCustomer: (cust) => {
    PosView.selectedCustomer = cust;
    const custInput = document.getElementById('pos-customer-input');
    if (custInput) custInput.value = cust.name;
    const panBadge = document.getElementById('pos-customer-pan-badge');
    if (panBadge) panBadge.innerText = cust.panNumber ? `PAN: ${cust.panNumber}` : (cust.phone || 'Account');

    const drop = document.getElementById('pos-customer-dropdown');
    if (drop) drop.classList.add('hidden');
  },

  // Prompt Confirmation Popup Modal
  promptConfirmBill: () => {
    if (!PosView.cart.length) {
      return UI.showAlert('Cart is empty. Add products before finalizing bill.', 'warning');
    }

    const grandTotalText = document.getElementById('pos-grand-total')?.innerText || 'NPR 0.00';
    const custName = document.getElementById('pos-customer-input')?.value.trim() || 'Walk-in Customer';
    const tender = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'Cash';
    const totalCount = PosView.cart.reduce((sum, item) => sum + item.quantity, 0);

    const cCust = document.getElementById('confirm-customer-name');
    const cPay = document.getElementById('confirm-payment-method');
    const cCount = document.getElementById('confirm-total-items');
    const cTotal = document.getElementById('confirm-grand-total');

    if (cCust) cCust.innerText = custName;
    if (cPay) cPay.innerText = tender === 'QR' ? 'QR' : (tender === 'Bank' ? 'Bank Transfer' : 'Cash');
    if (cCount) cCount.innerText = `${PosView.cart.length} line item(s) (${totalCount} units)`;
    if (cTotal) cTotal.innerText = grandTotalText;

    const modalEl = document.getElementById('confirmBillModal');
    new bootstrap.Modal(modalEl).show();
  },

  // Execute Actual Invoice Commit
executeCheckout: async () => {
    const confirmBtn = document.getElementById('confirm-checkout-btn');
    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.innerHTML = `<span class="material-symbols-outlined text-base animate-spin">progress_activity</span> Committing...`;
    }

    const tenderStr = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'Cash';
    const custName = document.getElementById('pos-customer-input')?.value.trim() || 'Walk-in Customer';

    // 0 = Cash, 1 = BankTransfer, 4 = Qr
    let paymentMethodEnum = 0;
    if (tenderStr === 'Bank') paymentMethodEnum = 1;
    else if (tenderStr === 'QR') paymentMethodEnum = 4;

    const subtotal = PosView.cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const isVatRegistered = SettingsView?.businessSettings?.isVatRegistered ?? true;
    const vatRate = isVatRegistered ? (SettingsView?.businessSettings?.defaultVatRate ?? 13) : 0;
    const taxTotal = Math.round((subtotal * (vatRate / 100)) * 100) / 100;
    const grandTotal = subtotal + taxTotal;

    const payload = {
      customerId: PosView.selectedCustomer ? PosView.selectedCustomer.id : null,
      customerNameSnapshot: custName,
      customerPanSnapshot: PosView.selectedCustomer ? (PosView.selectedCustomer.panNumber || null) : null,
      saleDate: new Date().toISOString(),
      paymentMethod: paymentMethodEnum,
      discountTotal: 0,
      paidAmount: grandTotal, // Always fully settled upfront
      notes: "Counter Retail Sale",
      lines: PosView.cart.map(item => ({
        productId: Number(item.productId),
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        taxRatePercent: vatRate
      }))
    };

    try {
      const sale = await api.post('/sales', payload);

      const modalEl = document.getElementById('confirmBillModal');
      const modalInstance = bootstrap.Modal.getInstance(modalEl);
      if (modalInstance) modalInstance.hide();

      UI.showAlert(`Invoice ${sale.invoiceNo || ''} posted successfully.`, 'success');

      PosView.printReceipt(sale.id || sale);
      PosView.clearCart();
      await PosView.loadCatalog();
    } catch (err) {
      console.error('Checkout failed:', err);
      const modalEl = document.getElementById('confirmBillModal');
      const modalInstance = bootstrap.Modal.getInstance(modalEl);
      if (modalInstance) modalInstance.hide();

      UI.showAlert(err.message || 'Transaction rejected by server.', 'danger');
    } finally {
      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = `
          <span class="material-symbols-outlined text-base leading-none">print</span>
          <span>Yes, Confirm &amp; Print</span>
        `;
      }
    }
  },

printReceipt: async (saleId) => {
    try {
      const sale = typeof saleId === 'object' ? saleId : await api.get(`/sales/${saleId}`);
      const bus = await api.get('/settings/business').catch(() => ({ businessName: 'Subidha IMS' }));

      const container = document.getElementById('print-container');
      if (!container) return;

      const lines = sale.lines || sale.Lines || [];

      // Format payment tender display cleanly
      const rawPayment = String(sale.paymentMethod || sale.PaymentMethod || 'Cash');
      let displayPayment = 'Cash';
      if (rawPayment === '4' || rawPayment.toLowerCase().includes('fonepay') || rawPayment.toLowerCase().includes('esewa') || rawPayment.toLowerCase() === 'qr') {
        displayPayment = 'QR';
      } else if (rawPayment === '1' || rawPayment.toLowerCase().includes('bank')) {
        displayPayment = 'Bank Transfer';
      }

      container.innerHTML = `
        <div class="print-header">
          <div style="font-weight: bold; font-size: 13px;">${bus.businessName || 'Subidha IMS'}</div>
          <div>${bus.address || 'Kathmandu, Nepal'}</div>
          <div>Tel: ${bus.phone || '—'} | PAN: ${bus.panNumber || '—'}</div>
          <div style="margin-top: 4px; font-weight: bold;">TAX INVOICE / बिल</div>
          <div style="text-align: left; margin-top: 4px; font-size: 11px;">
            Bill No: ${sale.invoiceNo || sale.InvoiceNo}<br>
            Date: ${new Date(sale.saleDate || sale.dateGregorian || Date.now()).toLocaleString('en-GB')}<br>
            Buyer: ${sale.customerName || sale.CustomerName || 'Walk-in'}<br>
            Payment: <strong>${displayPayment}</strong>
          </div>
        </div>
        <table class="print-table" style="width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 11px;">
          <thead>
            <tr style="border-bottom: 1px dashed #000;">
              <th align="left">Item</th>
              <th align="center">Qty</th>
              <th align="right">Rate</th>
              <th align="right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${lines.map(it => {
              const name = it.productName || it.name || it.ProductName || it.Name || 'Item';
              const qty = Number(it.quantity || it.Quantity || 0);
              const rate = Number(it.unitPrice || it.UnitPrice || 0);
              const total = it.lineTotal ?? it.LineTotal ?? (qty * rate);
              return `
                <tr>
                  <td>${name}</td>
                  <td align="center">${qty}</td>
                  <td align="right">${rate.toFixed(2)}</td>
                  <td align="right">${Number(total).toFixed(2)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        <div class="print-footer" style="margin-top: 8px; border-top: 1px dashed #000; padding-top: 4px; font-size: 11px;">
          <div style="display: flex; justify-content: space-between;">
            <span>Taxable Amount:</span>
            <span>NPR ${Number(sale.subTotal || (sale.grandTotal - (sale.taxTotal || 0))).toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>VAT (13%):</span>
            <span>NPR ${Number(sale.taxTotal || 0).toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 12px; margin-top: 2px; border-top: 1px solid #000; padding-top: 2px;">
            <span>Grand Total:</span>
            <span>NPR ${Number(sale.grandTotal).toFixed(2)}</span>
          </div>
          <div style="margin-top: 6px; text-align: center;">Thank You! Visit Again.</div>
        </div>
      `;

      window.print();
    } catch (err) {
      console.error('Print failure:', err);
    }
  }
};