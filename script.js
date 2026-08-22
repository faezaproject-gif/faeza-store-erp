/* =========================================================
   FAEZA ERP V2
   SCRIPT.JS
   CLEAN FOUNDATION
========================================================= */

"use strict";

/* =========================================================
   DATABASE
========================================================= */

const STORAGE_KEY = "FAEZA_ERP_V2_DATABASE";

const DEFAULT_DATABASE = {
  products: [],
  suppliers: [],
  customers: [],

  sales: [],
  purchases: [],

  debts: [],
  debtPayments: [],

  receivables: [],
  receivablePayments: [],

  stockMovements: []
};

let db = loadDatabase();

let cart = [];


/* =========================================================
   HELPER
========================================================= */

function $(id) {
  return document.getElementById(id);
}


function money(value) {

  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }
  ).format(Number(value) || 0);

}


function today() {

  return new Date()
    .toISOString()
    .slice(0, 10);

}


function createId(prefix) {

  return (
    prefix +
    "-" +
    Date.now() +
    "-" +
    Math.random()
      .toString(36)
      .substring(2, 7)
  );

}


function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


/* =========================================================
   DATABASE
========================================================= */

function loadDatabase() {

  try {

    const saved =
      localStorage.getItem(STORAGE_KEY);

    if (!saved) {

      return structuredClone(DEFAULT_DATABASE);

    }

    const parsed =
      JSON.parse(saved);

    return {
      ...structuredClone(DEFAULT_DATABASE),
      ...parsed
    };

  } catch (error) {

    console.error(
      "Database gagal dimuat:",
      error
    );

    return structuredClone(DEFAULT_DATABASE);

  }

}


function saveDatabase() {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(db)
  );

}


/* =========================================================
   TOAST
========================================================= */

let toastTimer = null;


function showToast(message) {

  const toast = $("toast");

  if (!toast) return;

  toast.textContent = message;

  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(
    () => {

      toast.classList.remove("show");

    },
    1800
  );

}


/* =========================================================
   MENU
   PENTING:
   HANDLER MENU BERDIRI SENDIRI
========================================================= */

function openMenu() {

  const sideMenu =
    $("sideMenu");

  const backdrop =
    $("menuBackdrop");

  if (!sideMenu) return;

  sideMenu.classList.add("open");

  if (backdrop) {

    backdrop.classList.add("show");

  }

}


function closeMenu() {

  const sideMenu =
    $("sideMenu");

  const backdrop =
    $("menuBackdrop");

  if (sideMenu) {

    sideMenu.classList.remove("open");

  }

  if (backdrop) {

    backdrop.classList.remove("show");

  }

}


function setupMenu() {

  const menuButton =
    $("menuButton");

  const closeButton =
    $("closeMenu");

  const backdrop =
    $("menuBackdrop");

  /*
     MENU UTAMA
  */

  if (menuButton) {

    menuButton.addEventListener(
      "click",
      function (event) {

        event.preventDefault();

        event.stopPropagation();

        const sideMenu =
          $("sideMenu");

        if (
          sideMenu &&
          sideMenu.classList.contains("open")
        ) {

          closeMenu();

        } else {

          openMenu();

        }

      }
    );

  }


  /*
     TOMBOL X
  */

  if (closeButton) {

    closeButton.addEventListener(
      "click",
      function (event) {

        event.preventDefault();

        closeMenu();

      }
    );

  }


  /*
     BACKDROP
  */

  if (backdrop) {

    backdrop.addEventListener(
      "click",
      function () {

        closeMenu();

      }
    );

  }


  /*
     NAVIGATION
     TERPISAH DARI SEMUA HANDLER LAIN
  */

  document
    .querySelectorAll(
      "#mainNavigation [data-page]"
    )
    .forEach(
      function (button) {

        button.addEventListener(
          "click",
          function (event) {

            event.preventDefault();

            const page =
              button.dataset.page;

            openPage(page);

          }
        );

      }
    );

}


/* =========================================================
   PAGE NAVIGATION
========================================================= */

function openPage(pageName) {

  document
    .querySelectorAll(".page")
    .forEach(
      function (page) {

        page.classList.remove(
          "active"
        );

      }
    );


  const target =
    $("page-" + pageName);

  if (!target) {

    console.warn(
      "Page tidak ditemukan:",
      pageName
    );

    return;

  }


  target.classList.add(
    "active"
  );


  closeMenu();


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });


  renderAll();

}


/* =========================================================
   DASHBOARD
========================================================= */

function renderDashboard() {

  const salesTotal =
    db.sales.reduce(
      (sum, item) =>
        sum + Number(item.total || 0),
      0
    );


  const purchaseTotal =
    db.purchases.reduce(
      (sum, item) =>
        sum + Number(item.total || 0),
      0
    );


  const debtTotal =
    db.debts.reduce(
      (sum, item) =>
        sum + Number(item.remaining || 0),
      0
    );


  const receivableTotal =
    db.receivables.reduce(
      (sum, item) =>
        sum + Number(item.remaining || 0),
      0
    );


  const cards =
    $("dashboardCards");

  if (cards) {

    cards.innerHTML = `

      <div class="dashboard-card">
        <div class="dashboard-card-label">
          Penjualan
        </div>

        <div class="dashboard-card-value">
          ${money(salesTotal)}
        </div>
      </div>


      <div class="dashboard-card">
        <div class="dashboard-card-label">
          Pembelian
        </div>

        <div class="dashboard-card-value">
          ${money(purchaseTotal)}
        </div>
      </div>


      <div class="dashboard-card">
        <div class="dashboard-card-label">
          Hutang
        </div>

        <div class="dashboard-card-value">
          ${money(debtTotal)}
        </div>
      </div>


      <div class="dashboard-card">
        <div class="dashboard-card-label">
          Piutang
        </div>

        <div class="dashboard-card-value">
          ${money(receivableTotal)}
        </div>
      </div>

    `;

  }


  const lowStock =
    $("lowStockList");

  if (!lowStock) return;


  const products =
    db.products.filter(
      product =>
        Number(product.stock || 0) <=
        Number(product.minStock || 0)
    );


  if (!products.length) {

    lowStock.innerHTML = `
      <div class="empty-state">
        Semua stok masih aman.
      </div>
    `;

    return;

  }


  lowStock.innerHTML =
    products
      .map(
        product => `

          <div class="cart-row">

            <span>
              ${escapeHTML(product.name)}
            </span>

            <strong>
              ${product.stock}
              ${escapeHTML(product.unit)}
            </strong>

          </div>

        `
      )
      .join("");

}


/* =========================================================
   PRODUCT
========================================================= */

function saveProduct() {

  const name =
    $("productName")?.value.trim();

  if (!name) {

    showToast(
      "Nama produk wajib diisi."
    );

    return;

  }


  const product = {

    id: createId("PROD"),

    sku:
      "SKU-" +
      String(
        db.products.length + 1
      ).padStart(4, "0"),

    name,

    category:
      $("productCategory")?.value.trim() || "",

    unit:
      $("productUnit")?.value.trim() || "pcs",

    buy:
      Number(
        $("productBuy")?.value
      ) || 0,

    sell:
      Number(
        $("productSell")?.value
      ) || 0,

    stock:
      Number(
        $("productStock")?.value
      ) || 0,

    minStock:
      Number(
        $("productMin")?.value
      ) || 0,

    createdAt:
      new Date().toISOString()

  };


  db.products.push(product);

  saveDatabase();

  clearProductForm();

  renderAll();

  showToast(
    "Produk berhasil disimpan."
  );

}


function clearProductForm() {

  [
    "productName",
    "productCategory",
    "productUnit",
    "productBuy",
    "productSell",
    "productStock",
    "productMin"
  ]
    .forEach(
      id => {

        const element = $(id);

        if (element) {

          element.value = "";

        }

      }
    );

}


function renderProducts() {

  const container =
    $("productTable");

  if (!container) return;


  const search =
    (
      $("productSearch")?.value ||
      ""
    )
      .toLowerCase()
      .trim();


  const products =
    db.products.filter(
      product =>
        product.name
          .toLowerCase()
          .includes(search)
    );


  if (!products.length) {

    container.innerHTML = `
      <div class="empty-state">
        Belum ada produk.
      </div>
    `;

    return;

  }


  container.innerHTML = `

    <div class="table-wrap">

      <table>

        <thead>

          <tr>

            <th>SKU</th>
            <th>Produk</th>
            <th>Stok</th>
            <th>Harga Jual</th>
<th>Aksi</th>

          </tr>

        </thead>

        <tbody>

          ${products
            .map(
              product => `

                <tr>

                  <td>
                    ${escapeHTML(product.sku)}
                  </td>

                  <td>
                    ${escapeHTML(product.name)}
                  </td>

                  <td>
                    ${product.stock}
                    ${escapeHTML(product.unit)}
                  </td>

                  <td>
                    ${money(product.sell)}
                  </td>
                  
                  <td>
  <div class="action-row">

    <button
      type="button"
      class="button-secondary"
      data-edit-product="${product.id}"
    >
      Edit
    </button>

    <button
      type="button"
      class="button-danger"
      data-delete-product="${product.id}"
    >
      Hapus
    </button>

  </div>
</td>

                </tr>

              `
            )
            .join("")}

        </tbody>

      </table>

    </div>

  `;

}


/* =========================================================
   STOCK CARD RENDER
========================================================= */

function renderStockCardProducts() {

  const select =
    $("stockCardProduct");

  if (!select) return;


  const currentValue =
    select.value;


  select.innerHTML = `
    <option value="">
      Pilih produk
    </option>

    ${
      (db.products || [])
        .map(
          product => `
            <option value="${escapeHTML(product.id)}">
              ${escapeHTML(product.name)}
            </option>
          `
        )
        .join("")
    }
  `;


  if (
    currentValue &&
    db.products.some(
      product =>
        product.id === currentValue
    )
  ) {

    select.value =
      currentValue;

  }

}

     function renderStockCard() {

  const container =
    $("stockCardTable");

  const select =
    $("stockCardProduct");

  if (!container || !select) {
    return;
  }


  const productId =
    select.value;


  if (!productId) {

    container.innerHTML = `
      Pilih produk untuk melihat kartu stok.
    `;

    return;
  }


  const product =
    db.products.find(
      item =>
        item.id === productId
    );


  if (!product) {

    container.innerHTML = `
      Produk tidak ditemukan.
    `;

    return;
  }


  const rows =
    getStockCard(productId);


  if (!rows.length) {

    container.innerHTML = `
      <div class="empty-state">
        Belum ada riwayat stok untuk
        <strong>
          ${escapeHTML(product.name)}
        </strong>.
      </div>
    `;

    return;
  }


  container.innerHTML = `

    <div class="table-wrap">

      <table>

        <thead>

          <tr>
            <th>Tanggal</th>
            <th>Referensi</th>
            <th>Jenis</th>
            <th>Masuk</th>
            <th>Keluar</th>
            <th>Saldo</th>
          </tr>

        </thead>

        <tbody>

          ${
            rows
              .map(
                row => `

                  <tr>

                    <td>
                      ${escapeHTML(
                        row.date
                      )}
                    </td>

                    <td>
                      ${escapeHTML(
                        row.reference
                      )}
                    </td>

                    <td>
                      ${
                        row.type === "IN"
                          ? "Stok Masuk"
                          : "Stok Keluar"
                      }
                    </td>

                    <td>
                      ${
                        row.masuk || "-"
                      }
                    </td>

                    <td>
                      ${
                        row.keluar || "-"
                      }
                    </td>

                    <td>
                      <strong>
                        ${row.balance}
                      </strong>
                    </td>

                  </tr>

                `
              )
              .join("")
          }

        </tbody>

      </table>

    </div>

  `;

}

function editProduct(id) {

  const product =
    db.products.find(
      item => item.id === id
    );

  if (!product) {
    showToast(
      "Produk tidak ditemukan."
    );
    return;
  }

  const name =
    prompt(
      "Nama produk:",
      product.name
    );

  if (name === null) {
    return;
  }

  const cleanName =
    name.trim();

  if (!cleanName) {
    showToast(
      "Nama produk wajib diisi."
    );
    return;
  }

  const category =
    prompt(
      "Kategori:",
      product.category || ""
    );

  if (category === null) {
    return;
  }

  const unit =
    prompt(
      "Satuan:",
      product.unit || "pcs"
    );

  if (unit === null) {
    return;
  }

  const buy =
    prompt(
      "Harga beli:",
      product.buy || 0
    );

  if (buy === null) {
    return;
  }

  const sell =
    prompt(
      "Harga jual:",
      product.sell || 0
    );

  if (sell === null) {
    return;
  }

  const minStock =
    prompt(
      "Minimum stok:",
      product.minStock || 0
    );

  if (minStock === null) {
    return;
  }

  product.name =
    cleanName;

  product.category =
    category.trim();

  product.unit =
    unit.trim() || "pcs";

  product.buy =
    Number(buy) || 0;

  product.sell =
    Number(sell) || 0;

  product.minStock =
    Number(minStock) || 0;

  saveDatabase();

  renderAll();

  showToast(
    "Produk berhasil diperbarui."
  );
}

function deleteProduct(id) {

  const product =
    db.products.find(
      item => item.id === id
    );

  if (!product) {

    showToast(
      "Produk tidak ditemukan."
    );

    return;
  }


  /*
     CEK RIWAYAT TRANSAKSI
  */

  const usedInSales =
    Array.isArray(db.sales) &&
    db.sales.some(
      sale =>
        Array.isArray(sale.items) &&
        sale.items.some(
          item =>
            item.productId === id
        )
    );


  const usedInPurchases =
    Array.isArray(db.purchases) &&
    db.purchases.some(
      purchase =>
        Array.isArray(purchase.items) &&
        purchase.items.some(
          item =>
            item.productId === id
        )
    );


  if (
    usedInSales ||
    usedInPurchases
  ) {

    showToast(
      "Produk sudah memiliki riwayat transaksi dan tidak dapat dihapus."
    );

    return;
  }


  /*
     CEK STOK TERSISA
  */

  if (
    Number(product.stock || 0) > 0
  ) {

    const confirmStock =
      window.confirm(
        `Produk "${product.name}" masih memiliki stok ${product.stock} ${product.unit}.\n\nTetap hapus produk?`
      );

    if (!confirmStock) {
      return;
    }
  }


  /*
     KONFIRMASI AKHIR
  */

  const confirmed =
    window.confirm(
      `Hapus produk "${product.name}"?`
    );


  if (!confirmed) {
    return;
  }


  db.products =
    db.products.filter(
      item =>
        item.id !== id
    );


  saveDatabase();

  renderAll();

  showToast(
    "Produk berhasil dihapus."
  );

}


/* =========================================================
   STOCK CARD
========================================================= */

function getStockCard(productId) {

  const movements =
    (db.stockMovements || [])
      .filter(
        movement =>
          movement.productId === productId
      )
      .sort(
        (a, b) =>
          String(a.date)
            .localeCompare(
              String(b.date)
            )
      );


  let balance = 0;


  return movements.map(
    movement => {

      const masuk =
        movement.type === "IN"
          ? Number(movement.qty) || 0
          : 0;


      const keluar =
        movement.type === "OUT"
          ? Number(movement.qty) || 0
          : 0;


      balance =
        balance +
        masuk -
        keluar;


      return {

        date:
          movement.date || "",

        reference:
          movement.reference || "",

        type:
          movement.type || "",

        masuk,

        keluar,

        balance

      };

    }
  );

}

/* =========================================================
   SUPPLIER
   HANDLER BERDIRI SENDIRI
========================================================= */

function saveSupplier() {

  const name =
    $("supplierName")?.value.trim();

  if (!name) {

    showToast(
      "Nama supplier wajib diisi."
    );

    return;

  }


  const supplier = {

    id: createId("SUP"),

    code:
      "SUP-" +
      String(
        db.suppliers.length + 1
      ).padStart(3, "0"),

    name,

    phone:
      $("supplierPhone")?.value.trim() || "",

    address:
      $("supplierAddress")?.value.trim() || "",

    note:
      $("supplierNote")?.value.trim() || "",

    createdAt:
      new Date().toISOString()

  };


  db.suppliers.push(
    supplier
  );


  saveDatabase();

  clearSupplierForm();

  renderAll();

  showToast(
    "Supplier berhasil disimpan."
  );

}


function clearSupplierForm() {

  [
    "supplierName",
    "supplierPhone",
    "supplierAddress",
    "supplierNote"
  ]
    .forEach(
      id => {

        const element = $(id);

        if (element) {

          element.value = "";

        }

      }
    );

}


function renderSuppliers() {

  const container =
    $("supplierTable");

  if (!container) return;


  const search =
    (
      $("supplierSearch")?.value ||
      ""
    )
      .toLowerCase()
      .trim();


  const suppliers =
    db.suppliers.filter(
      supplier =>
        supplier.name
          .toLowerCase()
          .includes(search)
    );


  if (!suppliers.length) {

    container.innerHTML = `
      <div class="empty-state">
        Belum ada supplier.
      </div>
    `;

    return;

  }


  container.innerHTML = `

    <div class="table-wrap">

      <table>

        <thead>

          <tr>

            <th>Kode</th>
            <th>Supplier</th>
            <th>Telepon</th>
            <th>Alamat</th>
            <th>Aksi</th>

          </tr>

        </thead>

        <tbody>

          ${suppliers
            .map(
              supplier => `

                <tr>

                  <td>
                    ${escapeHTML(
                      supplier.code
                    )}
                  </td>

                  <td>
                    ${escapeHTML(
                      supplier.name
                    )}
                  </td>

                  <td>
                    ${escapeHTML(
                      supplier.phone
                    )}
                  </td>

                  <td>
                    ${escapeHTML(
                      supplier.address
                    )}
                  </td>

                  <td>
  <div class="action-row">

    <button
      type="button"
      class="button-secondary"
      data-edit-supplier="${supplier.id}"
    >
      Edit
    </button>

    <button
      type="button"
      class="button-danger"
      data-delete-supplier="${supplier.id}"
    >
      Hapus
    </button>

  </div>
</td>

                </tr>

              `
            )
            .join("")}

        </tbody>

      </table>

    </div>

  `;

}

function editSupplier(id) {

  const supplier =
    db.suppliers.find(
      item => item.id === id
    );

  if (!supplier) {
    showToast("Supplier tidak ditemukan.");
    return;
  }

  const name =
    prompt(
      "Nama supplier:",
      supplier.name
    );

  if (name === null) {
    return;
  }

  const cleanName =
    name.trim();

  if (!cleanName) {
    showToast("Nama supplier wajib diisi.");
    return;
  }

  const phone =
    prompt(
      "Nomor WhatsApp:",
      supplier.phone || ""
    );

  if (phone === null) {
    return;
  }

  const address =
    prompt(
      "Alamat supplier:",
      supplier.address || ""
    );

  if (address === null) {
    return;
  }

  supplier.name =
    cleanName;

  supplier.phone =
    phone.trim();

  supplier.address =
    address.trim();

  saveDatabase();

  renderAll();

  showToast(
    "Supplier berhasil diperbarui."
  );
}


function deleteSupplier(id) {

  const supplier =
    db.suppliers.find(
      item => item.id === id
    );

  if (!supplier) {
    showToast("Supplier tidak ditemukan.");
    return;
  }


  /*
     CEK APAKAH SUPPLIER
     SUDAH DIPAKAI PEMBELIAN
  */

  const used =
    db.purchases.some(
      purchase =>
        purchase.supplierId === id
    );


  if (used) {

    showToast(
      "Supplier sudah memiliki transaksi pembelian dan tidak dapat dihapus."
    );

    return;
  }


  const confirmed =
    window.confirm(
      `Hapus supplier "${supplier.name}"?`
    );


  if (!confirmed) {
    return;
  }


  db.suppliers =
    db.suppliers.filter(
      item => item.id !== id
    );


  saveDatabase();

  renderAll();

  showToast(
    "Supplier berhasil dihapus."
  );
}


/* =========================================================
   PURCHASE
========================================================= */

function fillPurchaseSelectors() {

  const supplierSelect =
    $("purchaseSupplier");

  if (supplierSelect) {

    supplierSelect.innerHTML = `

      <option value="">
        Pilih supplier
      </option>

      ${db.suppliers
        .map(
          supplier => `

            <option
              value="${supplier.id}"
            >
              ${escapeHTML(
                supplier.name
              )}
            </option>

          `
        )
        .join("")}

    `;

  }


  const productSelect =
    $("purchaseProduct");

  if (productSelect) {

    productSelect.innerHTML = `

      <option value="">
        Pilih produk
      </option>

      ${db.products
        .map(
          product => `

            <option
              value="${product.id}"
            >
              ${escapeHTML(
                product.name
              )}
            </option>

          `
        )
        .join("")}

    `;

  }

}


function setPurchasePrice() {

  const productId =
    $("purchaseProduct")?.value;

  const product =
    db.products.find(
      item =>
        item.id === productId
    );


  if (product && $("purchasePrice")) {

    $("purchasePrice").value =
      product.buy || "";

  }

}


function savePurchase() {

  const supplierId =
    $("purchaseSupplier")?.value;

  const productId =
    $("purchaseProduct")?.value;

  const qty =
    Number(
      $("purchaseQty")?.value
    ) || 0;

  const price =
    Number(
      $("purchasePrice")?.value
    ) || 0;


  if (
    !supplierId ||
    !productId ||
    qty <= 0
  ) {

    showToast(
      "Lengkapi data pembelian."
    );

    return;

  }


  const product =
    db.products.find(
      item =>
        item.id === productId
    );


  if (!product) {

    showToast(
      "Produk tidak ditemukan."
    );

    return;

  }


  const total =
    qty * price;


  const purchase = {

    id: createId("PUR"),

    number:
      "PO-" +
      Date.now(),

    date:
      today(),

    supplierId,

    productId,

    qty,

    price,

    total,

    payment:
      $("purchasePayment")?.value ||
      "cash",

    dueDate:
      $("purchaseDueDate")?.value ||
      ""

  };


  /*
     STOK MASUK
  */

  product.stock =
    Number(product.stock || 0) +
    qty;


  /*
     RIWAYAT STOK
  */

  db.stockMovements.push({

    id: createId("STK"),

    date: today(),

    type: "IN",

    reference:
      purchase.number,

    productId,

    qty

  });


  /*
     PEMBELIAN
  */

  db.purchases.push(
    purchase
  );


  /*
     HUTANG
  */

  if (
    purchase.payment ===
    "credit"
  ) {

    db.debts.push({

      id: createId("DEBT"),

      purchaseId:
        purchase.id,

      supplierId,

      total,

      paid: 0,

      remaining:
        total,

      dueDate:
        purchase.dueDate,

      status:
        "unpaid"

    });

  }


  saveDatabase();

  renderAll();

  showToast(
    "Pembelian berhasil disimpan."
  );

}


/* =========================================================
   CASHIER
========================================================= */

function renderCashierProducts() {

  const container =
    $("cashierProducts");

  if (!container) return;


  const search =
    (
      $("cashierSearch")?.value ||
      ""
    )
      .toLowerCase()
      .trim();


  const products =
    db.products.filter(
      product =>
        product.name
          .toLowerCase()
          .includes(search) &&
        Number(product.stock) > 0
    );


  if (!products.length) {

    container.innerHTML = `
      <div class="empty-state">
        Tidak ada produk.
      </div>
    `;

    return;

  }


  container.innerHTML =
    products
      .map(
        product => `

          <div
            class="product-item"
            data-add-cart="${product.id}"
          >

            <strong>
              ${escapeHTML(
                product.name
              )}
            </strong>

            <small>
              ${money(product.sell)}
              · stok ${product.stock}
            </small>

          </div>

        `
      )
      .join("");

}


function addToCart(productId) {

  const product =
    db.products.find(
      item =>
        item.id === productId
    );


  if (!product) return;


  const existing =
    cart.find(
      item =>
        item.productId === productId
    );


  if (existing) {

    if (
      existing.qty >=
      Number(product.stock)
    ) {

      showToast(
        "Stok tidak mencukupi."
      );

      return;

    }

    existing.qty++;

  } else {

    cart.push({

      productId,

      qty: 1,

      price:
        Number(product.sell || 0)

    });

  }


  renderCart();

}


function renderCart() {

  const container =
    $("cartList");

  const totalElement =
    $("cartTotal");


  if (!container) return;


  if (!cart.length) {

    container.innerHTML = `
      <div class="empty-state">
        Keranjang kosong.
      </div>
    `;

    if (totalElement) {

      totalElement.textContent =
        money(0);

    }

    return;

  }


  let total = 0;


  container.innerHTML =
    cart
      .map(
        item => {

          const product =
            db.products.find(
              product =>
                product.id ===
                item.productId
            );


          const subtotal =
            item.qty *
            item.price;


          total += subtotal;


          return `

            <div class="cart-row">

              <span>

                ${escapeHTML(
                  product?.name || "-"
                )}

                × ${item.qty}

              </span>

              <strong>
                ${money(subtotal)}
              </strong>

            </div>

          `;

        }
      )
      .join("");


  if (totalElement) {

    totalElement.textContent =
      money(total);

  }

}


function saveSale() {

  if (!cart.length) {

    showToast(
      "Keranjang masih kosong."
    );

    return;

  }


  const total =
    cart.reduce(
      (sum, item) =>
        sum +
        item.qty *
        item.price,
      0
    );


  const paid =
    Number(
      $("salePaid")?.value
    ) || 0;


  const payment =
    $("salePayment")?.value ||
    "cash";


  if (
    payment === "cash" &&
    paid < total
  ) {

    showToast(
      "Pembayaran kurang."
    );

    return;

  }


  
            /*
     KURANGI STOK
  */

  cart.forEach(
    item => {

      const product =
        db.products.find(
          product =>
            product.id ===
            item.productId
        );


      if (product) {

        product.stock =
          Number(product.stock) -
          item.qty;

        db.stockMovements.push({

          id:
            createId("STK"),

          date:
            today(),

          type:
            "OUT",

          reference:
            "SO-" +
            Date.now(),

          productId:
            item.productId,

          qty:
            item.qty

        });

      }

    }
  );


  const sale = {

    id:
      createId("SALE"),

    number:
      "SO-" +
      Date.now(),

    date:
      today(),

    customerId:
      $("saleCustomer")?.value ||
      "",

    items:
      structuredClone(cart),

    total,

    paid,

    payment,

    dueDate:
      $("saleDueDate")?.value ||
      ""

  };


  db.sales.push(
    sale
  );


  /*
     PIUTANG
  */

  if (
    payment ===
    "credit"
  ) {

    db.receivables.push({

      id:
        createId("REC"),

      saleId:
        sale.id,

      customerId:
        sale.customerId,

      total,

      paid,

      remaining:
        total - paid,

      dueDate:
        sale.dueDate,

      status:
        paid >= total
          ? "paid"
          : "unpaid"

    });

  }


  cart = [];


  saveDatabase();

  renderAll();

  showToast(
    "Penjualan berhasil disimpan."
  );

}

  
/* =========================================================
   CUSTOMER
========================================================= */

function saveCustomer() {

  const name =
    $("customerName")?.value.trim();


  if (!name) {

    showToast(
      "Nama pelanggan wajib diisi."
    );

    return;

  }


  db.customers.push({

    id:
      createId("CUS"),

    name,

    phone:
      $("customerPhone")?.value.trim() ||
      "",

    address:
      $("customerAddress")?.value.trim() ||
      ""

  });


  saveDatabase();

  renderAll();

  showToast(
    "Pelanggan berhasil disimpan."
  );

}


function renderCustomers() {

  const container =
    $("customerTable");

  if (!container) return;


  if (!db.customers.length) {

    container.innerHTML = `
      <div class="empty-state">
        Belum ada pelanggan.
      </div>
    `;

    return;

  }


  container.innerHTML = `

    <div class="table-wrap">

      <table>

        <thead>

          <tr>
            <th>Nama</th>
            <th>Telepon</th>
            <th>Alamat</th>
          </tr>

        </thead>

        <tbody>

          ${db.customers
            .map(
              customer => `

                <tr>

                  <td>
                    ${escapeHTML(
                      customer.name
                    )}
                  </td>

                  <td>
                    ${escapeHTML(
                      customer.phone
                    )}
                  </td>

                  <td>
                    ${escapeHTML(
                      customer.address
                    )}
                  </td>

                </tr>

              `
            )
            .join("")}

        </tbody>

      </table>

    </div>

  `;

}


function fillCustomerSelector() {

  const select =
    $("saleCustomer");

  if (!select) return;


  select.innerHTML = `

    <option value="">
      Pelanggan umum
    </option>

    ${db.customers
      .map(
        customer => `

          <option
            value="${customer.id}"
          >
            ${escapeHTML(
              customer.name
            )}
          </option>

        `
      )
      .join("")}

  `;

}



/* =========================================================
   DEBT
========================================================= */

function renderDebts() {

  const container =
    $("debtTable");

  const selector =
    $("debtSelect");


  if (container) {

    if (!db.debts.length) {

      container.innerHTML = `
        <div class="empty-state">
          Belum ada hutang.
        </div>
      `;

    } else {

      container.innerHTML = `

        <div class="table-wrap">

          <table>

            <thead>

              <tr>
                <th>Supplier</th>
                <th>Total</th>
                <th>Sisa</th>
                <th>Status</th>
              </tr>

            </thead>

            <tbody>

              ${db.debts
                .map(
                  debt => {

                    const supplier =
                      db.suppliers.find(
                        item =>
                          item.id ===
                          debt.supplierId
                      );


                    return `

                      <tr>

                        <td>
                          ${escapeHTML(
                            supplier?.name ||
                            "-"
                          )}
                        </td>

                        <td>
                          ${money(
                            debt.total
                          )}
                        </td>

                        <td>
                          ${money(
                            debt.remaining
                          )}
                        </td>

                        <td>
                          ${escapeHTML(
                            debt.status
                          )}
                        </td>

                      </tr>

                    `;

                  }
                )
                .join("")}

            </tbody>

          </table>

        </div>

      `;

    }

  }


  if (selector) {

    selector.innerHTML = `

      <option value="">
        Pilih hutang
      </option>

      ${db.debts
        .filter(
          debt =>
            Number(
              debt.remaining
            ) > 0
        )
        .map(
          debt => `

            <option
              value="${debt.id}"
            >
              ${money(
                debt.remaining
              )}
            </option>

          `
        )
        .join("")}

    `;

  }

}


function payDebt() {

  const debtId =
    $("debtSelect")?.value;


  const amount =
    Number(
      $("debtPayAmount")?.value
    ) || 0;


  const debt =
    db.debts.find(
      item =>
        item.id === debtId
    );


  if (
    !debt ||
    amount <= 0 ||
    amount > debt.remaining
  ) {

    showToast(
      "Pembayaran hutang tidak valid."
    );

    return;

  }


  debt.paid += amount;

  debt.remaining -= amount;

  debt.status =
    debt.remaining > 0
      ? "partial"
      : "paid";


  db.debtPayments.push({

    id:
      createId("PAY"),

    debtId,

    date:
      today(),

    amount

  });


  saveDatabase();

  renderAll();

  showToast(
    "Pembayaran hutang tersimpan."
  );

}


/* =========================================================
   RECEIVABLE
========================================================= */

function renderReceivables() {

  const container =
    $("receivableTable");

  const selector =
    $("receivableSelect");


  if (container) {

    if (!db.receivables.length) {

      container.innerHTML = `
        <div class="empty-state">
          Belum ada piutang.
        </div>
      `;

    } else {

      container.innerHTML = `

        <div class="table-wrap">

          <table>

            <thead>

              <tr>
                <th>Pelanggan</th>
                <th>Total</th>
                <th>Sisa</th>
                <th>Status</th>
              </tr>

            </thead>

            <tbody>

              ${db.receivables
                .map(
                  receivable => {

                    const customer =
                      db.customers.find(
                        item =>
                          item.id ===
                          receivable.customerId
                      );


                    return `

                      <tr>

                        <td>
                          ${escapeHTML(
                            customer?.name ||
                            "Umum"
                          )}
                        </td>

                        <td>
                          ${money(
                            receivable.total
                          )}
                        </td>

                        <td>
                          ${money(
                            receivable.remaining
                          )}
                        </td>

                        <td>
                          ${escapeHTML(
                            receivable.status
                          )}
                        </td>

                      </tr>

                    `;

                  }
                )
                .join("")}

            </tbody>

          </table>

        </div>

      `;

    }

  }


  if (selector) {

    selector.innerHTML = `

      <option value="">
        Pilih piutang
      </option>

      ${db.receivables
        .filter(
          item =>
            Number(
              item.remaining
            ) > 0
        )
        .map(
          item => `

            <option
              value="${item.id}"
            >
              ${money(
                item.remaining
              )}
            </option>

          `
        )
        .join("")}

    `;

  }

}


function payReceivable() {

  const id =
    $("receivableSelect")?.value;


  const amount =
    Number(
      $("receivablePayAmount")?.value
    ) || 0;


  const receivable =
    db.receivables.find(
      item =>
        item.id === id
    );


  if (
    !receivable ||
    amount <= 0 ||
    amount > receivable.remaining
  ) {

    showToast(
      "Pembayaran piutang tidak valid."
    );

    return;

  }


  receivable.paid += amount;

  receivable.remaining -= amount;

  receivable.status =
    receivable.remaining > 0
      ? "partial"
      : "paid";


  db.receivablePayments.push({

    id:
      createId("RPAY"),

    receivableId:
      id,

    date:
      today(),

    amount

  });


  saveDatabase();

  renderAll();

  showToast(
    "Pembayaran piutang tersimpan."
  );

}


/* =========================================================
   PURCHASE TABLE
========================================================= */

function renderPurchases() {

  const container =
    $("purchaseTable");

  if (!container) return;


  if (!db.purchases.length) {

    container.innerHTML = `
      <div class="empty-state">
        Belum ada transaksi pembelian.
      </div>
    `;

    return;

  }


  container.innerHTML = `

    <div class="table-wrap">

      <table>

        <thead>

          <tr>
            <th>No</th>
            <th>Tanggal</th>
            <th>Supplier</th>
            <th>Total</th>
          </tr>

        </thead>

        <tbody>

          ${db.purchases
            .slice()
            .reverse()
            .map(
              purchase => {

                const supplier =
                  db.suppliers.find(
                    item =>
                      item.id ===
                      purchase.supplierId
                  );


                return `

                  <tr>

                    <td>
                      ${escapeHTML(
                        purchase.number
                      )}
                    </td>

                    <td>
                      ${purchase.date}
                    </td>

                    <td>
                      ${escapeHTML(
                        supplier?.name ||
                        "-"
                      )}
                    </td>

                    <td>
                      ${money(
                        purchase.total
                      )}
                    </td>

                  </tr>

                `;

              }
            )
            .join("")}

        </tbody>

      </table>

    </div>

  `;

}


 /* =========================================================
   REPORT
========================================================= */

function renderReports() {

  const cards =
    $("reportCards");

  const table =
    $("salesTable");


  const sales =
    db.sales.reduce(
      (sum, item) =>
        sum + Number(item.total || 0),
      0
    );


  const purchases =
    db.purchases.reduce(
      (sum, item) =>
        sum + Number(item.total || 0),
      0
    );


  if (cards) {

    cards.innerHTML = `

      <div class="dashboard-card">

        <div class="dashboard-card-label">
          Total Penjualan
        </div>

        <div class="dashboard-card-value">
          ${money(sales)}
        </div>

      </div>


      <div class="dashboard-card">

        <div class="dashboard-card-label">
          Total Pembelian
        </div>

        <div class="dashboard-card-value">
          ${money(purchases)}
        </div>

      </div>

    `;

  }


  if (table) {

    if (!db.sales.length) {

      table.innerHTML = `
        <div class="empty-state">
          Belum ada penjualan.
        </div>
      `;

    } else {

      table.innerHTML = `

        <div class="table-wrap">

          <table>

            <thead>

              <tr>
                <th>No</th>
                <th>Tanggal</th>
                <th>Total</th>
              </tr>

            </thead>

            <tbody>

              ${db.sales
                .slice()
                .reverse()
                .map(
                  sale => `

                    <tr>

                      <td>
                        ${escapeHTML(
                          sale.number
                        )}
                      </td>

                      <td>
                        ${sale.date}
                      </td>

                      <td>
                        ${money(
                          sale.total
                        )}
                      </td>

                    </tr>

                  `
                )
                .join("")}

            </tbody>

          </table>

        </div>

      `;

    }

  }

}


/* =========================================================
   DEBT PAYMENT TABLE
========================================================= */

function renderDebtPayments() {

  const container =
    $("debtPaymentTable");

  if (!container) return;


  if (!db.debtPayments.length) {

    container.innerHTML = `
      <div class="empty-state">
        Belum ada pembayaran hutang.
      </div>
    `;

    return;

  }


  container.innerHTML = `

    <div class="table-wrap">

      <table>

        <thead>

          <tr>
            <th>Tanggal</th>
            <th>Jumlah</th>
          </tr>

        </thead>

        <tbody>

          ${db.debtPayments
            .slice()
            .reverse()
            .map(
              payment => `

                <tr>

                  <td>
                    ${payment.date}
                  </td>

                  <td>
                    ${money(
                      payment.amount
                    )}
                  </td>

                </tr>

              `
            )
            .join("")}

        </tbody>

      </table>

    </div>

  `;

}



/* =========================================================
   BACKUP
========================================================= */

function backupDatabase() {

  const data =
    JSON.stringify(
      db,
      null,
      2
    );


  const blob =
    new Blob(
      [data],
      {
        type:
          "application/json"
      }
    );


  const url =
    URL.createObjectURL(
      blob
    );


  const link =
    document.createElement(
      "a"
    );


  link.href = url;

  link.download =
    "faeza-erp-backup-" +
    today() +
    ".json";


  document.body.appendChild(
    link
  );

  link.click();

  link.remove();

  URL.revokeObjectURL(
    url
  );


  showToast(
    "Backup berhasil dibuat."
  );

}


function restoreDatabase(file) {

  if (!file) return;


  const reader =
    new FileReader();


  reader.onload =
    function (event) {

      try {

        const restored =
          JSON.parse(
            event.target.result
          );


        db = {
          ...structuredClone(
            DEFAULT_DATABASE
          ),

          ...restored

        };


        saveDatabase();

        renderAll();

        showToast(
          "Restore berhasil."
        );

      } catch (error) {

        console.error(
          error
        );

        showToast(
          "File backup tidak valid."
        );

      }

    };


  reader.readAsText(
    file
  );

}





/* =========================================================
   RESET
========================================================= */

function resetDatabase() {

  const confirmation =
    window.confirm(
      "Yakin ingin menghapus seluruh data Faeza ERP?"
    );


  if (!confirmation) return;


  localStorage.removeItem(
    STORAGE_KEY
  );


  db =
    structuredClone(
      DEFAULT_DATABASE
    );


  cart = [];


  renderAll();

  showToast(
    "Database berhasil direset."
  );

}


/* =========================================================
   STOCK CARD
========================================================= */

function getStockCard(productId) {

  const product =
    db.products.find(
      item =>
        item.id === productId
    );

  if (!product) {
    return [];
  }


  const movements =
    (db.stockMovements || [])
      .filter(
        movement =>
          movement.productId ===
          productId
      )
      .sort(
        (a, b) =>
          String(a.date)
            .localeCompare(
              String(b.date)
            )
      );


  let balance = 0;


  return movements.map(
    movement => {

      const masuk =
        movement.type === "IN"
          ? Number(movement.qty) || 0
          : 0;


      const keluar =
        movement.type === "OUT"
          ? Number(movement.qty) || 0
          : 0;


      balance =
        balance +
        masuk -
        keluar;


      return {

        date:
          movement.date || "",

        reference:
          movement.reference || "",

        type:
          movement.type || "",

        masuk,

        keluar,

        balance

      };

    }
  );

}


/* =========================================================
   RENDER ALL
========================================================= */

function renderAll() {

  renderDashboard();

  renderProducts();

  renderSuppliers();

  fillPurchaseSelectors();

  renderPurchases();

  renderCashierProducts();

  renderCart();

  fillCustomerSelector();

  renderCustomers();

  renderDebts();

  renderDebtPayments();

  renderReceivables();

  renderReports();

}


/* =========================================================
   EVENT LISTENERS
========================================================= */

function setupApplicationEvents() {


  /* PRODUCT */

  $("saveProduct")?.addEventListener(
    "click",
    saveProduct
  );


  $("productSearch")?.addEventListener(
    "input",
    renderProducts
  );


  /* SUPPLIER */

  $("saveSupplier")?.addEventListener(
    "click",
    saveSupplier
  );


  $("supplierSearch")?.addEventListener(
    "input",
    renderSuppliers
  );


  /* PURCHASE */

  $("purchaseProduct")?.addEventListener(
    "change",
    setPurchasePrice
  );


  $("savePurchase")?.addEventListener(
    "click",
    savePurchase
  );


  /* CASHIER */

  $("cashierSearch")?.addEventListener(
    "input",
    renderCashierProducts
  );


  $("saveSale")?.addEventListener(
    "click",
    saveSale
  );


  /* CUSTOMER */

  $("saveCustomer")?.addEventListener(
    "click",
    saveCustomer
  );


  /* DEBT */

  $("payDebt")?.addEventListener(
    "click",
    payDebt
  );


  /* RECEIVABLE */

  $("payReceivable")?.addEventListener(
    "click",
    payReceivable
  );


  /* BACKUP */

  $("backupButton")?.addEventListener(
    "click",
    backupDatabase
  );


  $("restoreInput")?.addEventListener(
    "change",
    function (event) {

      const file =
        event.target.files?.[0];

      restoreDatabase(file);

      event.target.value = "";

    }
  );


  /* RESET */

  $("resetButton")?.addEventListener(
    "click",
    resetDatabase
  );

     /* STOCK CARD */

  $("stockCardProduct")?.addEventListener(
    "change",
    renderStockCard
  );

     }

/* =========================================================
   GLOBAL CLICK HANDLER
========================================================= */

document.addEventListener(
  "click",
  function (event) {

    // KASIR
    const cartButton =
      event.target.closest(
        "[data-add-cart]"
      );

    if (cartButton) {

      const productId =
        cartButton.dataset.addCart;

      addToCart(productId);

      return;
    }


    // EDIT PRODUK
    const editProductButton =
      event.target.closest(
        "[data-edit-product]"
      );

    if (editProductButton) {

      editProduct(
        editProductButton.dataset
          .editProduct
      );

      return;
    }

     // HAPUS PRODUK
const deleteProductButton =
  event.target.closest(
    "[data-delete-product]"
  );

if (deleteProductButton) {

  deleteProduct(
    deleteProductButton.dataset
      .deleteProduct
  );

  return;
}


    // EDIT SUPPLIER
    const editSupplierButton =
      event.target.closest(
        "[data-edit-supplier]"
      );

    if (editSupplierButton) {

      editSupplier(
        editSupplierButton.dataset
          .editSupplier
      );

      return;
    }


    // HAPUS SUPPLIER
    const deleteSupplierButton =
      event.target.closest(
        "[data-delete-supplier]"
      );

    if (deleteSupplierButton) {

      deleteSupplier(
        deleteSupplierButton.dataset
          .deleteSupplier
      );

      return;
    }

  }
);



/* =========================================================
   START APPLICATION
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  function () {

    setupMenu();

    setupApplicationEvents();

    renderAll();

  }
);


