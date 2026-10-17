const api = {
  get: async (url) => {
    const res = await fetch(`/api${url}`);
    if (res.status === 401) {
      window.location.href = "/login.html";
      throw new Error("Unauthorized");
    }
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  post: async (url, data) => {
    const res = await fetch(`/api${url}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.status === 401) {
      window.location.href = "/login.html";
      throw new Error("Unauthorized");
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Server error" }));
      throw new Error(err.message || "Request failed");
    }
    return res.json();
  },
  put: async (url, data) => {
    const res = await fetch(`/api${url}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.status === 401) {
      window.location.href = "/login.html";
      throw new Error("Unauthorized");
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Server error" }));
      throw new Error(err.message || "Request failed");
    }
    return res.json();
  },
};

// Inside src/SubidhaIMS.Web/wwwroot/js/app.js:
const UI = {
  isMasked: localStorage.getItem("ims_mask_metrics") !== "false",

  // Inside src/SubidhaIMS.Web/wwwroot/js/app.js:
  togglePrivacy: () => {
    UI.isMasked = !UI.isMasked;
    localStorage.setItem("ims_mask_metrics", UI.isMasked);
    UI.updatePrivacyNavbarButton();

    const currentHash = window.location.hash.replace("#", "") || "dashboard";
    if (
      currentHash === "dashboard" &&
      typeof ReportsView !== "undefined" &&
      ReportsView.updateMetricCards
    ) {
      ReportsView.updateMetricCards();
      if (ReportsView.topItems)
        ReportsView.renderTopProfitable(ReportsView.topItems);
    } else if (currentHash === "stock" && typeof StockView !== "undefined") {
      if (StockView.updateMetricCards) StockView.updateMetricCards();
      if (StockView.filterTable) StockView.filterTable();
    } else if (
      currentHash === "sales" &&
      typeof SalesView !== "undefined" &&
      SalesView.renderRows
    ) {
      SalesView.renderRows(SalesView.rawSales);
    } else if (
      currentHash === "finance" &&
      typeof FinanceView !== "undefined" &&
      FinanceView.updateView
    ) {
      FinanceView.updateView();
    }
  },

  updatePrivacyNavbarButton: () => {
    const icon = document.getElementById("nav-privacy-icon");
    const label = document.getElementById("nav-privacy-label");
    if (icon && label) {
      icon.innerText = UI.isMasked ? "visibility" : "visibility_off";
      label.innerText = UI.isMasked ? "Show Values" : "Hide Values";
    }
  },

  showAlert: (message, type = "success") => {
    const host = document.getElementById("alert-host");
    if (!host) return;
    host.innerHTML = `
      <div class="p-3 mb-3 rounded-lg text-xs font-semibold flex items-center justify-between shadow-xs ${
        type === "success"
          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
          : "bg-rose-50 text-rose-800 border border-rose-200"
      }">
        <span>${message}</span>
        <button type="button" onclick="this.parentElement.remove()" class="text-slate-400 hover:text-slate-600">
          <span class="material-symbols-outlined text-sm leading-none">close</span>
        </button>
      </div>`;
    setTimeout(() => {
      if (host.firstChild) host.firstChild.remove();
    }, 4000);
  },

  formatMoney: (val) =>
    "NPR " +
    Number(val || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
  formatDate: (d) => new Date(d).toLocaleDateString("en-GB"),
};

// Sync button state on initial load:
window.addEventListener("DOMContentLoaded", () => {
  UI.updatePrivacyNavbarButton();
});

const Exporter = {
  toCsv: (filename, headers, rows) => {
    const escapeCsv = (str) => {
      const val = str === null || str === undefined ? "" : String(str);
      return `"${val.replace(/"/g, '""')}"`;
    };

    let csvContent = "\uFEFF";
    csvContent += headers.map(escapeCsv).join(",") + "\r\n";

    rows.forEach((row) => {
      csvContent += row.map(escapeCsv).join(",") + "\r\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${filename}_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};

const Auth = {
  checkUser: async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const user = await res.json();
        const display = document.getElementById("user-display");
        if (display) display.innerText = user.username;
        return true;
      }
    } catch (_) {}
    window.location.href = "/login.html";
    return false;
  },

  logout: async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login.html";
  },
};

window.addEventListener("hashchange", handleRouting);
window.addEventListener("DOMContentLoaded", async () => {
  const isAuth = await Auth.checkUser();
  if (isAuth) {
    if (!window.location.hash) window.location.hash = "#dashboard";
    handleRouting();
  }
});
async function handleRouting() {
  const hash = window.location.hash.replace("#", "") || "dashboard";

  // Update active state in sidebar
  document.querySelectorAll("aside nav .nav-item").forEach((el) => {
    const view = el.getAttribute("data-view");
    const isActive = view === hash;
    if (isActive) {
      el.className =
        "nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-emerald-800 bg-emerald-50 border border-emerald-200/60 font-semibold shadow-xs";
    } else {
      el.className =
        "nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium";
    }
  });

  const viewport = document.getElementById("app-viewport");
  if (!viewport) return;

  viewport.innerHTML = `
    <div class="flex items-center justify-center py-20 text-slate-400">
      <div class="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mr-2"></div>
      <span class="text-xs font-mono">Loading ${hash} module...</span>
    </div>`;

  try {
    if (hash === "dashboard") await ReportsView.render(viewport);
    else if (hash === "pos") await PosView.render(viewport);
    else if (hash === "sales") await SalesView.render(viewport);
    else if (hash === "purchases") await PurchasesView.render(viewport);
    else if (hash === "stock") await StockView.render(viewport);
    else if (hash === "finance") await FinanceView.render(viewport);
    else if (hash === "settings") await SettingsView.render(viewport);
  } catch (err) {
    console.error("Route error:", err);
    viewport.innerHTML = `
      <div class="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 shadow-xs">
        <h5 class="font-headline font-bold text-sm flex items-center gap-2">
          <span class="material-symbols-outlined text-base">error</span>
          Failed to load ${hash} view
        </h5>
        <p class="text-xs mt-1 font-mono">${err.message}</p>
      </div>`;
  }
}
