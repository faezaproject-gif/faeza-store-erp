/* =====================================================
   FAEZA STORE ERP
   SCRIPT.JS — CORE ERP FINAL
===================================================== */

"use strict";

const DB_KEY = "faeza_store_erp";

let db = JSON.parse(localStorage.getItem(DB_KEY)) || {
    products: [],
    stockMoves: [],
    sales: [],
    suppliers: [],
    debts: [],
    expenses: []
};

let cart = [];

function saveDB() {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function uid(prefix = "ID") {
    return prefix + Date.now() + Math.random()
        .toString(36)
        .substring(2, 7);
}

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function rupiah(value) {
    return Number(value || 0).toLocaleString("id-ID");
}

/* =====================================================
   NAVIGASI
===================================================== */

function showPage(id) {

    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });

    const target = document.getElementById(id);

    if (!target) return;

    target.classList.add("active");

    if (id === "dashboard") dashboard();
    if (id === "kasir") renderPOS();
    if (id === "produk") products();
    if (id === "stok") stocks();
    if (id === "supplier") renderSuppliers();
    if (id === "hutang") renderDebts();
    if (id === "laporan") renderReport();

    const nav = document.getElementById("nav");

    if (nav) nav.classList.remove("show");
}

function go(id) {
    showPage(id);
}

/* =====================================================
   MODAL
===================================================== */

function modal(content) {

    const box = document.getElementById("modal");

    if (!box) return;

    box.innerHTML = `
        <div class="box">
            ${content}
        </div>
    `;

    box.className = "modal show";
    box.style.display = "";
}

function close() {

    const box = document.getElementById("modal");

    if (!box) return;

    box.className = "modal";
    box.style.display = "none";
    box.innerHTML = "";
}

function closeModal() {
    close();
}

/* =====================================================
   DASHBOARD
===================================================== */

function dashboard() {

    const today = new Date().toDateString();

    const todaySales = db.sales.filter(s =>
        new Date(s.date).toDateString() === today
    );

    const omzet = todaySales.reduce(
        (sum, s) => sum + Number(s.total || 0),
        0
    );

    const laba = todaySales.reduce(
        (sum, s) => sum + Number(s.profit || 0),
        0
    );

    const menipis = db.products.filter(
        p => Number(p.stock || 0) <= Number(p.min || 0)
    );

    const omzetEl = document.getElementById("omzet");
    const trxEl = document.getElementById("trx");
    const labaEl = document.getElementById("laba");
    const menipisEl = document.getElementById("menipis");

    if (omzetEl) omzetEl.textContent = "Rp" + rupiah(omzet);
    if (trxEl) trxEl.textContent = todaySales.length;
    if (labaEl) labaEl.textContent = "Rp" + rupiah(laba);
    if (menipisEl) menipisEl.textContent = menipis.length;

    const stockEl = document.getElementById("dashStock");

    if (stockEl) {

        stockEl.innerHTML = menipis.length
            ? menipis.map(p => `
                <div class="row">
                    <span>${escapeHTML(p.name)}</span>
                    <b>${p.stock} ${escapeHTML(p.unit)}</b>
                </div>
            `).join("")
            : "<p>Semua stok aman.</p>";
    }

    const salesEl = document.getElementById("dashSales");

    if (salesEl) {

        const last = [...db.sales]
            .reverse()
            .slice(0, 5);

        salesEl.innerHTML = last.length
            ? last.map(s => `
                <div class="row">
                    <span>${escapeHTML(s.invoice)}</span>
                    <b>Rp${rupiah(s.total)}</b>
                </div>
            `).join("")
            : "<p>Belum ada transaksi.</p>";
    }
}

/* =====================================================
   PRODUK
===================================================== */

function products() {

    const el = document.getElementById("productsTable");

    if (!el) return;

    el.innerHTML = `
        <div class="card">

            ${
                db.products.length

                ? db.products.map(p => `

                    <div class="row">

                        <span>
                            <b>${escapeHTML(p.name)}</b>
                            <br>
                            <small>
                                ${escapeHTML(p.barcode || "-")}
                            </small>
                        </span>

                        <span>
                            Rp${rupiah(p.sell)}
                        </span>

                        <span>
                            Stok:
                            <b>${p.stock}</b>
                            ${escapeHTML(p.unit)}
                        </span>

                    </div>

                `).join("")

                : "<p>Belum ada produk.</p>"
            }

        </div>
    `;
}

function addProduct() {

    modal(`

        <h3>Tambah Produk</h3>

        <input id="pName"
            placeholder="Nama produk">

        <input id="pBarcode"
            placeholder="Barcode">

        <input id="pCategory"
            placeholder="Kategori">

        <input id="pUnit"
            placeholder="Satuan"
            value="pcs">

        <input id="pBuy"
            type="number"
            placeholder="Harga beli">

        <input id="pSell"
            type="number"
            placeholder="Harga jual">

        <input id="pStock"
            type="number"
            placeholder="Stok awal"
            value="0">

        <input id="pMin"
            type="number"
            placeholder="Stok minimum"
            value="0">

        <br><br>

        <button class="gold"
            onclick="saveProduct()">
            Simpan
        </button>

        <button onclick="close()">
            Batal
        </button>
    `);
}

function saveProduct() {

    const name =
        document.getElementById("pName").value.trim();

    if (!name) {
        alert("Nama produk wajib diisi.");
        return;
    }

    const product = {

        id: uid("PRD"),

        name,

        barcode:
            document.getElementById("pBarcode").value.trim(),

        category:
            document.getElementById("pCategory").value.trim(),

        unit:
            document.getElementById("pUnit").value.trim() || "pcs",

        buy:
            Number(document.getElementById("pBuy").value) || 0,

        sell:
            Number(document.getElementById("pSell").value) || 0,

        stock:
            Number(document.getElementById("pStock").value) || 0,

        min:
            Number(document.getElementById("pMin").value) || 0
    };

    db.products.push(product);

    if (product.stock > 0) {

        db.stockMoves.push({

            id: uid("MOV"),

            productId: product.id,

            productName: product.name,

            type: "masuk",

            qty: product.stock,

            before: 0,

            after: product.stock,

            note: "Stok awal",

            date: new Date().toISOString()
        });
    }

    saveDB();

    close();

    products();
    stocks();
    dashboard();

    alert("Produk berhasil ditambahkan.");
}

/* =====================================================
   KASIR / POS
===================================================== */

function renderPOS() {

    const el = document.getElementById("posProducts");

    if (!el) return;

    const search =
        (document.getElementById("search")?.value || "")
        .toLowerCase()
        .trim();

    const list = db.products.filter(p =>
        !search ||
        p.name.toLowerCase().includes(search) ||
        String(p.barcode || "").toLowerCase().includes(search)
    );

    el.innerHTML = list.length

        ? list.map(p => `

            <div class="card">

                <b>${escapeHTML(p.name)}</b>

                <small>
                    Stok ${p.stock} ${escapeHTML(p.unit)}
                </small>

                <strong>
                    Rp${rupiah(p.sell)}
                </strong>

                <button
                    onclick="addToCart('${p.id}')"
                    ${p.stock <= 0 ? "disabled" : ""}>
                    Tambah
                </button>

            </div>

        `).join("")

        : "<p>Produk tidak ditemukan.</p>";

    renderCart();
}

function addToCart(id) {

    const p = db.products.find(x => x.id === id);

    if (!p) return;

    const existing = cart.find(x => x.id === id);

    if (existing) {

        if (existing.qty >= p.stock) {
            alert("Stok tidak mencukupi.");
            return;
        }

        existing.qty++;

    } else {

        cart.push({
            id: p.id,
            name: p.name,
            price: Number(p.sell || 0),
            buy: Number(p.buy || 0),
            qty: 1
        });
    }

    renderCart();
}

function renderCart() {

    const el = document.getElementById("cart");

    if (!el) return;

    if (!cart.length) {

        el.innerHTML = "<p>Keranjang kosong.</p>";

        const totalEl = document.getElementById("total");

        if (totalEl)
            totalEl.textContent = "Rp0";

        return;
    }

    el.innerHTML = cart.map((item, index) => `

        <div class="row">

            <span>
                <b>${escapeHTML(item.name)}</b>
                <br>
                ${item.qty} × Rp${rupiah(item.price)}
            </span>

            <b>
                Rp${rupiah(item.price * item.qty)}
            </b>

            <button onclick="cartMinus(${index})">−</button>
            <button onclick="cartPlus(${index})">＋</button>
            <button onclick="removeCart(${index})">×</button>

        </div>

    `).join("");

    const total = cart.reduce(
        (sum, item) =>
            sum + item.price * item.qty,
        0
    );

    const totalEl = document.getElementById("total");

    if (totalEl)
        totalEl.textContent = "Rp" + rupiah(total);
}

function cartPlus(index) {

    const item = cart[index];

    if (!item) return;

    const product =
        db.products.find(p => p.id === item.id);

    if (!product) return;

    if (item.qty >= product.stock) {

        alert("Stok tidak mencukupi.");

        return;
    }

    item.qty++;

    renderCart();
}

function cartMinus(index) {

    if (!cart[index]) return;

    cart[index].qty--;

    if (cart[index].qty <= 0)
        cart.splice(index, 1);

    renderCart();
}

function removeCart(index) {

    cart.splice(index, 1);

    renderCart();
}

function clearCart() {

    cart = [];

    renderCart();
}

function pay() {

    if (!cart.length) {

        alert("Keranjang masih kosong.");

        return;
    }

    const total = cart.reduce(
        (sum, item) =>
            sum + item.price * item.qty,
        0
    );

    const paid =
        Number(document.getElementById("paid")?.value || 0);

    if (paid < total) {

        alert(
            "Uang diterima kurang.\n\n" +
            "Total: Rp" + rupiah(total)
        );

        return;
    }

    let profit = 0;

    cart.forEach(item => {

        const p =
            db.products.find(x => x.id === item.id);

        if (!p) return;

        const before = Number(p.stock || 0);

        p.stock = before - item.qty;

        profit +=
            (item.price - Number(p.buy || 0))
            * item.qty;

        db.stockMoves.push({

            id: uid("MOV"),

            productId: p.id,

            productName: p.name,

            type: "keluar",

            qty: item.qty,

            before,

            after: p.stock,

            note: "Penjualan",

            date: new Date().toISOString()
        });
    });

    const sale = {

        id: uid("SALE"),

        invoice:
            "INV-" +
            new Date()
                .toISOString()
                .replace(/\D/g, "")
                .slice(0, 14),

        items: JSON.parse(JSON.stringify(cart)),

        total,

        paid,

        change: paid - total,

        profit,

        date: new Date().toISOString()
    };

    db.sales.push(sale);

    saveDB();

    const change = paid - total;

    cart = [];

    renderCart();

    const paidInput =
        document.getElementById("paid");

    if (paidInput)
        paidInput.value = "";

    products();
    stocks();
    dashboard();

    alert(
        "TRANSAKSI BERHASIL\n\n" +
        "Total: Rp" + rupiah(total) +
        "\nBayar: Rp" + rupiah(paid) +
        "\nKembalian: Rp" + rupiah(change)
    );
}

/* =====================================================
   STOK
===================================================== */

function stocks() {

    const table =
        document.getElementById("stockTable");

    if (!table) return;

    table.innerHTML = `

        <div class="card">

            ${
                db.products.length

                ? db.products.map(p => `

                    <div class="row">

                        <span>
                            <b>${escapeHTML(p.name)}</b>
                        </span>

                        <span>
                            ${p.stock}
                            ${escapeHTML(p.unit)}
                        </span>

                        <span>
                            ${
                                p.stock <= p.min
                                ? "⚠️ MENIPIS"
                                : "✓ AMAN"
                            }
                        </span>

                    </div>

                `).join("")

                : "<p>Belum ada produk.</p>"
            }

        </div>
    `;

    renderStockHistory();
}

function stockIn() {

    if (!db.products.length) {

        alert("Tambahkan produk terlebih dahulu.");

        return;
    }

    modal(`

        <h3>＋ Stok Masuk</h3>

        <select id="inProduct">

            <option value="">
                -- Pilih Produk --
            </option>

            ${db.products.map(p => `

                <option value="${p.id}">
                    ${escapeHTML(p.name)}
                </option>

            `).join("")}

        </select>

        <input
            id="inQty"
            type="number"
            min="1"
            placeholder="Jumlah masuk">

        <input
            id="inNote"
            placeholder="Keterangan">

        <br><br>

        <button
            class="gold"
            onclick="saveStockIn()">
            Simpan
        </button>

        <button onclick="close()">
            Batal
        </button>
    `);
}

function saveStockIn() {

    const id =
        document.getElementById("inProduct").value;

    const qty =
        Number(document.getElementById("inQty").value);

    const note =
        document.getElementById("inNote").value.trim();

    if (!id || qty <= 0) {

        alert("Produk dan jumlah wajib diisi.");

        return;
    }

    const p =
        db.products.find(x => x.id === id);

    if (!p) return;

    const before = Number(p.stock || 0);

    p.stock = before + qty;

    db.stockMoves.push({

        id: uid("MOV"),

        productId: p.id,

        productName: p.name,

        type: "masuk",

        qty,

        before,

        after: p.stock,

        note: note || "Stok masuk",

        date: new Date().toISOString()
    });

    saveDB();

    close();

    stocks();
    dashboard();

    alert("Stok masuk berhasil.");
}

function stockOut() {

    if (!db.products.length) {

        alert("Belum ada produk.");

        return;
    }

    modal(`

        <h3>− Stok Keluar</h3>

        <select id="outProduct">

            <option value="">
                -- Pilih Produk --
            </option>

            ${db.products.map(p => `

                <option value="${p.id}">
                    ${escapeHTML(p.name)}
                    — stok ${p.stock}
                </option>

            `).join("")}

        </select>

        <input
            id="outQty"
            type="number"
            min="1"
            placeholder="Jumlah keluar">

        <input
            id="outNote"
            placeholder="Keterangan">

        <br><br>

        <button
            class="gold"
            onclick="saveStockOut()">
            Simpan
        </button>

        <button onclick="close()">
            Batal
        </button>
    `);
}

function saveStockOut() {

    const id =
        document.getElementById("outProduct").value;

    const qty =
        Number(document.getElementById("outQty").value);

    const note =
        document.getElementById("outNote").value.trim();

    if (!id || qty <= 0) {

        alert("Produk dan jumlah wajib diisi.");

        return;
    }

    const p =
        db.products.find(x => x.id === id);

    if (!p) return;

    const before = Number(p.stock || 0);

    if (qty > before) {

        alert(
            "Stok tidak cukup.\n\n" +
            "Tersedia: " + before
        );

        return;
    }

    p.stock = before - qty;

    db.stockMoves.push({

        id: uid("MOV"),

        productId: p.id,

        productName: p.name,

        type: "keluar",

        qty,

        before,

        after: p.stock,

        note: note || "Stok keluar",

        date: new Date().toISOString()
    });

    saveDB();

    close();

    stocks();
    dashboard();

    alert("Stok keluar berhasil.");
}

function renderStockHistory() {

    const el =
        document.getElementById("stockHistory");

    if (!el) return;

    const moves =
        [...(db.stockMoves || [])].reverse();

    el.innerHTML = moves.length

        ? moves.map(m => `

            <div class="row">

                <span>
                    <b>
                        ${escapeHTML(m.productName)}
                    </b>

                    <br>

                    <small>
                        ${new Date(m.date)
                            .toLocaleString("id-ID")}
                    </small>
                </span>

                <span>
                    ${
                        m.type === "masuk"
                        ? "＋" + m.qty
                        : "−" + m.qty
                    }
                </span>

                <span>
                    ${m.before} → ${m.after}
                </span>

                <small>
                    ${escapeHTML(m.note)}
                </small>

            </div>

        `).join("")

        : "<p>Belum ada riwayat mutasi stok.</p>";
}

function stockCard() {

    if (!db.products.length) {

        alert("Belum ada produk.");

        return;
    }

    modal(`

        <h3>📋 Kartu Stok</h3>

        <select id="cardProduct">

            <option value="">
                -- Pilih Produk --
            </option>

            ${db.products.map(p => `

                <option value="${p.id}">
                    ${escapeHTML(p.name)}
                </option>

            `).join("")}

        </select>

        <br><br>

        <button
            class="gold"
            onclick="showStockCard()">
            Tampilkan
        </button>

        <button onclick="close()">
            Batal
        </button>

        <div id="stockCardResult"></div>
    `);
}

function showStockCard() {

    const id =
        document.getElementById("cardProduct").value;

    const result =
        document.getElementById("stockCardResult");

    if (!id) {

        alert("Pilih produk terlebih dahulu.");

        return;
    }

    const p =
       
