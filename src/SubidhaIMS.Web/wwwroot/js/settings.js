const SettingsView = {
  currentTab: "store",
  categories: [],
  units: [],
  suppliers: [],
  cachedProducts: [],
  businessSettings: null,

  render: async (container) => {
    container.innerHTML = `
      <div class="flex flex-col gap-6">

        <!-- Command Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-1.5 font-mono text-xs text-slate-500 uppercase tracking-wider font-semibold">
              <span>Configuration</span>
              <span class="material-symbols-outlined text-[13px] text-slate-400">chevron_right</span>
              <span class="text-emerald-700 font-bold">मास्टर सेटअप</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-emerald-700 text-2xl">tune</span>
              <h1 class="font-headline text-2xl font-bold text-slate-900 tracking-tight">Settings &amp; Master Setup</h1>
            </div>
          </div>
        </div>

        <!-- Settings Navigation Tabs -->
        <div class="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-mono font-bold">
          <button id="tab-btn-store" onclick="SettingsView.switchTab('store')"
                  class="flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-colors bg-slate-900 text-white">
            <span class="material-symbols-outlined text-base leading-none">storefront</span>
            <span>Store Profile &amp; Tax</span>
          </button>
          <button id="tab-btn-products" onclick="SettingsView.switchTab('products')"
                  class="flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-colors bg-slate-100 text-slate-600 hover:bg-slate-200">
            <span class="material-symbols-outlined text-base leading-none">inventory_2</span>
            <span>Items &amp; Low-Stock</span>
          </button>
          <button id="tab-btn-categories" onclick="SettingsView.switchTab('categories')"
                  class="flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-colors bg-slate-100 text-slate-600 hover:bg-slate-200">
            <span class="material-symbols-outlined text-base leading-none">category</span>
            <span>Categories</span>
          </button>
          <button id="tab-btn-suppliers" onclick="SettingsView.switchTab('suppliers')"
                  class="flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-colors bg-slate-100 text-slate-600 hover:bg-slate-200">
            <span class="material-symbols-outlined text-base leading-none">local_shipping</span>
            <span>Suppliers Directory</span>
          </button>
        </div>

        <!-- Dynamic Tab Body Host -->
        <div id="settings-tab-host">
          <div class="text-center py-12 text-slate-400 font-mono text-xs">Loading settings...</div>
        </div>

      </div>

      <!-- Product Modal -->
      <div class="modal fade" id="productModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered">
          <div class="modal-content rounded-xl border border-slate-200 shadow-xl overflow-hidden">
            <div class="modal-header bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 class="font-headline text-base font-bold text-slate-900" id="productModalTitle">Add New Product</h3>
              <button type="button" class="text-slate-400 hover:text-slate-600 p-1" data-bs-dismiss="modal">
                <span class="material-symbols-outlined text-lg leading-none">close</span>
              </button>
            </div>
            <div class="modal-body p-6 flex flex-col gap-4 text-xs">
              <input type="hidden" id="prod-id">
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div class="sm:col-span-2">
                  <label class="block font-semibold text-slate-600 uppercase tracking-wider mb-1">Product Name *</label>
                  <input type="text" id="prod-name" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none" placeholder="e.g. 20W Fast USB-C Adapter" required>
                </div>
                <div>
                  <label class="block font-semibold text-slate-600 uppercase tracking-wider mb-1">SKU / Code *</label>
                  <div class="flex gap-1.5">
                    <input type="text" id="prod-sku" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none" placeholder="e.g. ADP-20W" required>
                    <button type="button" onclick="SettingsView.generateSku()" class="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-700 font-bold">Auto</button>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="block font-semibold text-slate-600 uppercase tracking-wider mb-1">Barcode / Scan Code</label>
                  <input type="text" id="prod-barcode" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none" placeholder="Optional barcode">
                </div>
                <div>
                  <label class="block font-semibold text-slate-600 uppercase tracking-wider mb-1">Category *</label>
                  <select id="prod-category" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"></select>
                </div>
                <div>
                  <label class="block font-semibold text-slate-600 uppercase tracking-wider mb-1">Unit *</label>
                  <select id="prod-unit" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"></select>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="block font-semibold text-slate-600 uppercase tracking-wider mb-1">Standard Selling Price (NPR)</label>
                  <input type="number" id="prod-selling-price" step="any" min="0" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none" placeholder="0.00">
                  <span class="text-[10px] text-slate-400 mt-0.5 block">Can be edited during POS checkout</span>
                </div>
                <div>
                  <label class="block font-semibold text-rose-700 uppercase tracking-wider mb-1">Low-Stock Alert Level *</label>
                  <input type="number" id="prod-reorder-level" min="0" value="5" class="w-full px-3 py-2 bg-rose-50/40 border border-rose-300 rounded-lg font-mono font-bold text-rose-800 focus:bg-white focus:border-rose-600 focus:outline-none" required>
                  <span class="text-[10px] text-slate-400 mt-0.5 block">Alerts dashboard when stock &le; this number</span>
                </div>
                <div>
                  <label class="block font-semibold text-slate-600 uppercase tracking-wider mb-1">Reference Cost (NPR)</label>
                  <input type="number" id="prod-purchase-cost" step="any" min="0" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none" placeholder="0.00">
                  <span class="text-[10px] text-slate-400 mt-0.5 block">Actual purchase price comes from bills</span>
                </div>
              </div>

              <div>
                <label class="block font-semibold text-slate-600 uppercase tracking-wider mb-1">Item Notes / Specs</label>
                <textarea id="prod-description" rows="2" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none" placeholder="Rack shelf, warranty info, or specs..."></textarea>
              </div>
            </div>
            <div class="modal-footer bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end gap-2">
              <button type="button" class="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg" data-bs-dismiss="modal">Cancel</button>
              <button type="button" onclick="SettingsView.saveProduct()" class="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm">Save Product</button>
            </div>
          </div>
        </div>
      </div>
<!-- Category Modal -->
      <div class="modal fade" id="categoryModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered" style="max-width: 440px;">
          <div class="modal-content rounded-xl border border-slate-200 shadow-xl overflow-hidden">
            <div class="modal-header bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
              <h3 class="font-headline text-sm font-bold text-slate-900" id="catModalTitle">Add Item Category</h3>
              <button type="button" class="text-slate-400 hover:text-slate-600 p-1" data-bs-dismiss="modal">
                <span class="material-symbols-outlined text-lg leading-none">close</span>
              </button>
            </div>
            <div class="modal-body p-5 flex flex-col gap-3">
              <input type="hidden" id="cat-id">
              <div>
                <label class="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Category Name *</label>
                <input type="text" id="cat-name" 
                       class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none" 
                       placeholder="e.g. Chargers &amp; Cables" required>
              </div>

              <!-- Status Toggle -->
              <div id="cat-status-row" class="pt-1">
                <label class="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" id="cat-is-active" checked 
                         class="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500">
                  <span class="text-xs font-bold text-slate-800">Active (Visible in POS &amp; Catalog)</span>
                </label>
                <span class="text-[10px] text-slate-400 block ml-6">Inactive categories cannot be assigned to new items.</span>
              </div>
            </div>
            <div class="modal-footer bg-slate-50 px-5 py-2.5 border-t border-slate-200 flex justify-end gap-2">
              <button type="button" class="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg" data-bs-dismiss="modal">Cancel</button>
              <button type="button" onclick="SettingsView.saveCategory()" 
                      class="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm">Save Category</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Supplier Modal -->
      <div class="modal fade" id="supplierModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content rounded-xl border border-slate-200 shadow-xl overflow-hidden">
            <div class="modal-header bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 class="font-headline text-base font-bold text-slate-900" id="supplierModalTitle">Add Supplier</h3>
              <button type="button" class="text-slate-400 hover:text-slate-600 p-1" data-bs-dismiss="modal">
                <span class="material-symbols-outlined text-lg leading-none">close</span>
              </button>
            </div>
            <div class="modal-body p-6 flex flex-col gap-3 text-xs">
              <input type="hidden" id="sup-id">
              <div>
                <label class="block font-semibold text-slate-600 uppercase tracking-wider mb-1">Distributor / Supplier Name *</label>
                <input type="text" id="sup-name" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none" placeholder="e.g. Apex Electronics Distributors Pvt. Ltd." required>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-semibold text-slate-600 uppercase tracking-wider mb-1">Contact Person</label>
                  <input type="text" id="sup-contact" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none" placeholder="Agent / Manager name">
                </div>
                <div>
                  <label class="block font-semibold text-slate-600 uppercase tracking-wider mb-1">Phone Number</label>
                  <input type="text" id="sup-phone" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none" placeholder="e.g. 9851000000">
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-semibold text-slate-600 uppercase tracking-wider mb-1">PAN / VAT Number</label>
                  <input type="text" id="sup-pan" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none" placeholder="9-digit PAN">
                </div>
                <div>
                  <label class="block font-semibold text-slate-600 uppercase tracking-wider mb-1">Address / Bazaar</label>
                  <input type="text" id="sup-address" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none" placeholder="City / Street">
                </div>
              </div>
            </div>
            <div class="modal-footer bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end gap-2">
              <button type="button" class="px-4 py-2 text-xs font-semibold text-slate-600" data-bs-dismiss="modal">Cancel</button>
              <button type="button" onclick="SettingsView.saveSupplier()" class="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm">Save Supplier</button>
            </div>
          </div>
        </div>
      </div>
    `;

    await SettingsView.loadLookups();
    await SettingsView.switchTab("store");
  },

  loadLookups: async () => {
    try {
      const [cats, units, sups, bus] = await Promise.all([
        api.get("/catalog/categories"),
        api.get("/catalog/units"),
        api.get("/suppliers"),
        api.get("/settings/business"),
      ]);
      SettingsView.categories = cats;
      SettingsView.units = units;
      SettingsView.suppliers = sups;
      SettingsView.businessSettings = bus;
    } catch (err) {
      console.error("Failed to load settings lookups:", err);
    }
  },

  switchTab: async (tab) => {
    SettingsView.currentTab = tab;
    ["store", "products", "categories", "suppliers"].forEach((t) => {
      const btn = document.getElementById(`tab-btn-${t}`);
      if (btn) {
        if (t === tab) {
          btn.className =
            "flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-colors bg-slate-900 text-white";
        } else {
          btn.className =
            "flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-colors bg-slate-100 text-slate-600 hover:bg-slate-200";
        }
      }
    });

    const host = document.getElementById("settings-tab-host");
    if (!host) return;

    if (tab === "store") await SettingsView.renderStoreTab(host);
    else if (tab === "products") await SettingsView.renderProductsTab(host);
    else if (tab === "categories") await SettingsView.renderCategoriesTab(host);
    else if (tab === "suppliers") await SettingsView.renderSuppliersTab(host);
  },

  // 1. STORE PROFILE TAB
  renderStoreTab: async (host) => {
    const s =
      SettingsView.businessSettings || (await api.get("/settings/business"));
    SettingsView.businessSettings = s;

    host.innerHTML = `
      <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-xs max-w-2xl flex flex-col gap-4 text-xs">
        <div class="border-b border-slate-100 pb-3">
          <h2 class="font-headline text-base font-bold text-slate-900">Shop Profile &amp; Billing Identity</h2>
          <p class="text-slate-500 text-[11px] mt-0.5">Prints on sales invoices, thermal bills, and tax returns.</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="sm:col-span-2">
            <label class="block font-semibold text-slate-600 uppercase tracking-wider mb-1">Business / Store Name *</label>
            <input type="text" id="store-name" value="${s.businessName || ""}" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none" required>
          </div>
          <div>
            <label class="block font-semibold text-slate-600 uppercase tracking-wider mb-1">PAN / VAT Number *</label>
            <input type="text" id="store-pan" value="${s.panNumber || ""}" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none">
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-semibold text-slate-600 uppercase tracking-wider mb-1">Address / Location</label>
            <input type="text" id="store-address" value="${s.address || ""}" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none">
          </div>
          <div>
            <label class="block font-semibold text-slate-600 uppercase tracking-wider mb-1">Phone Number(s)</label>
            <input type="text" id="store-phone" value="${s.phone || ""}" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none">
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-semibold text-slate-600 uppercase tracking-wider mb-1">Email Address</label>
            <input type="email" id="store-email" value="${s.email || ""}" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none">
          </div>
          <div>
            <label class="block font-semibold text-slate-600 uppercase tracking-wider mb-1">Default VAT Rate (%)</label>
            <input type="number" id="store-vat-rate" value="${s.defaultVatRate || 13}" min="0" max="100" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none">
          </div>
        </div>

        <div class="pt-2">
          <label class="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" id="store-vat-registered" ${s.isVatRegistered ? "checked" : ""} class="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500">
            <span class="font-bold text-slate-900">VAT Registered Store (Issues 13% Tax Invoices)</span>
          </label>
          <span class="text-[11px] text-slate-400 block ml-6">Toggle off if your shop operates under standard PAN threshold.</span>
        </div>

        <div class="pt-3 border-t border-slate-100 flex justify-start">
          <button onclick="SettingsView.saveStoreProfile()" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5">
            <span class="material-symbols-outlined text-base leading-none">save</span>
            <span>Save Store Settings</span>
          </button>
        </div>
      </div>
    `;
  },

  saveStoreProfile: async () => {
    const businessName = document.getElementById("store-name").value.trim();
    const panNumber = document.getElementById("store-pan").value.trim() || null;
    const address =
      document.getElementById("store-address").value.trim() || null;
    const phone = document.getElementById("store-phone").value.trim() || null;
    const email = document.getElementById("store-email").value.trim() || null;
    const defaultVatRate =
      parseFloat(document.getElementById("store-vat-rate").value) || 13;
    const isVatRegistered = document.getElementById(
      "store-vat-registered",
    ).checked;

    if (!businessName)
      return UI.showAlert("Store name is required.", "warning");

    try {
      const updated = await api.put("/settings/business", {
        businessName,
        address,
        phone,
        email,
        panNumber,
        isVatRegistered,
        defaultVatRate,
      });

      SettingsView.businessSettings = updated;
      const sidebarName = document.getElementById("sidebar-shop-name");
      if (sidebarName) sidebarName.innerText = updated.businessName;

      UI.showAlert("Store profile updated successfully.", "success");
    } catch (err) {
      UI.showAlert(err.message, "danger");
    }
  },

  // 2. PRODUCTS TAB
  renderProductsTab: async (host) => {
    host.innerHTML = `
      <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="p-4 px-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
          <div class="relative flex-1 max-w-sm">
            <span class="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-base">search</span>
            <input type="text" id="settings-prod-search" class="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none" placeholder="Search product or SKU...">
          </div>
          <button onclick="SettingsView.showProductModal()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 self-start sm:self-auto">
            <span class="material-symbols-outlined text-base leading-none">add</span>
            <span>Add New Product</span>
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-slate-50 text-slate-600 font-mono text-[11px] uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th class="py-3 px-4">SKU</th>
                <th class="py-3 px-4">Product Name</th>
                <th class="py-3 px-3">Category</th>
                <th class="py-3 px-3 text-right">Standard Price</th>
                <th class="py-3 px-3 text-center">Stock</th>
                <th class="py-3 px-3 text-center">Low-Stock Alert</th>
                <th class="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody id="settings-products-tbody" class="divide-y divide-slate-100 text-slate-800">
              <tr><td colspan="7" class="text-center py-8 text-slate-400 font-mono">Loading products...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    await SettingsView.loadProductsList();
    document
      .getElementById("settings-prod-search")
      ?.addEventListener("input", (e) => {
        SettingsView.filterProducts(e.target.value);
      });
  },

  loadProductsList: async () => {
    SettingsView.cachedProducts = await api.get("/products");
    SettingsView.renderProductsTable(SettingsView.cachedProducts);
  },

  filterProducts: (query) => {
    const q = query.toLowerCase().trim();
    const filtered = SettingsView.cachedProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)),
    );
    SettingsView.renderProductsTable(filtered);
  },

  renderProductsTable: (products) => {
    const tbody = document.getElementById("settings-products-tbody");
    if (!tbody) return;

    if (!products.length) {
      tbody.innerHTML =
        '<tr><td colspan="7" class="text-center py-8 text-slate-400 font-mono">No products found.</td></tr>';
      return;
    }

    tbody.innerHTML = products
      .map((p) => {
        const isLow = p.quantityOnHand <= p.reorderLevel;
        return `
        <tr class="hover:bg-slate-50 transition-colors">
          <td class="py-3 px-4 font-mono font-bold text-slate-900">${p.sku}</td>
          <td class="py-3 px-4 font-bold text-slate-900">${p.name}</td>
          <td class="py-3 px-3"><span class="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium">${p.categoryName}</span></td>
          <td class="py-3 px-3 text-right font-mono font-bold text-slate-900">${UI.formatMoney(p.defaultSellingPrice)}</td>
          <td class="py-3 px-3 text-center font-mono font-bold">
            <span class="inline-block px-2 py-0.5 rounded text-xs ${isLow ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-slate-100 text-slate-700"}">
              ${p.quantityOnHand} ${p.unitSymbol}
            </span>
          </td>
          <td class="py-3 px-3 text-center font-mono">
            <span class="inline-block px-2 py-0.5 rounded text-xs bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
              &le; ${p.reorderLevel} ${p.unitSymbol}
            </span>
          </td>
          <td class="py-3 px-4 text-center">
            <button onclick="SettingsView.editProduct(${p.id})" class="p-1 rounded text-slate-400 hover:text-emerald-700 hover:bg-slate-100 transition-colors" title="Edit Product">
              <span class="material-symbols-outlined text-base leading-none">edit</span>
            </button>
          </td>
        </tr>
      `;
      })
      .join("");
  },

  showProductModal: (prod = null) => {
    document.getElementById("productModalTitle").innerText = prod
      ? "Edit Product"
      : "Add New Product";
    document.getElementById("prod-id").value = prod ? prod.id : "";
    document.getElementById("prod-name").value = prod ? prod.name : "";
    document.getElementById("prod-sku").value = prod ? prod.sku : "";
    document.getElementById("prod-barcode").value = prod
      ? prod.barcode || ""
      : "";
    document.getElementById("prod-selling-price").value = prod
      ? prod.defaultSellingPrice
      : "";
    document.getElementById("prod-purchase-cost").value = prod
      ? prod.defaultPurchaseCost
      : "0";
    document.getElementById("prod-reorder-level").value = prod
      ? prod.reorderLevel
      : "5";
    document.getElementById("prod-description").value = prod
      ? prod.description || ""
      : "";

    const catSelect = document.getElementById("prod-category");
    catSelect.innerHTML = SettingsView.categories
      .map(
        (c) =>
          `<option value="${c.id}" ${prod && prod.categoryId === c.id ? "selected" : ""}>${c.name}</option>`,
      )
      .join("");

    const unitSelect = document.getElementById("prod-unit");
    unitSelect.innerHTML = SettingsView.units
      .map((u) => {
        const isDefaultPcs =
          !prod &&
          (u.symbol.toLowerCase() === "pcs" ||
            u.name.toLowerCase().includes("piece"));
        const isSelected = prod ? prod.unitId === u.id : isDefaultPcs;
        return `<option value="${u.id}" ${isSelected ? "selected" : ""}>${u.name} (${u.symbol})</option>`;
      })
      .join("");

    new bootstrap.Modal(document.getElementById("productModal")).show();
  },

  editProduct: async (id) => {
    const prod = await api.get(`/products/${id}`);
    SettingsView.showProductModal(prod);
  },

  generateSku: () => {
    const name = document.getElementById("prod-name").value.trim();
    if (!name) {
      document.getElementById("prod-sku").value =
        "ITEM-" + Math.floor(1000 + Math.random() * 9000);
      return;
    }
    const initials = name
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .split(" ")
      .filter((x) => x)
      .map((w) => w[0].toUpperCase())
      .slice(0, 3)
      .join("");
    document.getElementById("prod-sku").value =
      `${initials || "SKU"}-${Math.floor(1000 + Math.random() * 9000)}`;
  },

  saveProduct: async () => {
    const id = document.getElementById("prod-id").value;
    const name = document.getElementById("prod-name").value.trim();
    const sku = document.getElementById("prod-sku").value.trim();
    const categoryId = parseInt(document.getElementById("prod-category").value);
    const unitId = parseInt(document.getElementById("prod-unit").value);
    const sellingPrice =
      parseFloat(document.getElementById("prod-selling-price").value) || 0;
    const purchaseCost =
      parseFloat(document.getElementById("prod-purchase-cost").value) || 0;
    const reorderLevel =
      parseFloat(document.getElementById("prod-reorder-level").value) || 0;
    const barcode =
      document.getElementById("prod-barcode").value.trim() || null;
    const description =
      document.getElementById("prod-description").value.trim() || null;

    if (!name || !sku)
      return UI.showAlert("Name and SKU are required.", "warning");
    if (!categoryId || !unitId)
      return UI.showAlert("Category and Unit are required.", "warning");

    try {
      if (id) {
        await api.put(`/products/${id}`, {
          sku,
          barcode,
          name,
          description,
          categoryId,
          unitId,
          defaultPurchaseCost: purchaseCost,
          defaultSellingPrice: sellingPrice,
          reorderLevel,
          isActive: true,
        });
        UI.showAlert("Product updated.", "success");
      } else {
        await api.post("/products", {
          sku,
          barcode,
          name,
          description,
          categoryId,
          unitId,
          defaultPurchaseCost: purchaseCost,
          defaultSellingPrice: sellingPrice,
          reorderLevel,
          initialStockQuantity: 0,
          initialStockUnitCost: purchaseCost,
        });
        UI.showAlert(
          "Product created. Now inward units in Purchase Book.",
          "success",
        );
      }

      bootstrap.Modal.getInstance(
        document.getElementById("productModal"),
      ).hide();
      await SettingsView.loadProductsList();
    } catch (err) {
      UI.showAlert(err.message, "danger");
    }
  },
// 3. CATEGORIES TAB
  renderCategoriesTab: async (host) => {
    host.innerHTML = `
      <div class="bg-white rounded-xl border border-slate-200 shadow-xs p-5 max-w-2xl flex flex-col gap-4">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 class="font-headline text-base font-bold text-slate-900">Product Categories</h2>
            <p class="text-slate-500 text-[11px] mt-0.5">Manage categories and activate/deactivate them for POS filters.</p>
          </div>
          <button onclick="SettingsView.showCategoryModal()" 
                  class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1">
            <span class="material-symbols-outlined text-base leading-none">add</span>
            <span>Add Category</span>
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-slate-50 text-slate-600 font-mono text-[11px] uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th class="py-2.5 px-3">Category Name</th>
                <th class="py-2.5 px-3 text-center">Items Linked</th>
                <th class="py-2.5 px-3 text-center">Status</th>
                <th class="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody id="settings-cat-tbody" class="divide-y divide-slate-100 text-slate-800">
              <tr><td colspan="4" class="text-center py-6 text-slate-400 font-mono">Loading categories...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    try {
      let cats = await api.get('/catalog/categories?includeInactive=true').catch(() => null);
      if (!cats) cats = await api.get('/catalog/categories');
      
      SettingsView.categories = cats || [];
      const tbody = document.getElementById('settings-cat-tbody');
      if (!tbody) return;

      if (!SettingsView.categories.length) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-6 text-slate-400 font-mono">No categories found.</td></tr>';
        return;
      }

      tbody.innerHTML = SettingsView.categories.map(c => {
        const catId = c.id ?? c.Id;
        const catName = c.name ?? c.Name;
        const isActive = c.isActive ?? c.IsActive ?? true;
        const count = c.productCount ?? c.ProductCount ?? 0;

        return `
          <tr class="hover:bg-slate-50 transition-colors ${!isActive ? 'opacity-60 bg-slate-50/50' : ''}">
            <td class="py-2.5 px-3 font-bold text-slate-900">
              ${catName}
            </td>
            <td class="py-2.5 px-3 text-center font-mono font-bold text-slate-600">
              ${count} items
            </td>
            <td class="py-2.5 px-3 text-center">
              <span class="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                isActive 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : 'bg-slate-200 text-slate-600 border border-slate-300'
              }">
                ${isActive ? 'Active' : 'Inactive'}
              </span>
            </td>
            <td class="py-2.5 px-3 text-center">
              <div class="inline-flex items-center gap-1">
                <!-- Edit button passes ID and escaped name directly -->
                <button onclick="SettingsView.editCategory(${catId})" 
                        class="p-1.5 rounded text-slate-400 hover:text-emerald-700 hover:bg-slate-100 transition-colors" 
                        title="Edit Category">
                  <span class="material-symbols-outlined text-base leading-none">edit</span>
                </button>
                <!-- Quick Toggle passes ID and current active flag -->
                <button onclick="SettingsView.toggleCategoryActive(${catId}, ${isActive})" 
                        class="p-1.5 rounded ${isActive ? 'text-slate-400 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-800'} hover:bg-slate-100 transition-colors" 
                        title="${isActive ? 'Mark Inactive' : 'Activate Category'}">
                  <span class="material-symbols-outlined text-base leading-none">${isActive ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  },

  showCategoryModal: (cat = null) => {
    const titleEl = document.getElementById('catModalTitle');
    const idEl = document.getElementById('cat-id');
    const nameEl = document.getElementById('cat-name');
    const activeEl = document.getElementById('cat-is-active');

    if (titleEl) titleEl.innerText = cat ? 'Edit Category' : 'Add Item Category';
    if (idEl) idEl.value = cat ? (cat.id ?? cat.Id) : '';
    if (nameEl) nameEl.value = cat ? (cat.name ?? cat.Name) : '';
    if (activeEl) activeEl.checked = cat ? (cat.isActive ?? cat.IsActive ?? true) : true;

    new bootstrap.Modal(document.getElementById('categoryModal')).show();
  },

  editCategory: (id) => {
    // Loose comparison (==) ensures string vs number matching works
    const cat = SettingsView.categories.find(c => (c.id ?? c.Id) == id);
    if (cat) {
      SettingsView.showCategoryModal(cat);
    } else {
      console.error('Category not found for ID:', id);
    }
  },

  toggleCategoryActive: async (id, currentStatus) => {
    const cat = SettingsView.categories.find(c => (c.id ?? c.Id) == id);
    const catName = cat ? (cat.name ?? cat.Name) : 'Category';
    const nextStatus = !currentStatus;

    try {
      await api.put(`/catalog/categories/${id}`, {
        name: catName,
        isActive: nextStatus
      });

      UI.showAlert(`"${catName}" is now ${nextStatus ? 'Active' : 'Inactive'}.`, 'success');
      await SettingsView.renderCategoriesTab(document.getElementById('settings-tab-host'));
    } catch (err) {
      console.error('Failed to toggle category:', err);
      UI.showAlert(err.message || 'Failed to update category status', 'danger');
    }
  },

  saveCategory: async () => {
    const id = document.getElementById('cat-id').value;
    const name = document.getElementById('cat-name').value.trim();
    const isActive = document.getElementById('cat-is-active').checked;

    if (!name) return UI.showAlert('Category name is required.', 'warning');

    try {
      if (id) {
        // Update existing category
        await api.put(`/catalog/categories/${id}`, { name, isActive });
        UI.showAlert('Category updated successfully.', 'success');
      } else {
        // Create new category
        await api.post('/catalog/categories', { name, isActive: true });
        UI.showAlert('Category created.', 'success');
      }

      const modalEl = document.getElementById('categoryModal');
      const modalInstance = bootstrap.Modal.getInstance(modalEl);
      if (modalInstance) modalInstance.hide();

      document.getElementById('cat-name').value = '';
      document.getElementById('cat-id').value = '';

      await SettingsView.renderCategoriesTab(document.getElementById('settings-tab-host'));
    } catch (err) {
      console.error('Save category error:', err);
      UI.showAlert(err.message || 'Failed to save category', 'danger');
    }
  },

  // 4. SUPPLIERS TAB
  renderSuppliersTab: async (host) => {
    host.innerHTML = `
      <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="p-4 px-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <div>
            <h2 class="font-headline text-sm font-bold text-slate-900">Supplier &amp; Distributor Directory</h2>
            <p class="text-slate-500 text-[11px] mt-0.5">Track vendor PANs and outstanding payables.</p>
          </div>
          <button onclick="SettingsView.showSupplierModal()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5">
            <span class="material-symbols-outlined text-base leading-none">add</span>
            <span>Add Supplier</span>
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-slate-50 text-slate-600 font-mono text-[11px] uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th class="py-3 px-4">Supplier Name</th>
                <th class="py-3 px-3">Contact Person</th>
                <th class="py-3 px-3">Phone</th>
                <th class="py-3 px-3">PAN</th>
                <th class="py-3 px-3">Address</th>
                <th class="py-3 px-4 text-right">Payable Balance</th>
                <th class="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody id="settings-sup-tbody" class="divide-y divide-slate-100 text-slate-800">
              <tr><td colspan="7" class="text-center py-8 text-slate-400 font-mono">Loading suppliers...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    const sups = await api.get("/suppliers");
    SettingsView.suppliers = sups;
    const tbody = document.getElementById("settings-sup-tbody");
    if (!tbody) return;

    if (!sups.length) {
      tbody.innerHTML =
        '<tr><td colspan="7" class="text-center py-8 text-slate-400 font-mono">No suppliers registered.</td></tr>';
      return;
    }

    tbody.innerHTML = sups
      .map(
        (s) => `
      <tr class="hover:bg-slate-50 transition-colors">
        <td class="py-3 px-4 font-bold text-slate-900">${s.name}</td>
        <td class="py-3 px-3 font-medium text-slate-700">${s.contactPerson || "—"}</td>
        <td class="py-3 px-3 font-mono text-slate-600">${s.phone || "—"}</td>
        <td class="py-3 px-3 font-mono font-bold text-slate-800">${s.panNumber || "—"}</td>
        <td class="py-3 px-3 text-slate-600">${s.address || "—"}</td>
        <td class="py-3 px-4 text-right font-mono font-bold ${s.currentBalance > 0 ? "text-rose-700" : "text-emerald-700"}">
          ${UI.formatMoney(s.currentBalance)}
        </td>
        <td class="py-3 px-3 text-center">
          <button onclick="SettingsView.editSupplier(${s.id})" class="p-1 rounded text-slate-400 hover:text-emerald-700 hover:bg-slate-100 transition-colors" title="Edit Supplier">
            <span class="material-symbols-outlined text-base leading-none">edit</span>
          </button>
        </td>
      </tr>
    `,
      )
      .join("");
  },

  showSupplierModal: (sup = null) => {
    document.getElementById("supplierModalTitle").innerText = sup
      ? "Edit Supplier"
      : "Add Supplier";
    document.getElementById("sup-id").value = sup ? sup.id : "";
    document.getElementById("sup-name").value = sup ? sup.name : "";
    document.getElementById("sup-contact").value = sup
      ? sup.contactPerson || ""
      : "";
    document.getElementById("sup-phone").value = sup ? sup.phone || "" : "";
    document.getElementById("sup-pan").value = sup ? sup.panNumber || "" : "";
    document.getElementById("sup-address").value = sup ? sup.address || "" : "";
    new bootstrap.Modal(document.getElementById("supplierModal")).show();
  },

  editSupplier: async (id) => {
    const s = await api.get(`/suppliers/${id}`);
    SettingsView.showSupplierModal(s);
  },

  saveSupplier: async () => {
    const id = document.getElementById("sup-id").value;
    const name = document.getElementById("sup-name").value.trim();
    const contactPerson =
      document.getElementById("sup-contact").value.trim() || null;
    const phone = document.getElementById("sup-phone").value.trim() || null;
    const panNumber = document.getElementById("sup-pan").value.trim() || null;
    const address = document.getElementById("sup-address").value.trim() || null;

    if (!name) return UI.showAlert("Supplier name is required.", "warning");

    const payload = { name, contactPerson, phone, panNumber, address };

    try {
      if (id) {
        await api.put(`/suppliers/${id}`, payload);
        UI.showAlert("Supplier updated.", "success");
      } else {
        await api.post("/suppliers", payload);
        UI.showAlert("Supplier created.", "success");
      }

      bootstrap.Modal.getInstance(
        document.getElementById("supplierModal"),
      ).hide();
      await SettingsView.renderSuppliersTab(
        document.getElementById("settings-tab-host"),
      );
    } catch (err) {
      UI.showAlert(err.message, "danger");
    }
  },
};
