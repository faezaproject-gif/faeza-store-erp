/* =========================================================
   FAEZA ERP V2
   SCRIPT.JS
   CORE ENGINE
   ========================================================= */

"use strict";

/* =========================================================
   DATABASE
========================================================= */

const DB_KEY = "FAEZA_ERP_V2_DATABASE";

const defaultDB = {
  products: [],
  suppliers: [],
  customers: [],
  purchases: [],
  sales: [],
  debts: [],
  receivables: [],
  stockMovements: [],
  payments: [],
  settings: {
    storeName: "Faeza Store",
    storePhone: ""
  }
};

let db = loadDB();

let cart = [];
let purchaseCart = [];

let editingProductId = null;
let editingSupplierId = null;

/* =========================================================
   DATABASE FUNCTIONS
========================================================= */

function loadDB() {
  try {
    const saved = localStorage.getItem(DB_KEY);

    if (!saved) {
      return structuredClone(defaultDB);
    }

    const parsed = JSON.parse(saved);

    return {
      ...structuredClone(defaultDB),
      ...parsed,
      products: parsed.products || [],
      suppliers: parsed.suppliers || [],
      customers: parsed.customers || [],
      purchases: parsed.purchases || [],
      sales: parsed.sales || [],
      debts: parsed.debts || [],
      receivables: parsed.receivables || [],
      stockMovements: parsed.stockMovements || [],
      payments: parsed.payments || [],
      settings: {
        ...defaultDB.settings,
        ...(parsed.settings || {})
      }
    };
  } catch (error) {
    console.error("Database error:", error);
    return structuredClone(defaultDB);
  }
}

function saveDB() {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function resetDatabase() {
  const confirmed = confirm(
    "PERINGATAN!\n\n" +
    "Semua data Faeza ERP V2 akan dihapus.\n" +
    "Data tidak dapat dikembalikan.\n\n" +
    "Lanjutkan?"
  );

  if (!confirmed) return;

  localStorage.removeItem(DB_KEY);

  db = structuredClone(defaultDB);
  cart = [];
  purchaseCart = [];

  renderAll();

  showToast("Database berhasil direset.", "success");
}

/* =========================================================
   UTILITIES
========================================================= */

function uid(prefix = "ID") {
  return (
    prefix +
    "-" +
    Date.now().toString(36).toUpperCase() +
    "-" +
    Math.random().toString(36).substring(2, 7).toUpperCase()
  );
}

function today() {
  const d = new Date();

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(date) {
  if (!date) return "-";

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) {
    return date;
  }

  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function money(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function number(value) {
  return Number(value) || 0;
}

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function generateCode(prefix, collection) {
  const next = collection.length + 1;

  return (
    prefix +
    "-" +
    String(next).padStart(4, "0")
  );
}

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");

  if (!toast) return;

  toast.textContent = message;

  toast.className = "toast show " + type;

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(() => {
    toast.className = "toast";
  }, 3000);
}

/* =========================================================
   NAVIGATION
========================================================= */

function initNavigation() {
  const navItems = document.querySelectorAll(".nav-item");
  const pages = document.querySelectorAll(".page");

  navItems.forEach(item => {
    item.addEventListener("click", () => {
      const pageName = item.dataset.page;

      navItems.forEach(nav => nav.classList.remove("active"));
      item.classList.add("active");

      pages.forEach(page => {
        page.classList.remove("active");
      });

      const target = document.getElementById(
        "page-" + pageName
      );

      if (target) {
        target.classList.add("active");
      }

      closeMobileMenu();

      renderPage(pageName);
    });
  });
}

function renderPage(pageName) {
  switch (pageName) {
    case "dashboard":
      renderDashboard();
      break;

    case "produk":
      renderProducts();
      break;

    case "stok":
      renderStock();
      break;

    case "supplier":
      renderSuppliers();
      break;

    case "pembelian":
      renderPurchases();
      break;

    case "hutang":
      renderDebts();
      break;

    case "piutang":
      renderReceivables();
      break;

    case "laporan":
      renderReports();
      break;

    case "kasir":
      renderSaleProducts();
      renderCart();
      break;

    case "pengaturan":
      renderSettings();
      break;
  }
}

/* =========================================================
   MOBILE MENU
========================================================= */

function initMobileMenu() {
  const menuToggle = document.getElementById("menuToggle");
  const sidebar = document.getElementById("sidebar");

  if (!menuToggle || !sidebar) return;

  menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });

  document.addEventListener("click", event => {
    if (
      window.innerWidth <= 850 &&
      sidebar.classList.contains("open") &&
      !sidebar.contains(event.target) &&
      !menuToggle.contains(event.target)
    ) {
      closeMobileMenu();
    }
  });
}

function closeMobileMenu() {
  const sidebar = document.getElementById("sidebar");

  if (sidebar) {
    sidebar.classList.remove("open");
  }
}

/* =========================================================
   MODAL
========================================================= */

function openModal(title, bodyHTML, onSave = null) {
  const overlay = document.getElementById("modalOverlay");
  const titleEl = document.getElementById("modalTitle");
  const bodyEl = document.getElementById("modalBody");
  const saveBtn = document.getElementById("modalSave");

  if (!overlay || !titleEl || !bodyEl || !saveBtn) return;

  titleEl.textContent = title;
  bodyEl.innerHTML = bodyHTML;

  overlay.classList.add("show");

  saveBtn.onclick = () => {
    if (typeof onSave === "function") {
      onSave();
    }
  };
}

function closeModal() {
  const overlay = document.getElementById("modalOverlay");

  if (overlay) {
    overlay.classList.remove("show");
  }

  editingProductId = null;
  editingSupplierId = null;
}

function initModal() {
  const overlay = document.getElementById("modalOverlay");
  const closeBtn = document.getElementById("modalClose");
  const cancelBtn = document.getElementById("modalCancel");

  if (closeBtn) {
    closeBtn.addEventListener("click", closeModal);
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", closeModal);
  }

  if (overlay) {
    overlay.addEventListener("click", event => {
      if (event.target === overlay) {
        closeModal();
      }
    });
  }
}

/* =========================================================
   PRODUCT
========================================================= */

function initProductEvents() {
  const btn = document.getElementById("btnAddProduct");

  if (btn) {
    btn.addEventListener("click", () => {
      openProductForm();
    });
  }

  const search = document.getElementById("productSearch");

  if (search) {
    search.addEventListener("input", renderProducts);
  }
}

function openProductForm(productId = null) {
  editingProductId = productId;

  const product = productId
    ? db.products.find(p => p.id === productId)
    : null;

  const title = product
    ? "Edit Produk"
    : "Produk Baru";

  const body = `
    <div class="form-grid">

      <div class="form-group">
        <label>Kode Produk</label>
        <input
          id="modalProductCode"
          value="${escapeHTML(
            product?.code || generateCode("PRD", db.products)
          )}"
          ${product ? "readonly" : ""}
        >
      </div>

      <div class="form-group">
        <label>Nama Produk</label>
        <input
          id="modalProductName"
          value="${escapeHTML(product?.name || "")}"
          placeholder="Nama produk"
        >
      </div>

      <div class="form-group">
        <label>Satuan</label>
        <input
          id="modalProductUnit"
          value="${escapeHTML(product?.unit || "pcs")}"
          placeholder="pcs / kg / liter"
        >
      </div>

      <div class="form-group">
        <label>Harga Beli</label>
        <input
          id="modalProductBuy"
          type="number"
          min="0"
          value="${product?.buyPrice || 0}"
        >
      </div>

      <div class="form-group">
        <label>Harga Jual</label>
        <input
          id="modalProductSell"
          type="number"
          min="0"
          value="${product?.sellPrice || 0}"
        >
      </div>

      <div class="form-group">
        <label>Stok Awal</label>
        <input
          id="modalProductStock"
          type="number"
          min="0"
          value="${product?.stock || 0}"
          ${product ? "disabled" : ""}
        >
      </div>

      <div class="form-group">
        <label>Minimum Stok</label>
        <input
          id="modalProductMin"
          type="number"
          min="0"
          value="${product?.minStock || 0}"
        >
      </div>

    </div>
  `;

  openModal(title, body, saveProduct);
}

function saveProduct() {
  const code = document
    .getElementById("modalProductCode")
    ?.value.trim();

  const name = document
    .getElementById("modalProductName")
    ?.value.trim();

  const unit = document
    .getElementById("modalProductUnit")
    ?.value.trim();

  const buyPrice = number(
    document.getElementById("modalProductBuy")?.value
  );

  const sellPrice = number(
    document.getElementById("modalProductSell")?.value
  );

  const minStock = number(
    document.getElementById("modalProductMin")?.value
  );

  if (!code || !name || !unit) {
    showToast("Lengkapi data produk.", "error");
    return;
  }

  if (editingProductId) {
    const product = db.products.find(
      p => p.id === editingProductId
    );

    if (!product) return;

    product.name = name;
    product.unit = unit;
    product.buyPrice = buyPrice;
    product.sellPrice = sellPrice;
    product.minStock = minStock;

    showToast("Produk berhasil diperbarui.");
  } else {
    const stock = number(
      document.getElementById("modalProductStock")?.value
    );

    db.products.push({
      id: uid("PRD"),
      code,
      name,
      unit,
      buyPrice,
      sellPrice,
      stock,
      minStock,
      createdAt: new Date().toISOString()
    });

    if (stock > 0) {
      const product =
        db.products[db.products.length - 1];

      db.stockMovements.push({
        id: uid("STK"),
        date: today(),
        type: "STOK_AWAL",
        productId: product.id,
        productName: product.name,
        qty: stock,
        reference: "STOK-AWAL",
        balance: stock
      });
    }

    showToast("Produk berhasil ditambahkan.");
  }

  saveDB();
  closeModal();
  renderAll();
}

function deleteProduct(id) {
  const product = db.products.find(p => p.id === id);

  if (!product) return;

  const used =
    db.purchases.some(p =>
      p.items.some(item => item.productId === id)
    ) ||
    db.sales.some(s =>
      s.items.some(item => item.productId === id)
    );

  if (used) {
    showToast(
      "Produk tidak dapat dihapus karena sudah digunakan dalam transaksi.",
      "error"
    );
    return;
  }

  if (!confirm(`Hapus produk "${product.name}"?`)) {
    return;
  }

  db.products = db.products.filter(p => p.id !== id);

  saveDB();
  renderAll();

  showToast("Produk berhasil dihapus.");
}

function renderProducts() {
  const tbody = document.getElementById("productTable");

  if (!tbody) return;

  const search =
    document.getElementById("productSearch")
      ?.value
      .toLowerCase()
      .trim() || "";

  const products = db.products.filter(product => {
    return (
      product.name.toLowerCase().includes(search) ||
      product.code.toLowerCase().includes(search)
    );
  });

  if (!products.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">
          Belum ada produk
        </td>
      </tr>
    `;

    return;
  }

  tbody.innerHTML = products.map(product => {

    const low =
      number(product.stock) <=
      number(product.minStock);

    return `
      <tr>

        <td>${escapeHTML(product.code)}</td>

        <td>
          <strong>${escapeHTML(product.name)}</strong>
        </td>

        <td>${escapeHTML(product.unit)}</td>

        <td>${money(product.buyPrice)}</td>

        <td>${money(product.sellPrice)}</td>

        <td class="${low ? "stock-low" : "stock-normal"}">
          ${number(product.stock)}
        </td>

        <td>${number(product.minStock)}</td>

        <td>
          <div class="action-group">

            <button
              class="action-btn edit"
              onclick="openProductForm('${product.id}')"
              type="button"
            >
              Edit
            </button>

            <button
              class="action-btn delete"
              onclick="deleteProduct('${product.id}')"
              type="button"
            >
              Hapus
            </button>

          </div>
        </td>

      </tr>
    `;
  }).join("");
}

/* =========================================================
   SUPPLIER
========================================================= */

function initSupplierEvents() {
  const btn = document.getElementById("btnAddSupplier");

  if (btn) {
    btn.addEventListener("click", () => {
      openSupplierForm();
    });
  }

  const search = document.getElementById("supplierSearch");

  if (search) {
    search.addEventListener("input", renderSuppliers);
  }
}

function openSupplierForm(supplierId = null) {
  editingSupplierId = supplierId;

  const supplier = supplierId
    ? db.suppliers.find(s => s.id === supplierId)
    : null;

  const body = `
    <div class="form-grid">

      <div class="form-group">
        <label>Kode Supplier</label>
        <input
          id="modalSupplierCode"
          value="${escapeHTML(
            supplier?.code ||
            generateCode("SUP", db.suppliers)
          )}"
          ${supplier ? "readonly" : ""}
        >
      </div>

      <div class="form-group">
        <label>Nama Supplier</label>
        <input
          id="modalSupplierName"
          value="${escapeHTML(supplier?.name || "")}"
          placeholder="Nama supplier"
        >
      </div>

      <div class="form-group">
        <label>Nama Kontak</label>
        <input
          id="modalSupplierContact"
          value="${escapeHTML(supplier?.contact || "")}"
        >
      </div>

      <div class="form-group">
        <label>No. Telepon</label>
        <input
          id="modalSupplierPhone"
          value="${escapeHTML(supplier?.phone || "")}"
        >
      </div>

      <div class="form-group" style="grid-column:1/-1">
        <label>Alamat</label>
        <textarea
          id="modalSupplierAddress"
        >${escapeHTML(supplier?.address || "")}</textarea>
      </div>

    </div>
  `;

  openModal(
    supplier ? "Edit Supplier" : "Supplier Baru",
    body,
    saveSupplier
  );
}

function saveSupplier() {
  const code =
    document.getElementById("modalSupplierCode")
      ?.value.trim();

  const name =
    document.getElementById("modalSupplierName")
      ?.value.trim();

  const contact =
    document.getElementById("modalSupplierContact")
      ?.value.trim();

  const phone =
    document.getElementById("modalSupplierPhone")
      ?.value.trim();

  const address =
    document.getElementById("modalSupplierAddress")
      ?.value.trim();

  if (!code || !name) {
    showToast("Kode dan nama supplier wajib diisi.", "error");
    return;
  }

  if (editingSupplierId) {
    const supplier = db.suppliers.find(
      s => s.id === editingSupplierId
    );

    if (!supplier) return;

    supplier.name = name;
    supplier.contact = contact;
    supplier.phone = phone;
    supplier.address = address;

    showToast("Supplier berhasil diperbarui.");
  } else {
    db.suppliers.push({
      id: uid("SUP"),
      code,
      name,
      contact,
      phone,
      address,
      createdAt: new Date().toISOString()
    });

    showToast("Supplier berhasil ditambahkan.");
  }

  saveDB();
  closeModal();
  renderAll();
}

function deleteSupplier(id) {
  const supplier = db.suppliers.find(s => s.id === id);

  if (!supplier) return;

  const used = db.purchases.some(
    purchase => purchase.supplierId === id
  );

  if (used) {
    showToast(
      "Supplier tidak dapat dihapus karena sudah memiliki transaksi pembelian.",
      "error"
    );
    return;
  }

  if (!confirm(`Hapus supplier "${supplier.name}"?`)) {
    return;
  }

  db.suppliers =
    db.suppliers.filter(s => s.id !== id);

  saveDB();
  renderAll();

  showToast("Supplier berhasil dihapus.");
}

function renderSuppliers() {
  const tbody =
    document.getElementById("supplierTable");

  if (!tbody) return;

  const search =
    document.getElementById("supplierSearch")
      ?.value
      .toLowerCase()
      .trim() || "";

  const suppliers = db.suppliers.filter(supplier => {
    return (
      supplier.name.toLowerCase().includes(search) ||
      supplier.code.toLowerCase().includes(search) ||
      (supplier.phone || "")
        .toLowerCase()
        .includes(search)
    );
  });

  if (!suppliers.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          Belum ada supplier
        </td>
      </tr>
    `;

    return;
  }

  tbody.innerHTML = suppliers.map(supplier => {

    const debt = db.debts
      .filter(d => d.supplierId === supplier.id)
      .reduce(
        (sum, d) =>
          sum +
          Math.max(
            0,
            number(d.total) - number(d.paid)
          ),
        0
      );

    return `
      <tr>

        <td>${escapeHTML(supplier.code)}</td>

        <td>
          <strong>${escapeHTML(supplier.name)}</strong>
        </td>

        <td>${escapeHTML(supplier.contact || "-")}</td>

        <td>${escapeHTML(supplier.phone || "-")}</td>

        <td>${escapeHTML(supplier.address || "-")}</td>

        <td>${money(debt)}</td>

        <td>
          <div class="action-group">

            <button
              class="action-btn edit"
              onclick="openSupplierForm('${supplier.id}')"
              type="button"
            >
              Edit
            </button>

            <button
              class="action-btn delete"
              onclick="deleteSupplier('${supplier.id}')"
              type="button"
            >
              Hapus
            </button>

          </div>
        </td>

      </tr>
    `;
  }).join("");
}

/* =========================================================
   PURCHASE
========================================================= */
function initPurchaseEvents() {
  const addBtn =
    document.getElementById("btnAddPurchaseItem");

  if (addBtn) {
    addBtn.addEventListener(
      "click",
      addPurchaseItem
    );
  }

  const saveBtn =
    document.getElementById("btnSavePurchase");

  if (saveBtn) {
    saveBtn.addEventListener(
      "click",
      savePurchase
    );
  }

  const cancelBtn =
    document.getElementById("btnCancelPurchase");

  if (cancelBtn) {
    cancelBtn.addEventListener(
      "click",
      cancelPurchase
    );
  }

  const date =
    document.getElementById("purchaseDate");

  if (date && !date.value) {
    date.value = today();
  }
}

function addPurchaseItem() {
  if (!db.products.length) {
    showToast(
      "Tambahkan produk terlebih dahulu.",
      "warning"
    );
    return;
  }

  const product =
    db.products[0];

  purchaseCart.push({
    id: uid("PI"),
    productId: product.id,
    qty: 1,
    price: number(product.buyPrice)
  });

  renderPurchaseCart();
}

function removePurchaseItem(id) {
  purchaseCart =
    purchaseCart.filter(item => item.id !== id);

  renderPurchaseCart();
}

function updatePurchaseItem(id, field, value) {
  const item =
    purchaseCart.find(i => i.id === id);

  if (!item) return;

  if (field === "productId") {
    const product =
      db.products.find(p => p.id === value);

    if (!product) return;

    item.productId = value;
    item.price = number(product.buyPrice);
  }

  if (field === "qty") {
    item.qty = Math.max(1, number(value));
  }

  if (field === "price") {
    item.price = Math.max(0, number(value));
  }

  renderPurchaseCart();
}

function renderPurchaseCart() {
  const tbody =
    document.getElementById("purchaseTable");

  const totalEl =
    document.getElementById("purchaseTotal");

  if (!tbody || !totalEl) return;

  if (!purchaseCart.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">
          Belum ada barang
        </td>
      </tr>
    `;

    totalEl.textContent = money(0);

    return;
  }

  let total = 0;

  tbody.innerHTML = purchaseCart.map(item => {

    const product =
      db.products.find(
        p => p.id === item.productId
      );

    if (!product) return "";

    const subtotal =
      number(item.qty) *
      number(item.price);

    total += subtotal;

    const options = db.products.map(p => `
      <option
        value="${p.id}"
        ${p.id === item.productId ? "selected" : ""}
      >
        ${escapeHTML(p.name)}
      </option>
    `).join("");

    return `
      <tr class="purchase-item-row">

        <td>
          <select
            onchange="
              updatePurchaseItem(
                '${item.id}',
                'productId',
                this.value
              )
            "
          >
            ${options}
          </select>
        </td>

        <td>
          <input
            type="number"
            min="1"
            value="${item.qty}"
            onchange="
              updatePurchaseItem(
                '${item.id}',
                'qty',
                this.value
              )
            "
          >
        </td>

        <td>
          <input
            type="number"
            min="0"
            value="${item.price}"
            onchange="
              updatePurchaseItem(
                '${item.id}',
                'price',
                this.value
              )
            "
          >
        </td>

        <td class="subtotal">
          ${money(subtotal)}
        </td>

        <td>
          <button
            class="action-btn delete"
            onclick="removePurchaseItem('${item.id}')"
            type="button"
          >
            Hapus
          </button>
        </td>

      </tr>
    `;
  }).join("");

  totalEl.textContent = money(total);
}

function getPurchaseTotal() {
  return purchaseCart.reduce(
    (sum, item) =>
      sum +
      number(item.qty) *
      number(item.price),
    0
  );
}

function savePurchase() {
  const supplierId =
    document.getElementById("purchaseSupplier")
      ?.value;

  const invoice =
    document.getElementById("purchaseInvoice")
      ?.value.trim();

  const date =
    document.getElementById("purchaseDate")
      ?.value || today();

  const payment =
    document.getElementById("purchasePayment")
      ?.value || "cash";

  if (!supplierId) {
    showToast(
      "Pilih supplier terlebih dahulu.",
      "error"
    );
    return;
  }

  if (!purchaseCart.length) {
    showToast(
      "Tambahkan barang pembelian.",
      "error"
    );
    return;
  }

  const supplier =
    db.suppliers.find(
      s => s.id === supplierId
    );

  if (!supplier) {
    showToast(
      "Supplier tidak ditemukan.",
      "error"
    );
    return;
  }

  const total =
    getPurchaseTotal();

  if (total <= 0) {
    showToast(
      "Total pembelian tidak valid.",
      "error"
    );
    return;
  }

  const purchaseId =
    uid("PUR");

  const reference =
    invoice || purchaseId;

  const items =
    purchaseCart.map(item => {

      const product =
        db.products.find(
          p => p.id === item.productId
        );

      return {
        productId: item.productId,
        productName: product.name,
        qty: number(item.qty),
        price: number(item.price),
        subtotal:
          number(item.qty) *
          number(item.price)
      };
    });

 /* =========================
     SIMPAN PEMBELIAN
  ========================== */

  db.purchases.push({
    id: purchaseId,
    date,
    invoice: reference,
    supplierId,
    supplierName: supplier.name,
    payment,
    total,
    items,
    createdAt: new Date().toISOString()
  });

  /* =========================
     OTOMATIS STOK MASUK
  ========================== */

  items.forEach(item => {

    const product =
      db.products.find(
        p => p.id === item.productId
      );

    if (!product) return;

    product.stock =
      number(product.stock) +
      number(item.qty);

    db.stockMovements.push({
      id: uid("STK"),
      date,
      type: "STOK_MASUK",
      productId: product.id,
      productName: product.name,
      qty: item.qty,
      reference,
      balance: product.stock
    });
  });


  /* =========================
     OTOMATIS HUTANG
  ========================== */

  if (payment === "credit") {

    db.debts.push({
      id: uid("HUT"),
      date,
      purchaseId,
      invoice: reference,
      supplierId,
      supplierName: supplier.name,
      total,
      paid: 0,
      status: "BELUM_LUNAS",
      createdAt: new Date().toISOString()
    });

  }

  saveDB();

  purchaseCart = [];

  clearPurchaseForm();

  renderAll();

  showToast(
    payment === "credit"
      ? "Pembelian tersimpan. Stok masuk dan hutang otomatis dibuat."
      : "Pembelian tersimpan. Stok otomatis bertambah.",
    "success"
  );
}

function clearPurchaseForm() {
  const supplier =
    document.getElementById("purchaseSupplier");

  const invoice =
    document.getElementById("purchaseInvoice");

  const payment =
    document.getElementById("purchasePayment");

  const date =
    document.getElementById("purchaseDate");

  if (supplier) supplier.value = "";
  if (invoice) invoice.value = "";
  if (payment) payment.value = "cash";
  if (date) date.value = today();

  renderPurchaseCart();
}

function cancelPurchase() {
  if (!purchaseCart.length) {
    clearPurchaseForm();
    return;
  }

  if (
    !confirm(
      "Batalkan transaksi pembelian saat ini?"
    )
  ) {
    return;
  }

  purchaseCart = [];

  clearPurchaseForm();

  showToast(
    "Transaksi pembelian dibatalkan.",
    "warning"
  );
}

function renderPurchaseSupplierOptions() {
  const select =
    document.getElementById("purchaseSupplier");

  if (!select) return;

  const current = select.value;

  select.innerHTML = `
    <option value="">
      -- Pilih Supplier --
    </option>

    ${db.suppliers.map(s => `
      <option value="${s.id}">
        ${escapeHTML(s.name)}
      </option>
    `).join("")}
  `;

  if (
    db.suppliers.some(
      s => s.id === current
    )
  ) {
    select.value = current;
  }
}

function renderPurchases() {
  renderPurchaseSupplierOptions();
  renderPurchaseCart();

  const tbody =
    document.getElementById("purchaseHistory");

  if (!tbody) return;

  const purchases =
    [...db.purchases].reverse();

  if (!purchases.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          Belum ada pembelian
        </td>
      </tr>
    `;

    return;
  }

  tbody.innerHTML = purchases.map(purchase => {

    const debt =
      db.debts.find(
        d => d.purchaseId === purchase.id
      );

    let status = "LUNAS";

    if (purchase.payment === "credit") {
      status =
        debt &&
        number(debt.paid) >=
        number(debt.total)
          ? "LUNAS"
          : "BELUM LUNAS";
    }

    return `
      <tr>

        <td>${formatDate(purchase.date)}</td>

        <td>${escapeHTML(purchase.invoice)}</td>

        <td>${escapeHTML(purchase.supplierName)}</td>

        <td>
          ${
            purchase.payment === "credit"
              ? '<span class="badge badge-warning">Hutang</span>'
              : '<span class="badge badge-success">Tunai</span>'
          }
        </td>

        <td>${money(purchase.total)}</td>

        <td>
          ${
            status === "LUNAS"
              ? '<span class="badge badge-success">Lunas</span>'
              : '<span class="badge badge-danger">Belum Lunas</span>'
          }
        </td>

      </tr>
    `;
  }).join("");
        }

/* =========================================================
   DEBT / HUTANG
========================================================= */

function renderDebts() {
  const tbody =
    document.getElementById("debtTable");

  if (!tbody) return;

  const total =
    db.debts.reduce(
      (sum, debt) =>
        sum + number(debt.total),
      0
    );

  const outstanding =
    db.debts.reduce(
      (sum, debt) =>
        sum +
        Math.max(
          0,
          number(debt.total) -
          number(debt.paid)
        ),
      0
    );

  const totalEl =
    document.getElementById("debtTotal");

  const outstandingEl =
    document.getElementById("debtOutstanding");

  if (totalEl) {
    totalEl.textContent = money(total);
  }

  if (outstandingEl) {
    outstandingEl.textContent =
      money(outstanding);
  }

  if (!db.debts.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">
          Belum ada hutang
        </td>
      </tr>
    `;

    return;
  }

  tbody.innerHTML =
    [...db.debts]
      .reverse()
      .map(debt => {

        const remaining =
          Math.max(
            0,
            number(debt.total) -
            number(debt.paid)
          );

        const status =
          remaining <= 0
            ? "LUNAS"
            : "BELUM LUNAS";

        return `
          <tr>

            <td>${formatDate(debt.date)}</td>

            <td>${escapeHTML(debt.invoice)}</td>

            <td>${escapeHTML(debt.supplierName)}</td>

            <td>${money(debt.total)}</td>

            <td>${money(debt.paid)}</td>

            <td>${money(remaining)}</td>

            <td>
              ${
                status === "LUNAS"
                  ? '<span class="badge badge-success">Lunas</span>'
                  : '<span class="badge badge-danger">Belum Lunas</span>'
              }
            </td>

            <td>
              ${
                remaining > 0
                  ? `
                    <button
                      class="action-btn pay"
                      onclick="payDebt('${debt.id}')"
                      type="button"
                    >
                      Bayar
                    </button>
                  `
                  : "-"
              }
            </td>

          </tr>
        `;
      })
      .join("");
}

function payDebt(id) {
  const debt =
    db.debts.find(
      d => d.id === id
    );

  if (!debt) return;

  const remaining =
    Math.max(
      0,
      number(debt.total) -
      number(debt.paid)
    );

  if (remaining <= 0) {
    showToast(
      "Hutang sudah lunas.",
      "warning"
    );
    return;
  }

  openModal(
    "Pembayaran Hutang",
    `
      <div class="form-group">

        <label>
          Supplier
        </label>

        <input
          value="${escapeHTML(debt.supplierName)}"
          disabled
        >

      </div>

      <div class="form-group" style="margin-top:12px">

        <label>
          Sisa Hutang
        </label>

        <input
          value="${money(remaining)}"
          disabled
        >

      </div>

      <div class="form-group" style="margin-top:12px">

        <label>
          Jumlah Pembayaran
        </label>

        <input
          id="modalDebtPayment"
          type="number"
          min="1"
          max="${remaining}"
          value="${remaining}"
        >

      </div>
    `,
    () => {

      const amount =
        number(
          document.getElementById(
            "modalDebtPayment"
          )?.value
        );

      if (
        amount <= 0 ||
        amount > remaining
      ) {
        showToast(
          "Jumlah pembayaran tidak valid.",
          "error"
        );
        return;
      }

      debt.paid =
        number(debt.paid) +
        amount;

      debt.status =
        debt.paid >= debt.total
          ? "LUNAS"
          : "BELUM_LUNAS";

      db.payments.push({
        id: uid("PAY"),
        type: "HUTANG",
        referenceId: debt.id,
        date: today(),
        amount,
        party: debt.supplierName
      });

      saveDB();

      closeModal();
      renderAll();

      showToast(
        "Pembayaran hutang berhasil dicatat."
      );
    }
  );
}


/* =========================================================
   CASHIER / SALES
========================================================= */

function initSalesEvents() {

  const addBtn =
    document.getElementById("btnAddToCart");

  if (addBtn) {
    addBtn.addEventListener(
      "click",
      addToCart
    );
  }

  const clearBtn =
    document.getElementById("btnClearCart");

  if (clearBtn) {
    clearBtn.addEventListener(
      "click",
      clearCart
    );
  }

  const cancelBtn =
    document.getElementById("btnCancelSale");

  if (cancelBtn) {
    cancelBtn.addEventListener(
      "click",
      cancelSale
    );
  }

  const saveBtn =
    document.getElementById("btnSaveSale");

  if (saveBtn) {
    saveBtn.addEventListener(
      "click",
      saveSale
    );
  }
}

function renderSaleProducts() {
  const select =
    document.getElementById("saleProduct");

  if (!select) return;

  const current =
    select.value;

  select.innerHTML = `
    <option value="">
      -- Pilih Produk --
    </option>

    ${db.products.map(product => `
      <option value="${product.id}">
        ${escapeHTML(product.name)}
        — stok ${number(product.stock)}
      </option>
    `).join("")}
  `;

  if (
    db.products.some(
      p => p.id === current
    )
  ) {
    select.value = current;
  }
}

function addToCart() {
  const productId =
    document.getElementById("saleProduct")
      ?.value;

  const qty =
    number(
      document.getElementById("saleQty")
        ?.value
    );

  if (!productId) {
    showToast(
      "Pilih produk.",
      "error"
    );
    return;
  }

  if (qty <= 0) {
    showToast(
      "Qty harus lebih dari 0.",
      "error"
    );
    return;
  }

  const product =
    db.products.find(
      p => p.id === productId
    );

  if (!product) return;

  const existing =
    cart.find(
      item =>
        item.productId === productId
    );

  const currentQty =
    existing ? existing.qty : 0;

  if (
    currentQty + qty >
    number(product.stock)
  ) {
    showToast(
      `Stok ${product.name} tidak mencukupi.`,
      "error"
    );
    return;
  }

  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      id: uid("CRT"),
      productId,
      qty,
      price: number(product.sellPrice)
    });
  }

  document.getElementById("saleQty").value = 1;

  renderCart();

  showToast(
    "Produk masuk keranjang."
  );
}

function removeFromCart(id) {
  cart =
    cart.filter(
      item => item.id !== id
    );

  renderCart();
}

function clearCart() {
  if (!cart.length) {
    showToast(
      "Keranjang sudah kosong.",
      "warning"
    );
    return;
  }

  if (
    !confirm(
      "Kosongkan seluruh keranjang?"
    )
  ) {
    return;
  }

  cart = [];

  renderCart();

  showToast(
    "Keranjang dikosongkan."
  );
}

function cancelSale() {
  if (!cart.length) {
    showToast(
      "Tidak ada transaksi yang dibatalkan.",
      "warning"
    );
    return;
  }

  if (
    !confirm(
      "Batalkan transaksi penjualan?"
    )
  ) {
    return;
  }

  cart = [];

  renderCart();

  showToast(
    "Transaksi penjualan dibatalkan.",
    "warning"
  );
}

function getCartTotal() {
  return cart.reduce(
    (sum, item) =>
      sum +
      number(item.qty) *
      number(item.price),
    0
  );
}

function renderCart() {
  const tbody =
    document.getElementById("cartTable");

  const totalEl =
    document.getElementById("cartTotal");

  if (!tbody || !totalEl) return;

  if (!cart.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">
          Keranjang kosong
        </td>
      </tr>
    `;

    totalEl.textContent =
      money(0);

    return;
  }

  tbody.innerHTML =
    cart.map(item => {

      const product =
        db.products.find(
          p => p.id === item.productId
        );

      if (!product) return "";

      const subtotal =
        item.qty * item.price;

      return `
        <tr>

          <td>
            ${escapeHTML(product.name)}
          </td>

          <td>
            ${money(item.price)}
          </td>

          <td>
            ${item.qty}
          </td>

          <td>
            ${money(subtotal)}
          </td>

          <td>
            <button
              class="action-btn delete"
              onclick="removeFromCart('${item.id}')"
              type="button"
            >
              Hapus
            </button>
          </td>

        </tr>
      `;
    }).join("");
  totalEl.textContent =
    money(getCartTotal());
}

function saveSale() {
  if (!cart.length) {
    showToast(
      "Keranjang masih kosong.",
      "error"
    );
    return;
  }

  /* Validasi stok sekali lagi */

  for (const item of cart) {

    const product =
      db.products.find(
        p => p.id === item.productId
      );

    if (!product) {
      showToast(
        "Ada produk yang sudah tidak tersedia.",
        "error"
      );
      return;
    }

    if (
      number(product.stock) <
      number(item.qty)
    ) {
      showToast(
        `Stok ${product.name} tidak mencukupi.`,
        "error"
      );
      return;
    }
  }

  const saleId =
    uid("SAL");

  const items =
    cart.map(item => {

      const product =
        db.products.find(
          p => p.id === item.productId
        );

      const subtotal =
        item.qty * item.price;

      product.stock -= item.qty;

      db.stockMovements.push({
        id: uid("STK"),
        date: today(),
        type: "STOK_KELUAR",
        productId: product.id,
        productName: product.name,
        qty: item.qty,
        reference: saleId,
        balance: product.stock
      });

      return {
        productId: product.id,
        productName: product.name,
        qty: item.qty,
        price: item.price,
        buyPrice: number(product.buyPrice),
        subtotal
      };
    });

  const total =
    items.reduce(
      (sum, item) =>
        sum + item.subtotal,
      0
    );

  db.sales.push({
    id: saleId,
    date: today(),
    invoice: saleId,
    customerName: "Pelanggan Umum",
    payment: "cash",
    total,
    paid: total,
    items,
    createdAt: new Date().toISOString()
  });

  saveDB();

  cart = [];

  renderAll();

  showToast(
    "Penjualan berhasil disimpan. Stok otomatis berkurang."
  );
}


/* =========================================================
   PIUTANG
========================================================= */

function initReceivableEvents() {
  const btn =
    document.getElementById(
      "btnAddReceivable"
    );

  if (btn) {
    btn.addEventListener(
      "click",
      openReceivableForm
    );
  }
}

function openReceivableForm() {

  openModal(
    "Piutang Baru",
    `
      <div class="form-grid">

        <div class="form-group">

          <label>Tanggal</label>

          <input
            id="modalReceivableDate"
            type="date"
            value="${today()}"
          >

        </div>

        <div class="form-group">

          <label>Nama Pelanggan</label>

          <input
            id="modalReceivableCustomer"
            placeholder="Nama pelanggan"
          >

        </div>

        <div class="form-group">

          <label>Referensi</label>

          <input
            id="modalReceivableReference"
            placeholder="No. nota / transaksi"
          >

        </div>

        <div class="form-group">

          <label>Total Piutang</label>

          <input
            id="modalReceivableTotal"
            type="number"
            min="1"
            value="0"
          >

        </div>

      </div>
    `,
    saveReceivable
  );
}

function saveReceivable() {

  const date =
    document.getElementById(
      "modalReceivableDate"
    )?.value || today();

  const customer =
    document.getElementById(
      "modalReceivableCustomer"
    )?.value.trim();

  const reference =
    document.getElementById(
      "modalReceivableReference"
    )?.value.trim();

  const total =
    number(
      document.getElementById(
        "modalReceivableTotal"
      )?.value
    );

  if (!customer || total <= 0) {
    showToast(
      "Lengkapi data piutang.",
      "error"
    );
    return;
  }

  db.receivables.push({
    id: uid("PIU"),
    date,
    customerName: customer,
    reference: reference || uid("NOTA"),
    total,
    paid: 0,
    status: "BELUM_LUNAS",
    createdAt: new Date().toISOString()
  });

  saveDB();

  closeModal();
  renderAll();

  showToast(
    "Piutang berhasil dibuat."
  );
}

function renderReceivables() {
  const tbody =
    document.getElementById(
      "receivableTable"
    );

  if (!tbody) return;

  const total =
    db.receivables.reduce(
      (sum, item) =>
        sum + number(item.total),
      0
    );

  const outstanding =
    db.receivables.reduce(
      (sum, item) =>
        sum +
        Math.max(
          0,
          number(item.total) -
          number(item.paid)
        ),
      0
    );

  const totalEl =
    document.getElementById(
      "receivableTotal"
    );

  const outstandingEl =
    document.getElementById(
      "receivableOutstanding"
    );

  if (totalEl) {
    totalEl.textContent =
      money(total);
  }

  if (outstandingEl) {
    outstandingEl.textContent =
      money(outstanding);
  }

  if (!db.receivables.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">
          Belum ada piutang
        </td>
      </tr>
    `;

    return;
  }

  tbody.innerHTML =
    [...db.receivables]
      .reverse()
      .map(item => {

        const remaining =
          Math.max(
            0,
            number(item.total) -
            number(item.paid)
          );

        const status =
          remaining <= 0
            ? "LUNAS"
            : "BELUM LUNAS";

        return `
          <tr>

            <td>${formatDate(item.date)}</td>

            <td>
              ${escapeHTML(item.customerName)}
            </td>

            <td>
              ${escapeHTML(item.reference)}
            </td>

            <td>${money(item.total)}</td>

            <td>${money(item.paid)}</td>

            <td>${money(remaining)}</td>

            <td>
              ${
                status === "LUNAS"
                  ? '<span class="badge badge-success">Lunas</span>'
                  : '<span class="badge badge-danger">Belum Lunas</span>'
              }
            </td>

            <td>

              ${
                remaining > 0
                  ? `
                    <button
                      class="action-btn pay"
                      onclick="payReceivable('${item.id}')"
                      type="button"
                    >
                      Bayar
                    </button>
                  `
                  : "-"
              }

            </td>

          </tr>
        `;
      })
      .join("");
}

function payReceivable(id) {

  const receivable =
    db.receivables.find(
      item => item.id === id
    );

  if (!receivable) return;

  const remaining =
    Math.max(
      0,
      number(receivable.total) -
      number(receivable.paid)
    );

  openModal(
    "Pembayaran Piutang",
    `
      <div class="form-group">

        <label>Pelanggan</label>

        <input
          value="${escapeHTML(
            receivable.customerName
          )}"
          disabled
        >

      </div>

      <div
        class="form-group"
        style="margin-top:12px"
      >

        <label>Sisa Piutang</label>

        <input
          value="${money(remaining)}"
          disabled
        >

      </div>

      <div
        class="form-group"
        style="margin-top:12px"
      >

        <label>Jumlah Pembayaran</label>

        <input
          id="modalReceivablePayment"
          type="number"
          min="1"
          max="${remaining}"
          value="${remaining}"
        >

      </div>
    `,
    () => {

      const amount =
        number(
          document.getElementById(
            "modalReceivablePayment"
          )?.value
        );

      if (
        amount <= 0 ||
        amount > remaining
      ) {
        showToast(
          "Jumlah pembayaran tidak valid.",
          "error"
        );
        return;
      }

      receivable.paid += amount;

      receivable.status =
        receivable.paid >=
        receivable.total
          ? "LUNAS"
          : "BELUM_LUNAS";

      db.payments.push({
        id: uid("PAY"),
        type: "PIUTANG",
        referenceId: receivable.id,
        date: today(),
        amount,
        party: receivable.customerName
      });

      saveDB();

      closeModal();
      renderAll();

      showToast(
        "Pembayaran piutang berhasil dicatat."
      );
    }
  );
        }


  
/* =========================================================
   DASHBOARD
========================================================= */

function renderDashboard() {

  const todaySales =
    db.sales
      .filter(
        sale => sale.date === today()
      )
      .reduce(
        (sum, sale) =>
          sum + number(sale.total),
        0
      );

  const totalDebt =
    db.debts.reduce(
      (sum, debt) =>
        sum +
        Math.max(
          0,
          number(debt.total) -
          number(debt.paid)
        ),
      0
    );

  const totalReceivable =
    db.receivables.reduce(
      (sum, item) =>
        sum +
        Math.max(
          0,
          number(item.total) -
          number(item.paid)
        ),
      0
    );

  const stockValue =
    db.products.reduce(
      (sum, product) =>
        sum +
        number(product.stock) *
        number(product.buyPrice),
      0
    );

  setText(
    "dashSales",
    money(todaySales)
  );

  setText(
    "dashProducts",
    db.products.length
  );

  setText(
    "dashSuppliers",
    db.suppliers.length
  );

  setText(
    "dashDebt",
    money(totalDebt)
  );

  setText(
    "dashReceivable",
    money(totalReceivable)
  );

  setText(
    "dashStockValue",
    money(stockValue)
  );

  renderRecentTransactions();
  renderLowStock();
}

function setText(id, value) {
  const el =
    document.getElementById(id);

  if (el) {
    el.textContent = value;
  }
}

function renderRecentTransactions() {

  const tbody =
    document.getElementById(
      "recentTransactions"
    );

  if (!tbody) return;

  const transactions = [
    ...db.sales.map(s => ({
      date: s.date,
      ref: s.invoice,
      type: "Penjualan",
      total: s.total
    })),

    ...db.purchases.map(p => ({
      date: p.date,
      ref: p.invoice,
      type: "Pembelian",
      total: p.total
    }))
  ]
    .sort(
      (a, b) =>
        new Date(b.date) -
        new Date(a.date)
    )
    .slice(0, 10);

  if (!transactions.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="empty-state">
          Belum ada transaksi
        </td>
      </tr>
    `;

    return;
  }

  tbody.innerHTML =
    transactions.map(item => `
      <tr>

        <td>
          ${formatDate(item.date)}
        </td>

        <td>
          ${escapeHTML(item.ref)}
        </td>

        <td>
          ${item.type}
        </td>

        <td>
          ${money(item.total)}
        </td>

      </tr>
    `).join("");
}

function renderLowStock() {

  const tbody =
    document.getElementById(
      "lowStockList"
    );

  if (!tbody) return;

  const products =
    db.products.filter(
      product =>
        number(product.stock) <=
        number(product.minStock)
    );

  if (!products.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="3" class="empty-state">
          Tidak ada stok menipis
        </td>
      </tr>
    `;

    return;
  }

  tbody.innerHTML =
    products.map(product => `
      <tr>

        <td>
          ${escapeHTML(product.name)}
        </td>

        <td class="stock-low">
          ${product.stock}
        </td>

        <td>
          ${product.minStock}
        </td>

      </tr>
    `).join("");
               }

/* =========================================================
   REPORT
========================================================= */

function renderReports() {

  const sales =
    db.sales.reduce(
      (sum, item) =>
        sum + number(item.total),
      0
    );

  const purchases =
    db.purchases.reduce(
      (sum, item) =>
        sum + number(item.total),
      0
    );

  const profit =
    db.sales.reduce(
      (sum, sale) => {

        const saleProfit =
          sale.items.reduce(
            (itemSum, item) =>
              itemSum +
              (
                number(item.price) -
                number(item.buyPrice)
              ) *
              number(item.qty),
            0
          );

        return sum + saleProfit;
      },
      0
    );

  setText(
    "reportSales",
    money(sales)
  );

  setText(
    "reportPurchases",
    money(purchases)
  );

  setText(
    "reportProfit",
    money(profit)
  );

  const tbody =
    document.getElementById(
      "reportTable"
    );

  if (!tbody) return;

  const rows = [
    ...db.sales.map(sale => ({
      date: sale.date,
      reference: sale.invoice,
      type: "Penjualan",
      total: sale.total
    })),

    ...db.purchases.map(purchase => ({
      date: purchase.date,
      reference: purchase.invoice,
      type: "Pembelian",
      total: purchase.total
    }))
  ]
    .sort(
      (a, b) =>
        new Date(b.date) -
        new Date(a.date)
    );

  if (!rows.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="empty-state">
          Belum ada transaksi
        </td>
      </tr>
    `;

    return;
  }

  tbody.innerHTML =
    rows.map(row => `
      <tr>

        <td>
          ${formatDate(row.date)}
        </td>

        <td>
          ${escapeHTML(row.reference)}
        </td>

        <td>
          ${row.type}
        </td>

        <td>
          ${money(row.total)}
        </td>

      </tr>
    `).join("");
}

/* =========================================================
   SETTINGS
========================================================= */

function initSettingsEvents() {

  const saveBtn =
    document.getElementById(
      "btnSaveSettings"
    );

  if (saveBtn) {
    saveBtn.addEventListener(
      "click",
      saveSettings
    );
  }

  const resetBtn =
    document.getElementById(
      "btnResetData"
    );

  if (resetBtn) {
    resetBtn.addEventListener(
      "click",
      resetDatabase
    );
  }
}

function renderSettings() {

  const name =
    document.getElementById(
      "storeName"
    );

  const phone =
    document.getElementById(
      "storePhone"
    );

  if (name) {
    name.value =
      db.settings.storeName || "";
  }

  if (phone) {
    phone.value =
      db.settings.storePhone || "";
  }
}

function saveSettings() {

  const name =
    document.getElementById(
      "storeName"
    )?.value.trim();

  const phone =
    document.getElementById(
      "storePhone"
    )?.value.trim();

  db.settings.storeName =
    name || "Faeza Store";

  db.settings.storePhone =
    phone || "";

  saveDB();

  showToast(
    "Pengaturan berhasil disimpan."
  );
}


/* =========================================================
   RENDER ALL
========================================================= */

function renderAll() {

  renderDashboard();

  renderProducts();

  renderStock();

  renderSuppliers();

  renderPurchaseSupplierOptions();

  renderPurchaseCart();

  renderPurchases();

  renderDebts();

  renderReceivables();

  renderSaleProducts();

  renderCart();

  renderReports();

  renderSettings();
}

/* =========================================================
   EVENT INITIALIZATION
========================================================= */

function initEvents() {

  initNavigation();

  initMobileMenu();

  initModal();

  initProductEvents();

  initSupplierEvents();

  initPurchaseEvents();

  initSalesEvents();

  initReceivableEvents();

  initSettingsEvents();
}

/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    initEvents();

    renderAll();

    console.log(
      "Faeza ERP V2 berhasil dijalankan."
    );

  }
);

/* =========================================================
   GLOBAL FUNCTIONS
   Dibutuhkan oleh tombol inline HTML
========================================================= */

window.openProductForm =
  openProductForm;

window.deleteProduct =
  deleteProduct;

window.openSupplierForm =
  openSupplierForm;

window.deleteSupplier =
  deleteSupplier;

window.updatePurchaseItem =
  updatePurchaseItem;

window.removePurchaseItem =
  removePurchaseItem;

window.removeFromCart =
  removeFromCart;

window.payDebt =
  payDebt;

window.payReceivable =
  payReceivable;

window.clearCart =
  clearCart;
