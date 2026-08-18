/* =====================================================
   FAEZA STORE ERP
   SCRIPT.JS — CORE ERP
===================================================== */

"use strict";

/* =====================================================
   DATABASE
===================================================== */

const DB_KEY = "faeza_store_erp";

let db = JSON.parse(localStorage.getItem(DB_KEY)) || {
    products: [],
    stockMoves: [],
    sales: [],
    suppliers: [],
    expenses: []
};

function saveDB() {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
}

/* =====================================================
   UTILITAS
===================================================== */

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
    return Number(value || 0)
        .toLocaleString("id-ID");
}

/* =====================================================
   MODAL UNIVERSAL
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
}

function close() {

    const box = document.getElementById("modal");

    if (!box) return;

    box.className = "modal";
    box.innerHTML = "";
}

/* Alias agar semua tombol Batal aman */

function closeModal() {
    close();
}

/* =====================================================
   NAVIGASI HALAMAN
===================================================== */

function showPage(id) {

    document
        .querySelectorAll(".page")
        .forEach(page => {
            page.classList.remove("active");
        });

    const target =
        document.getElementById(id);

    if (target) {
        target.classList.add("active");
    }

    if (id === "stok") {
        stocks();
    }

    if (id === "produk") {
        products();
    }

    if (id === "dashboard") {
        dashboard();
    }
}

/* =====================================================
   DASHBOARD
===================================================== */

function dashboard() {

    const el =
        document.getElementById("dashboard");

    if (!el) return;

    const totalProducts =
        db.products.length;

    const totalStock =
        db.products.reduce(
            (sum, p) =>
                sum + Number(p.stock || 0),
            0
        );

    const omzet =
        db.sales.reduce(
            (sum, s) =>
                sum + Number(s.total || 0),
            0
        );

    el.innerHTML = `
        <div class="card">
            <h2>Dashboard</h2>

            <p>
                Total Produk:
                <b>${totalProducts}</b>
            </p>

            <p>
                Total Stok:
                <b>${totalStock}</b>
            </p>

            <p>
                Omzet:
                <b>Rp ${rupiah(omzet)}</b>
            </p>
        </div>
    `;
}

/* =====================================================
   PRODUK
===================================================== */

function products() {

    const el =
        document.getElementById("productTable");

    if (!el) return;

    el.innerHTML = `
        <div class="card">

            <div class="head">
                <h3>Produk</h3>

                <button
                    class="gold"
                    type="button"
                    onclick="addProduct()">
                    ＋ Produk
                </button>
            </div>

            ${
                db.products.length
                ? db.products.map(p => `
                    <div class="row">

                        <span>
                            <b>
                                ${escapeHTML(p.name)}
                            </b>
                            <br>
                            <small>
                                ${escapeHTML(p.barcode)}
                            </small>
                        </span>

                        <span>
                            Rp ${rupiah(p.sell)}
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

        <input
            id="pName"
            placeholder="Nama produk">

        <input
            id="pBarcode"
            placeholder="Barcode">

        <input
            id="pCategory"
            placeholder="Kategori">

        <input
            id="pUnit"
            placeholder="Satuan"
            value="pcs">

        <input
            id="pBuy"
            type="number"
            placeholder="Harga beli">

        <input
            id="pSell"
            type="number"
            placeholder="Harga jual">

        <input
            id="pStock"
            type="number"
            placeholder="Stok awal"
            value="0">

        <input
            id="pMin"
            type="number"
            placeholder="Stok minimum"
            value="0">

        <br><br>

        <button
            class="gold"
            type="button"
            onclick="saveProduct()">
            Simpan
        </button>

        <button
            type="button"
            onclick="close()">
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
            document.getElementById("pUnit").value.trim()
            || "pcs",

        buy:
            Number(document.getElementById("pBuy").value)
            || 0,

        sell:
            Number(document.getElementById("pSell").value)
            || 0,

        stock:
            Number(document.getElementById("pStock").value)
            || 0,

        min:
            Number(document.getElementById("pMin").value)
            || 0
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
   STOK
===================================================== */

function stocks() {

    const table =
        document.getElementById("stockTable");

    if (!table) return;

    table.innerHTML = `
        <div class="card">

            <div class="head">

                <h3>Stok Barang</h3>

                <div>

                    <button
                        class="gold"
                        type="button"
                        onclick="stockIn()">
                        ＋ Stok Masuk
                    </button>

                    <button
                        type="button"
                        onclick="stockOut()">
                        − Stok Keluar
                    </button>

                    <button
                        type="button"
                        onclick="stockCard()">
                        📋 Kartu Stok
                    </button>

                </div>

            </div>

            ${
                db.products.length
                ? db.products.map(p => `

                    <div class="row">

                        <span>
                            <b>
                                ${escapeHTML(p.name)}
                            </b>
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

/* =====================================================
   STOK MASUK
===================================================== */

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
            type="button"
            onclick="saveStockIn()">
            Simpan
        </button>

        <button
            type="button"
            onclick="close()">
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
        db.products.find(
            x => x.id === id
        );

    if (!p) return;

    const before =
        Number(p.stock || 0);

    p.stock =
        before + qty;

    db.stockMoves.push({

        id: uid("MOV"),

        productId: p.id,

        productName: p.name,

        type: "masuk",

        qty,

        before,

        after: p.stock,

        note:
            note || "Stok masuk",

        date:
            new Date().toISOString()
    });

    saveDB();

    close();

    stocks();
    dashboard();

    alert("Stok masuk berhasil.");
}

/* =====================================================
   STOK KELUAR
===================================================== */

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
            type="button"
            onclick="saveStockOut()">
            Simpan
        </button>

        <button
            type="button"
            onclick="close()">
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
        db.products.find(
            x => x.id === id
        );

    if (!p) return;

    const before =
        Number(p.stock || 0);

    if (qty > before) {

        alert(
            `Stok tidak cukup.\n\nStok tersedia: ${before}`
        );

        return;
    }

    p.stock =
        before - qty;

    db.stockMoves.push({

        id: uid("MOV"),

        productId: p.id,

        productName: p.name,

        type: "keluar",

        qty,

        before,

        after: p.stock,

        note:
            note || "Stok keluar",

        date:
            new Date().toISOString()
    });

    saveDB();

    close();

    stocks();
    dashboard();

    alert("Stok keluar berhasil.");
}

/* =====================================================
   RIWAYAT MUTASI
===================================================== */

function renderStockHistory() {

    const el =
        document.getElementById("stockHistory");

    if (!el) return;

    const moves =
        [...(db.stockMoves || [])]
        .reverse();

    if (!moves.length) {

        el.innerHTML =
            "<p>Belum ada riwayat mutasi stok.</p>";

        return;
    }

    el.innerHTML = `

        <div class="card">

            <h3>Riwayat Mutasi Stok</h3>

            ${moves.map(m => `

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
                        ${m.before}
                        →
                        ${m.after}
                    </span>

                    <small>
                        ${escapeHTML(m.note)}
                    </small>

                </div>

            `).join("")}

        </div>
    `;
}

/* =====================================================
   KARTU STOK
===================================================== */

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
            type="button"
            onclick="showStockCard()">
            Tampilkan
        </button>

        <button
            type="button"
            onclick="close()">
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
        db.products.find(
            x => x.id === id
        );

    if (!p) return;

    const moves =
        db.stockMoves
        .filter(
            m => m.productId === id
        )
        .sort(
            (a, b) =>
                new Date(a.date) -
                new Date(b.date)
        );

    result.innerHTML = `

        <br>

        <div class="card">

            <h3>
                ${escapeHTML(p.name)}
            </h3>

            <p>
                Stok sekarang:
                <b>
                    ${p.stock}
                    ${escapeHTML(p.unit)}
                </b>
            </p>

            <div class="row">

                <b>Waktu</b>
                <b>Jenis</b>
                <b>Qty</b>
                <b>Saldo</b>

            </div>

            ${
                moves.length
                ? moves.map(m => `

                    <div class="row">

                        <span>
                            ${new Date(m.date)
                                .toLocaleString("id-ID")}
                        </span>

                        <span>
                            ${
                                m.type === "masuk"
                                ? "MASUK"
                                : "KELUAR"
                            }
                        </span>

                        <span>
                            ${
                                m.type === "masuk"
                                ? "+" + m.qty
                                : "-" + m.qty
                            }
                        </span>

                        <b>
                            ${m.after}
                        </b>

                    </div>

                `).join("")
                : "<p>Belum ada mutasi.</p>"
            }

        </div>
    `;
}

/* =====================================================
   BACKUP DATA
===================================================== */

function backupData() {

    const data =
        JSON.stringify(db, null, 2);

    const blob =
        new Blob(
            [data],
            { type: "application/json" }
        );

    const url =
        URL.createObjectURL(blob);

    const a =
        document.createElement("a");

    a.href = url;

    a.download =
        "faeza-store-erp-backup.json";

    a.click();

    URL.revokeObjectURL(url);
}

/* =====================================================
   INIT
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        saveDB();

        dashboard();

        products();

        stocks();

    }
);

/* =========================================
   FINAL MODAL BUTTON FIX
========================================= */

document.addEventListener("click", function (e) {

    const button = e.target.closest("button");

    if (!button) return;

    const text = button.textContent
        .trim()
        .toLowerCase();

    if (
        text === "batal" ||
        text.includes("batal")
    ) {

        const modal =
            document.getElementById("modal");

        if (modal) {

            modal.classList.remove("show");

            modal.style.display = "none";

            modal.innerHTML = "";

        }

    }

});
