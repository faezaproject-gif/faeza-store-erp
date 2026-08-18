/* =========================================================
   FAEZA STORE ERP
   SCRIPT.JS — FINAL STABLE
   BAGIAN 1/4
========================================================= */

"use strict";

/* =========================================================
   DATABASE
========================================================= */

const DB_KEY = "faeza_store_erp";

function defaultDB() {
    return {
        products: [],
        stockMoves: [],
        sales: [],
        suppliers: [],
        debts: [],
        expenses: []
    };
}

let db;

try {
    db = JSON.parse(localStorage.getItem(DB_KEY)) || defaultDB();
} catch (error) {
    db = defaultDB();
}

db.products ||= [];
db.stockMoves ||= [];
db.sales ||= [];
db.suppliers ||= [];
db.debts ||= [];
db.expenses ||= [];

let cart = [];


/* =========================================================
   HELPER
========================================================= */

function saveDB() {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function uid(prefix = "ID") {
    return prefix + "-" +
        Date.now() + "-" +
        Math.random().toString(36).slice(2, 7);
}

function rupiah(value) {
    return Number(value || 0).toLocaleString("id-ID");
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
   NAVIGATION
========================================================= */

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

    if (nav) {
        nav.classList.remove("show");
        nav.classList.remove("open");
    }
}

function go(id) {
    showPage(id);
}


/* =========================================================
   MODAL ENGINE
   INI BAGIAN PENTING UNTUK TOMBOL BATAL
========================================================= */

function modal(content) {

    const box = document.getElementById("modal");

    if (!box) return;

    box.innerHTML = `
        <div class="box" role="dialog" aria-modal="true">
            ${content}
        </div>
    `;

    box.classList.add("modal");
    box.classList.add("show");

    box.style.display = "flex";
    box.style.pointerEvents = "auto";
    box.style.position = "fixed";
    box.style.inset = "0";
    box.style.zIndex = "99999";
}


/* =========================================================
   CANCEL MODAL
========================================================= */

function cancelModal() {

    const box = document.getElementById("modal");

    if (!box) return;

    box.innerHTML = "";

    box.classList.remove("show");

    box.style.display = "none";

    box.style.pointerEvents = "none";
}


/* =========================================================
   ALIAS UNTUK KODE LAMA
========================================================= */

function closeModal() {
    cancelModal();
}

function close() {
    cancelModal();
}


/* =========================================================
   DASHBOARD
========================================================= */

function dashboard() {

    const today = new Date().toDateString();

    const todaySales = db.sales.filter(s => {

        return new Date(s.date).toDateString() === today;

    });

    const omzet = todaySales.reduce(
        (sum, s) => sum + Number(s.total || 0),
        0
    );

    const laba = todaySales.reduce(
        (sum, s) => sum + Number(s.profit || 0),
        0
    );

    const menipis = db.products.filter(p => {

        return Number(p.stock || 0) <=
               Number(p.min || 0);

    });


    const omzetEl =
        document.getElementById("omzet");

    const trxEl =
        document.getElementById("trx");

    const labaEl =
        document.getElementById("laba");

    const menipisEl =
        document.getElementById("menipis");


    if (omzetEl) {

        omzetEl.textContent =
            "Rp" + rupiah(omzet);

    }

    if (trxEl) {

        trxEl.textContent =
            todaySales.length;

    }

    if (labaEl) {

        labaEl.textContent =
            "Rp" + rupiah(laba);

    }

    if (menipisEl) {

        menipisEl.textContent =
            menipis.length;

    }


    const stockEl =
        document.getElementById("dashStock");


    if (stockEl) {

        stockEl.innerHTML =
            menipis.length

            ?

            menipis.map(p => `

                <div class="row">

                    <span>
                        ${escapeHTML(p.name)}
                    </span>

                    <b>
                        ${p.stock}
                        ${escapeHTML(p.unit)}
                    </b>

                </div>

            `).join("")

            :

            "<p>Semua stok aman.</p>";
    }


    const salesEl =
        document.getElementById("dashSales");


    if (salesEl) {

        const last =
            [...db.sales]
                .reverse()
                .slice(0, 5);


        salesEl.innerHTML =
            last.length

            ?

            last.map(s => `

                <div class="row">

                    <span>
                        ${escapeHTML(s.invoice)}
                    </span>

                    <b>
                        Rp${rupiah(s.total)}
                    </b>

                </div>

            `).join("")

            :

            "<p>Belum ada transaksi.</p>";
    }
}


/* =========================================================
   AKHIR BAGIAN 1/4
========================================================= */

/*
   BAGIAN 2/4 DITEMPEL TEPAT DI BAWAH INI
   /* =========================================================
   FAEZA STORE ERP
   SCRIPT.JS — FINAL STABLE
   BAGIAN 2/4
========================================================= */


/* =========================================================
   PRODUK
========================================================= */

function products() {

    const el =
        document.getElementById("productsTable");

    if (!el) return;


    if (!db.products.length) {

        el.innerHTML =
            "<p>Belum ada produk.</p>";

        return;
    }


    el.innerHTML = db.products.map(p => `

        <div class="row">

            <span>

                <b>
                    ${escapeHTML(p.name)}
                </b>

                <br>

                <small>
                    ${escapeHTML(p.category || "-")}
                    •
                    ${escapeHTML(p.barcode || "-")}
                </small>

            </span>


            <span>

                Beli<br>

                Rp${rupiah(p.buy)}

            </span>


            <span>

                Jual<br>

                Rp${rupiah(p.sell)}

            </span>


            <span>

                Stok<br>

                <b>
                    ${p.stock}
                    ${escapeHTML(p.unit)}
                </b>

            </span>


            <span>

                <button
                    type="button"
                    onclick="editProduct('${p.id}')">

                    Edit

                </button>


                <button
                    type="button"
                    onclick="deleteProduct('${p.id}')">

                    Hapus

                </button>

            </span>

        </div>

    `).join("");
}


/* =========================================================
   FORM PRODUK
========================================================= */

function productForm(product = null) {

    const editing = !!product;


    modal(`

        <h3>
            ${editing
                ? "Edit Produk"
                : "Tambah Produk"}
        </h3>


        <input
            id="pName"
            placeholder="Nama produk"
            value="${escapeHTML(
                product?.name || ""
            )}">


        <input
            id="pBarcode"
            placeholder="Barcode"
            value="${escapeHTML(
                product?.barcode || ""
            )}">


        <input
            id="pCategory"
            placeholder="Kategori"
            value="${escapeHTML(
                product?.category || ""
            )}">


        <input
            id="pUnit"
            placeholder="Satuan"
            value="${escapeHTML(
                product?.unit || "pcs"
            )}">


        <input
            id="pBuy"
            type="number"
            min="0"
            placeholder="Harga beli"
            value="${Number(
                product?.buy || 0
            )}">


        <input
            id="pSell"
            type="number"
            min="0"
            placeholder="Harga jual"
            value="${Number(
                product?.sell || 0
            )}">


        <input
            id="pStock"
            type="number"
            min="0"
            placeholder="Stok"
            value="${Number(
                product?.stock || 0
            )}">


        <input
            id="pMin"
            type="number"
            min="0"
            placeholder="Stok minimum"
            value="${Number(
                product?.min || 0
            )}">


        <br><br>


        <button
            type="button"
            class="gold"
            onclick="${
                editing
                ? `saveEditProduct('${product.id}')`
                : "saveProduct()"
            }">

            Simpan

        </button>


        <button
            type="button"
            class="cancel-button"
            data-action="cancel"
            onclick="cancelModal()">

            Batal

        </button>

    `);
}


/* =========================================================
   TAMBAH PRODUK
========================================================= */

function addProduct() {

    productForm();

}


/* =========================================================
   SIMPAN PRODUK
========================================================= */

function saveProduct() {

    const name =
        document.getElementById("pName")
            ?.value
            .trim();


    if (!name) {

        alert(
            "Nama produk wajib diisi."
        );

        return;
    }


    const product = {

        id: uid("PRD"),

        name,

        barcode:
            document.getElementById("pBarcode")
                ?.value
                .trim() || "",

        category:
            document.getElementById("pCategory")
                ?.value
                .trim() || "",

        unit:
            document.getElementById("pUnit")
                ?.value
                .trim() || "pcs",

        buy:
            Number(
                document.getElementById("pBuy")
                    ?.value || 0
            ),

        sell:
            Number(
                document.getElementById("pSell")
                    ?.value || 0
            ),

        stock:
            Number(
                document.getElementById("pStock")
                    ?.value || 0
            ),

        min:
            Number(
                document.getElementById("pMin")
                    ?.value || 0
            )

    };


    db.products.push(product);


    if (product.stock > 0) {

        db.stockMoves.push({

            id: uid("MOV"),

            productId:
                product.id,

            productName:
                product.name,

            type: "masuk",

            qty:
                product.stock,

            before: 0,

            after:
                product.stock,

            note:
                "Stok awal",

            date:
                new Date().toISOString()

        });

    }


    saveDB();

    cancelModal();

    products();

    stocks();

    dashboard();


    alert(
        "Produk berhasil ditambahkan."
    );
}


/* =========================================================
   EDIT PRODUK
========================================================= */

function editProduct(id) {

    const product =
        db.products.find(
            p => p.id === id
        );

    if (!product) return;

    productForm(product);

}


/* =========================================================
   SIMPAN EDIT PRODUK
========================================================= */

function saveEditProduct(id) {

    const product =
        db.products.find(
            p => p.id === id
        );

    if (!product) return;


    const name =
        document.getElementById("pName")
            ?.value
            .trim();


    if (!name) {

        alert(
            "Nama produk wajib diisi."
        );

        return;
    }


    product.name =
        name;


    product.barcode =
        document.getElementById("pBarcode")
            ?.value
            .trim() || "";


    product.category =
        document.getElementById("pCategory")
            ?.value
            .trim() || "";


    product.unit =
        document.getElementById("pUnit")
            ?.value
            .trim() || "pcs";


    product.buy =
        Number(
            document.getElementById("pBuy")
                ?.value || 0
        );


    product.sell =
        Number(
            document.getElementById("pSell")
                ?.value || 0
        );


    const newStock =
        Number(
            document.getElementById("pStock")
                ?.value || 0
        );


    const oldStock =
        Number(product.stock || 0);


    if (newStock !== oldStock) {

        db.stockMoves.push({

            id: uid("MOV"),

            productId:
                product.id,

            productName:
                product.name,

            type:
                newStock > oldStock
                ? "masuk"
                : "keluar",

            qty:
                Math.abs(
                    newStock - oldStock
                ),

            before:
                oldStock,

            after:
                newStock,

            note:
                "Penyesuaian stok",

            date:
                new Date().toISOString()

        });

    }


    product.stock =
        newStock;


    product.min =
        Number(
            document.getElementById("pMin")
                ?.value || 0
        );


    saveDB();

    cancelModal();

    products();

    stocks();

    dashboard();


    alert(
        "Produk berhasil diperbarui."
    );
}


/* =========================================================
   HAPUS PRODUK
========================================================= */

function deleteProduct(id) {

    const product =
        db.products.find(
            p => p.id === id
        );

    if (!product) return;


    const ok =
        confirm(
            `Hapus produk "${product.name}"?`
        );


    if (!ok) return;


    db.products =
        db.products.filter(
            p => p.id !== id
        );


    cart =
        cart.filter(
            item => item.id !== id
        );


    saveDB();

    products();

    stocks();

    renderPOS();

    dashboard();

}


/* =========================================================
   KASIR / POS
========================================================= */

function renderPOS() {

    const el =
        document.getElementById(
            "posProducts"
        );

    if (!el) return;


    const search =
        (
            document.getElementById("search")
                ?.value || ""
        )
        .toLowerCase()
        .trim();


    const list =
        db.products.filter(p =>

            !search ||

            String(p.name || "")
                .toLowerCase()
                .includes(search) ||

            String(p.barcode || "")
                .toLowerCase()
                .includes(search)

        );


    el.innerHTML =

        list.length

        ?

        list.map(p => `

            <div class="card">

                <b>
                    ${escapeHTML(p.name)}
                </b>

                <small>
                    Stok
                    ${p.stock}
                    ${escapeHTML(p.unit)}
                </small>

                <strong>
                    Rp${rupiah(p.sell)}
                </strong>


                <button
                    type="button"
                    onclick="addToCart('${p.id}')"
                    ${p.stock <= 0
                        ? "disabled"
                        : ""}>

                    Tambah

                </button>

            </div>

        `).join("")

        :

        "<p>Produk tidak ditemukan.</p>";


    renderCart();
}


/* =========================================================
   TAMBAH KE KERANJANG
========================================================= */

function addToCart(id) {

    const product =
        db.products.find(
            p => p.id === id
        );

    if (!product) return;


    if (Number(product.stock) <= 0) {

        alert(
            "Stok produk habis."
        );

        return;
    }


    const existing =
        cart.find(
            item => item.id === id
        );


    if (existing) {

        if (
            existing.qty >=
            Number(product.stock)
        ) {

            alert(
                "Stok tidak mencukupi."
            );

            return;
        }


        existing.qty++;

    } else {

        cart.push({

            id:
                product.id,

            name:
                product.name,

            price:
                Number(product.sell || 0),

            buy:
                Number(product.buy || 0),

            qty: 1

        });

    }


    renderCart();
}


/* =========================================================
   RENDER KERANJANG
========================================================= */

function renderCart() {

    const el =
        document.getElementById("cart");

    if (!el) return;


    if (!cart.length) {

        el.innerHTML =
            "<p>Keranjang kosong.</p>";


        const totalEl =
            document.getElementById(
                "total"
            );


        if (totalEl) {

            totalEl.textContent =
                "Rp0";

        }

        return;
    }


    el.innerHTML =
        cart.map(
            (item, index) => `

            <div class="row">

                <span>

                    <b>
                        ${escapeHTML(
                            item.name
                        )}
                    </b>

                    <br>

                    ${item.qty}
                    ×
                    Rp${rupiah(
                        item.price
                    )}

                </span>


                <b>
                    Rp${rupiah(
                        item.price *
                        item.qty
                    )}
                </b>


                <button
                    type="button"
                    onclick="cartMinus(${index})">

                    −

                </button>


                <button
                    type="button"
                    onclick="cartPlus(${index})">

                    ＋

                </button>


                <button
                    type="button"
                    onclick="removeCart(${index})">

                    ×

                </button>

            </div>

        `
        ).join("");


    const total =
        cart.reduce(
            (sum, item) =>
                sum +
                item.price *
                item.qty,
            0
        );


    const totalEl =
        document.getElementById(
            "total"
        );


    if (totalEl) {

        totalEl.textContent =
            "Rp" + rupiah(total);

    }
}


/* =========================================================
   KERANJANG + / -
========================================================= */

function cartPlus(index) {

    const item =
        cart[index];

    if (!item) return;


    const product =
        db.products.find(
            p => p.id === item.id
        );

    if (!product) return;


    if (
        item.qty >=
        Number(product.stock)
    ) {

        alert(
            "Stok tidak mencukupi."
        );

        return;
    }


    item.qty++;

    renderCart();
}


function cartMinus(index) {

    if (!cart[index]) return;


    cart[index].qty--;


    if (
        cart[index].qty <= 0
    ) {

        cart.splice(
            index,
            1
        );

    }


    renderCart();
}


function removeCart(index) {

    if (!cart[index]) return;


    cart.splice(
        index,
        1
    );


    renderCart();
}


/* =========================================================
   KOSONGKAN KERANJANG
========================================================= */

function clearCart() {

    cart.length = 0;

    renderCart();

}


/* =========================================================
   PEMBAYARAN
========================================================= */

function pay() {

    if (!cart.length) {

        alert(
            "Keranjang masih kosong."
        );

        return;
    }


    const total =
        cart.reduce(
            (sum, item) =>
                sum +
                item.price *
                item.qty,
            0
        );


    const paid =
        Number(
            document.getElementById(
                "paid"
            )?.value || 0
        );


    if (paid < total) {

        alert(
            "Uang diterima kurang.\n\n" +
            "Total: Rp" +
            rupiah(total)
        );

        return;
    }


    let profit = 0;


    for (
        const item of cart
    ) {

        const product =
            db.products.find(
                p => p.id === item.id
            );

        if (!product) continue;


        const before =
            Number(
                product.stock || 0
            );


        if (
            item.qty >
            before
        ) {

            alert(
                `Stok ${product.name} tidak mencukupi.`
            );

            return;
        }


        product.stock =
            before -
            item.qty;


        profit +=
            (
                item.price -
                Number(
                    product.buy || 0
                )
            ) *
            item.qty;


        db.stockMoves.push({

            id: uid("MOV"),

            productId:
                product.id,

            productName:
                product.name,

            type: "keluar",

            qty:
                item.qty,

            before,

            after:
                product.stock,

            note:
                "Penjualan",

            date:
                new Date().toISOString()

        });

    }


    const sale = {

        id:
            uid("SALE"),

        invoice:
            "INV-" +
            new Date()
                .toISOString()
                .replace(/\D/g, "")
                .slice(0, 14),

        items:
            JSON.parse(
                JSON.stringify(cart)
            ),

        total,

        paid,

        change:
            paid - total,

        profit,

        date:
            new Date().toISOString()

    };


    db.sales.push(sale);

    saveDB();


    cart.length = 0;

    renderCart();


    const paidInput =
        document.getElementById(
            "paid"
        );


    if (paidInput) {

        paidInput.value = "";

    }


    products();

    stocks();

    dashboard();


    alert(
        "TRANSAKSI BERHASIL\n\n" +
        "Invoice: " +
        sale.invoice +
        "\nTotal: Rp" +
        rupiah(total) +
        "\nBayar: Rp" +
        rupiah(paid) +
        "\nKembalian: Rp" +
        rupiah(sale.change)
    );
}


/* =========================================================
   AKHIR BAGIAN 2/4
========================================================= */

/*
   BAGIAN 3/4 DITEMPEL TEPAT DI BAWAH INI
   /* =========================================================
   FAEZA STORE ERP
   SCRIPT.JS — FINAL STABLE
   BAGIAN 3/4
========================================================= */


/* =========================================================
   STOK
========================================================= */

function stocks() {

    const table =
        document.getElementById(
            "stockTable"
        );

    if (!table) return;


    table.innerHTML =
        db.products.length

        ?

        db.products.map(
            p => `

            <div class="row">

                <span>

                    <b>
                        ${escapeHTML(
                            p.name
                        )}
                    </b>

                </span>


                <span>

                    ${p.stock}
                    ${escapeHTML(
                        p.unit
                    )}

                </span>


                <span>

                    ${
                        Number(p.stock) <=
                        Number(p.min)
                        ? "⚠️ MENIPIS"
                        : "✓ AMAN"
                    }

                </span>

            </div>

        `
        ).join("")

        :

        "<p>Belum ada produk.</p>";


    renderStockHistory();
}


/* =========================================================
   STOK MASUK
========================================================= */

function stockIn() {

    if (!db.products.length) {

        alert(
            "Tambahkan produk terlebih dahulu."
        );

        return;
    }


    modal(`

        <h3>
            ＋ Stok Masuk
        </h3>


        <select id="inProduct">

            <option value="">
                -- Pilih Produk --
            </option>

            ${db.products.map(
                p => `

                <option value="${p.id}">

                    ${escapeHTML(
                        p.name
                    )}

                </option>

            `
            ).join("")}

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
            type="button"
            class="gold"
            onclick="saveStockIn()">

            Simpan

        </button>


        <button
            type="button"
            class="cancel-button"
            data-action="cancel"
            onclick="cancelModal()">

            Batal

        </button>

    `);
}


/* =========================================================
   SIMPAN STOK MASUK
========================================================= */

function saveStockIn() {

    const id =
        document.getElementById(
            "inProduct"
        )?.value;


    const qty =
        Number(
            document.getElementById(
                "inQty"
            )?.value || 0
        );


    const note =
        document.getElementById(
            "inNote"
        )?.value.trim() || "";


    if (!id || qty <= 0) {

        alert(
            "Produk dan jumlah wajib diisi."
        );

        return;
    }


    const product =
        db.products.find(
            p => p.id === id
        );


    if (!product) return;


    const before =
        Number(
            product.stock || 0
        );


    product.stock =
        before + qty;


    db.stockMoves.push({

        id:
            uid("MOV"),

        productId:
            product.id,

        productName:
            product.name,

        type:
            "masuk",

        qty,

        before,

        after:
            product.stock,

        note:
            note || "Stok masuk",

        date:
            new Date().toISOString()

    });


    saveDB();

    cancelModal();

    stocks();

    products();

    dashboard();


    alert(
        "Stok masuk berhasil."
    );
}


/* =========================================================
   STOK KELUAR
========================================================= */

function stockOut() {

    if (!db.products.length) {

        alert(
            "Belum ada produk."
        );

        return;
    }


    modal(`

        <h3>
            − Stok Keluar
        </h3>


        <select id="outProduct">

            <option value="">
                -- Pilih Produk --
            </option>

            ${db.products.map(
                p => `

                <option value="${p.id}">

                    ${escapeHTML(
                        p.name
                    )}

                    — stok
                    ${p.stock}

                </option>

            `
            ).join("")}

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
            type="button"
            class="gold"
            onclick="saveStockOut()">

            Simpan

        </button>


        <button
            type="button"
            class="cancel-button"
            data-action="cancel"
            onclick="cancelModal()">

            Batal

        </button>

    `);
}


/* =========================================================
   SIMPAN STOK KELUAR
========================================================= */

function saveStockOut() {

    const id =
        document.getElementById(
            "outProduct"
        )?.value;


    const qty =
        Number(
            document.getElementById(
                "outQty"
            )?.value || 0
        );


    const note =
        document.getElementById(
            "outNote"
        )?.value.trim() || "";


    if (!id || qty <= 0) {

        alert(
            "Produk dan jumlah wajib diisi."
        );

        return;
    }


    const product =
        db.products.find(
            p => p.id === id
        );


    if (!product) return;


    const before =
        Number(
            product.stock || 0
        );


    if (qty > before) {

        alert(
            "Stok tidak cukup.\n" +
            "Tersedia: " +
            before
        );

        return;
    }


    product.stock =
        before - qty;


    db.stockMoves.push({

        id:
            uid("MOV"),

        productId:
            product.id,

        productName:
            product.name,

        type:
            "keluar",

        qty,

        before,

        after:
            product.stock,

        note:
            note || "Stok keluar",

        date:
            new Date().toISOString()

    });


    saveDB();

    cancelModal();

    stocks();

    products();

    dashboard();


    alert(
        "Stok keluar berhasil."
    );
}


/* =========================================================
   RIWAYAT STOK
========================================================= */

function renderStockHistory() {

    const el =
        document.getElementById(
            "stockHistory"
        );

    if (!el) return;


    const moves =
        [...db.stockMoves]
            .reverse();


    el.innerHTML =
        moves.length

        ?

        moves.map(
            m => `

            <div class="row">

                <span>

                    <b>
                        ${escapeHTML(
                            m.productName
                        )}
                    </b>

                    <br>

                    <small>

                        ${new Date(
                            m.date
                        ).toLocaleString(
                            "id-ID"
                        )}

                    </small>

                </span>


                <span>

                    ${
                        m.type === "masuk"
                        ? "+"
                        : "-"
                    }${m.qty}

                </span>


                <span>

                    ${m.before}
                    →
                    ${m.after}

                </span>


                <small>

                    ${escapeHTML(
                        m.note || ""
                    )}

                </small>

            </div>

        `
        ).join("")

        :

        "<p>Belum ada riwayat mutasi stok.</p>";
}


/* =========================================================
   KARTU STOK
========================================================= */

function stockCard() {

    if (!db.products.length) {

        alert(
            "Belum ada produk."
        );

        return;
    }


    modal(`

        <h3>
            📋 Kartu Stok
        </h3>


        <select id="cardProduct">

            <option value="">
                -- Pilih Produk --
            </option>

            ${db.products.map(
                p => `

                <option value="${p.id}">

                    ${escapeHTML(
                        p.name
                    )}

                </option>

            `
            ).join("")}

        </select>


        <br><br>


        <button
            type="button"
            class="gold"
            onclick="showStockCard()">

            Tampilkan

        </button>


        <button
            type="button"
            class="cancel-button"
            data-action="cancel"
            onclick="cancelModal()">

            Batal

        </button>


        <div
            id="stockCardResult">
        </div>

    `);
}


/* =========================================================
   TAMPILKAN KARTU STOK
========================================================= */

function showStockCard() {

    const id =
        document.getElementById(
            "cardProduct"
        )?.value;


    const result =
        document.getElementById(
            "stockCardResult"
        );


    if (!id) {

        alert(
            "Pilih produk terlebih dahulu."
        );

        return;
    }


    const product =
        db.products.find(
            p => p.id === id
        );


    if (!product || !result) return;


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

        <div class="card">

            <h3>
                ${escapeHTML(
                    product.name
                )}
            </h3>


            <p>

                Stok sekarang:

                <b>

                    ${product.stock}
                    ${escapeHTML(
                        product.unit
                    )}

                </b>

            </p>


            ${
                moves.length

                ?

                moves.map(
                    m => `

                    <div class="row">

                        <span>

                            ${new Date(
                                m.date
                            ).toLocaleString(
                                "id-ID"
                            )}

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
                                ? "+"
                                : "-"
                            }${m.qty}

                        </span>


                        <b>

                            ${m.after}

                        </b>

                    </div>

                `
                ).join("")

                :

                "<p>Belum ada mutasi.</p>"
            }

        </div>

    `;
}


/* =========================================================
   SUPPLIER
========================================================= */

function addSupplier() {

    modal(`

        <h3>
            Tambah Supplier
        </h3>


        <input
            id="sName"
            placeholder="Nama supplier">


        <input
            id="sPhone"
            placeholder="No. WhatsApp">


        <input
            id="sAddress"
            placeholder="Alamat">


        <br><br>


        <button
            type="button"
            class="gold"
            onclick="saveSupplier()">

            Simpan

        </button>


        <button
            type="button"
            class="cancel-button"
            data-action="cancel"
            onclick="cancelModal()">

            Batal

        </button>

    `);
}


/* =========================================================
   SIMPAN SUPPLIER
========================================================= */

function saveSupplier() {

    const name =
        document.getElementById(
            "sName"
        )?.value.trim();


    if (!name) {

        alert(
            "Nama supplier wajib diisi."
        );

        return;
    }


    db.suppliers.push({

        id:
            uid("SUP"),

        name,

        phone:
            document.getElementById(
                "sPhone"
            )?.value.trim() || "",

        address:
            document.getElementById(
                "sAddress"
            )?.value.trim() || ""

    });


    saveDB();

    cancelModal();

    renderSuppliers();


    alert(
        "Supplier berhasil ditambahkan."
    );
}


/* =========================================================
   TAMPIL SUPPLIER
========================================================= */

function renderSuppliers() {

    const el =
        document.getElementById(
            "supplierTable"
        );

    if (!el) return;


    el.innerHTML =
        db.suppliers.length

        ?

        db.suppliers.map(
            s => `

            <div class="row">

                <span>

                    <b>
                        ${escapeHTML(
                            s.name
                        )}
                    </b>

                    <br>

                    <small>
                        ${escapeHTML(
                            s.phone || "-"
                        )}
                    </small>

                </span>


                <span>

                    ${escapeHTML(
                        s.address || "-"
                    )}

                </span>

            </div>

        `
        ).join("")

        :

        "<p>Belum ada supplier.</p>";
}


/* =========================================================
   HUTANG / PIUTANG
========================================================= */

function addDebt() {

    modal(`

        <h3>
            Catat Hutang / Piutang
        </h3>


        <select id="debtType">

            <option value="hutang">
                Hutang
            </option>

            <option value="piutang">
                Piutang
            </option>

        </select>


        <input
            id="debtName"
            placeholder="Nama pihak">


        <input
            id="debtAmount"
            type="number"
            min="0"
            placeholder="Nominal">


        <input
            id="debtNote"
            placeholder="Keterangan">


        <br><br>


        <button
            type="button"
            class="gold"
            onclick="saveDebt()">

            Simpan

        </button>


        <button
            type="button"
            class="cancel-button"
            data-action="cancel"
            onclick="cancelModal()">

            Batal

        </button>

    `);
}


/* =========================================================
   SIMPAN HUTANG / PIUTANG
========================================================= */

function saveDebt() {

    const amount =
        Number(
            document.getElementById(
                "debtAmount"
            )?.value || 0
        );


    if (amount <= 0) {

        alert(
            "Nominal wajib diisi."
        );

        return;
    }


    db.debts.push({

        id:
            uid("DEBT"),

        type:
            document.getElementById(
                "debtType"
            )?.value ||
            "hutang",

        name:
            document.getElementById(
                "debtName"
            )?.value.trim() || "",

        amount,

        note:
            document.getElementById(
                "debtNote"
            )?.value.trim() || "",

        date:
            new Date().toISOString()

    });


    saveDB();

    cancelModal();

    renderDebts();


    alert(
        "Data berhasil disimpan."
    );
}


/* =========================================================
   TAMPIL HUTANG / PIUTANG
========================================================= */

function renderDebts() {

    const el =
        document.getElementById(
            "debtTable"
        );

    if (!el) return;


    const hutang =
        db.debts
            .filter(
                d => d.type === "hutang"
            )
            .reduce(
                (sum, d) =>
                    sum +
                    Number(
                        d.amount || 0
                    ),
                0
            );


    const piutang =
        db.debts
            .filter(
                d => d.type === "piutang"
            )
            .reduce(
                (sum, d) =>
                    sum +
                    Number(
                        d.amount || 0
                    ),
                0
            );


    const hutangEl =
        document.getElementById(
            "hutangTotal"
        );


    const piutangEl =
        document.getElementById(
            "piutangTotal"
        );


    if (hutangEl) {

        hutangEl.textContent =
            "Rp" +
            rupiah(hutang);

    }


    if (piutangEl) {

        piutangEl.textContent =
            "Rp" +
            rupiah(piutang);

    }


    el.innerHTML =
        db.debts.length

        ?

        db.debts.map(
            d => `

            <div class="row">

                <span>

                    <b>

                        ${
                            d.type === "hutang"
                            ? "HUTANG"
                            : "PIUTANG"
                        }

                    </b>

                    <br>

                    ${escapeHTML(
                        d.name || "-"
                    )}

                </span>


                <b>

                    Rp${rupiah(
                        d.amount
                    )}

                </b>


                <small>

                    ${escapeHTML(
                        d.note || ""
                    )}

                </small>

            </div>

        `
        ).join("")

        :

        "<p>Belum ada data hutang/piutang.</p>";
}


/* =========================================================
   AKHIR BAGIAN 3/4
========================================================= */

/*
   BAGIAN 4/4 DITEMPEL TEPAT DI BAWAH INI
*/

/* =========================================================
   FAEZA STORE ERP
   SCRIPT.JS — FINAL STABLE
   BAGIAN 4/4
========================================================= */


/* =========================================================
   LAPORAN
========================================================= */

function renderReport() {

    const el =
        document.getElementById("report");

    if (!el) return;

    const sales =
        Array.isArray(db.sales)
            ? db.sales
            : [];

    const totalOmzet =
        sales.reduce(
            (sum, sale) =>
                sum + Number(sale.total || 0),
            0
        );

    const totalLaba =
        sales.reduce(
            (sum, sale) =>
                sum + Number(sale.profit || 0),
            0
        );

    const totalTransaksi =
        sales.length;

    const totalProduk =
        db.products.length;

    el.innerHTML = `

        <div class="stats">

            <div>
                <small>
                    Total Transaksi
                </small>

                <b>
                    ${totalTransaksi}
                </b>
            </div>


            <div>
                <small>
                    Total Omzet
                </small>

                <b>
                    Rp${rupiah(totalOmzet)}
                </b>
            </div>


            <div>
                <small>
                    Total Laba
                </small>

                <b>
                    Rp${rupiah(totalLaba)}
                </b>
            </div>


            <div>
                <small>
                    Total Produk
                </small>

                <b>
                    ${totalProduk}
                </b>
            </div>

        </div>


        <div class="card">

            <h3>
                Riwayat Transaksi
            </h3>

            ${
                sales.length

                ?

                [...sales]
                    .reverse()
                    .map(
                        sale => `

                            <div class="row">

                                <span>

                                    <b>
                                        ${escapeHTML(
                                            sale.invoice ||
                                            "-"
                                        )}
                                    </b>

                                    <br>

                                    <small>
                                        ${
                                            sale.date
                                            ?
                                            new Date(
                                                sale.date
                                            ).toLocaleString(
                                                "id-ID"
                                            )
                                            :
                                            "-"
                                        }
                                    </small>

                                </span>


                                <b>
                                    Rp${rupiah(
                                        sale.total || 0
                                    )}
                                </b>

                            </div>

                        `
                    )
                    .join("")

                :

                "<p>Belum ada transaksi.</p>"
            }

        </div>

    `;
}


/* =========================================================
   BACKUP
========================================================= */

function backup() {

    try {

        const backupData = {

            app:
                "Faeza Store ERP",

            version:
                "MVP v2",

            date:
                new Date().toISOString(),

            database:
                db

        };


        const json =
            JSON.stringify(
                backupData,
                null,
                2
            );


        const blob =
            new Blob(
                [json],
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


        const date =
            new Date()
                .toISOString()
                .slice(
                    0,
                    10
                );


        link.href =
            url;

        link.download =
            `faeza-store-backup-${date}.json`;


        document.body.appendChild(
            link
        );


        link.click();


        document.body.removeChild(
            link
        );


        setTimeout(
            function () {

                URL.revokeObjectURL(
                    url
                );

            },
            1000
        );


        alert(
            "Backup berhasil dibuat."
        );


    } catch (error) {

        console.error(
            "Backup error:",
            error
        );


        alert(
            "Backup gagal dibuat."
        );

    }

}


/* =========================================================
   RESTORE
========================================================= */

function restore(event) {

    const input =
        event?.target;


    const file =
        input?.files?.[0];


    if (!file) return;


    const reader =
        new FileReader();


    reader.onload =
        function () {

            try {

                const raw =
                    JSON.parse(
                        reader.result
                    );


                const imported =
                    raw &&
                    raw.database
                    ?
                    raw.database
                    :
                    raw;


                if (
                    !imported ||
                    typeof imported !==
                    "object"
                ) {

                    throw new Error(
                        "Format backup tidak valid."
                    );

                }


                const confirmRestore =
                    confirm(
                        "Restore backup akan mengganti data saat ini.\n\nLanjutkan?"
                    );


                if (!confirmRestore) {

                    input.value =
                        "";

                    return;

                }


                db = {

                    products:
                        Array.isArray(
                            imported.products
                        )
                        ?
                        imported.products
                        :
                        [],

                    stockMoves:
                        Array.isArray(
                            imported.stockMoves
                        )
                        ?
                        imported.stockMoves
                        :
                        [],

                    sales:
                        Array.isArray(
                            imported.sales
                        )
                        ?
                        imported.sales
                        :
                        [],

                    suppliers:
                        Array.isArray(
                            imported.suppliers
                        )
                        ?
                        imported.suppliers
                        :
                        [],

                    debts:
                        Array.isArray(
                            imported.debts
                        )
                        ?
                        imported.debts
                        :
                        [],

                    expenses:
                        Array.isArray(
                            imported.expenses
                        )
                        ?
                        imported.expenses
                        :
                        []

                };


                cart = [];


                saveDB();


                refreshAll();


                cancelModal();


                alert(
                    "Restore berhasil."
                );


            } catch (error) {

                console.error(
                    "Restore error:",
                    error
                );


                alert(
                    "File backup tidak valid atau rusak."
                );

            }


            input.value =
                "";

        };


    reader.onerror =
        function () {

            alert(
                "File backup gagal dibaca."
            );


            input.value =
                "";

        };


    reader.readAsText(
        file
    );

}


/* =========================================================
   RESET DATA
========================================================= */

function resetData() {

    const first =
        confirm(
            "PERINGATAN!\n\nSemua produk, stok, transaksi, supplier, hutang/piutang dan pengeluaran akan dihapus.\n\nLanjutkan?"
        );


    if (!first) return;


    const second =
        confirm(
            "Yakin ingin RESET seluruh data aplikasi?"
        );


    if (!second) return;


    db =
        defaultDB();


    cart =
        [];


    saveDB();


    cancelModal();


    refreshAll();


    alert(
        "Semua data berhasil direset."
    );

}


/* =========================================================
   REFRESH SELURUH DATA
========================================================= */

function refreshAll() {

    dashboard();

    products();

    stocks();

    renderPOS();

    renderCart();

    renderSuppliers();

    renderDebts();

    renderReport();

}


/* =========================================================
   PENGAMAN TOMBOL BATAL
   ANDROID / TOUCH / MOUSE
========================================================= */

function initCancelProtection() {

    if (
        window.__faezaCancelProtection
    ) {

        return;

    }


    window.__faezaCancelProtection =
        true;


    document.addEventListener(
        "click",
        function (event) {

            const button =
                event.target.closest(
                    ".cancel-button"
                );


            if (!button) {

                return;

            }


            event.preventDefault();

            event.stopPropagation();

            event.stopImmediatePropagation();


            cancelModal();


        },
        true
    );

}


/* =========================================================
   PENGAMAN TOUCH ANDROID
========================================================= */

function initAndroidCancelProtection() {

    if (
        window.__faezaTouchProtection
    ) {

        return;

    }


    window.__faezaTouchProtection =
        true;


    document.addEventListener(
        "touchend",
        function (event) {

            const button =
                event.target.closest(
                    ".cancel-button"
                );


            if (!button) {

                return;

            }


            event.preventDefault();

            event.stopPropagation();


            cancelModal();


        },
        {
            capture: true,
            passive: false
        }
    );

}


/* =========================================================
   KLIK LUAR MODAL
========================================================= */

function initModalOutside() {

    if (
        window.__faezaModalOutside
    ) {

        return;

    }


    window.__faezaModalOutside =
        true;


    document.addEventListener(
        "click",
        function (event) {

            const modalBox =
                document.getElementById(
                    "modal"
                );


            if (!modalBox) return;


            if (
                !modalBox.classList.contains(
                    "show"
                )
            ) {

                return;

            }


            if (
                event.target ===
                modalBox
            ) {

                cancelModal();

            }

        }
    );

}


/* =========================================================
   TOMBOL ESC
========================================================= */

function initEscapeKey() {

    if (
        window.__faezaEscapeProtection
    ) {

        return;

    }


    window.__faezaEscapeProtection =
        true;


    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key !==
                "Escape"
            ) {

                return;

            }


            const modalBox =
                document.getElementById(
                    "modal"
                );


            if (
                modalBox &&
                modalBox.classList.contains(
                    "show"
                )
            ) {

                event.preventDefault();

                cancelModal();

            }

        }
    );

}


/* =========================================================
   MENU MOBILE
========================================================= */

function initMobileMenu() {

    const menu =
        document.getElementById(
            "menu"
        );


    const nav =
        document.getElementById(
            "nav"
        );


    if (
        !menu ||
        !nav
    ) {

        return;

    }


    if (
        window.__faezaMobileMenu
    ) {

        return;

    }


    window.__faezaMobileMenu =
        true;


    menu.setAttribute(
        "type",
        "button"
    );


    menu.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            event.stopPropagation();


            nav.classList.toggle(
                "show"
            );

            nav.classList.toggle(
                "open"
            );

        }
    );


    nav.querySelectorAll(
        "[data-page]"
    ).forEach(
        function (button) {

            button.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    event.stopPropagation();


                    const page =
                        this.getAttribute(
                            "data-page"
                        );


                    if (!page) return;


                    showPage(
                        page
                    );


                    nav.classList.remove(
                        "show"
                    );

                    nav.classList.remove(
                        "open"
                    );

                }
            );

        }
    );


    document.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                menu
            ) {

                return;

            }


            if (
                nav.contains(
                    event.target
                )
            ) {

                return;

            }


            nav.classList.remove(
                "show"
            );

            nav.classList.remove(
                "open"
            );

        }
    );

}


/* =========================================================
   INISIALISASI
========================================================= */

function initApp() {

    try {

        /* Pastikan struktur database */

        db.products ||=
            [];

        db.stockMoves ||=
            [];

        db.sales ||=
            [];

        db.suppliers ||=
            [];

        db.debts ||=
            [];

        db.expenses ||=
            [];


        /* Pastikan keranjang */

        if (
            !Array.isArray(cart)
        ) {

            cart = [];

        }


        /* Simpan struktur */

        saveDB();


        /* Pengaman modal */

        initCancelProtection();

        initAndroidCancelProtection();

        initModalOutside();

        initEscapeKey();


        /* Menu */

        initMobileMenu();


        /* Render awal */

        refreshAll();


        /* Halaman awal */

        showPage(
            "dashboard"
        );


        console.log(
            "FAEZA STORE ERP — Bagian 4/4 aktif."
        );


    } catch (error) {

        console.error(
            "Faeza Store ERP initialization error:",
            error
        );

    }

}


/* =========================================================
   DOM READY
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initApp,
        {
            once: true
        }
    );

} else {

    initApp();

}


/* =========================================================
   GLOBAL FUNCTIONS
   UNTUK onclick DI HTML
========================================================= */

window.showPage =
    showPage;

window.go =
    go;

window.cancelModal =
    cancelModal;

window.closeModal =
    closeModal;

window.close =
    close;

window.renderReport =
    renderReport;

window.backup =
    backup;

window.restore =
    restore;

window.resetData =
    resetData;

window.initApp =
    initApp;


/* =========================================================
   AKHIR BAGIAN 4/4
========================================================= */
    


                                                        
                                    
                

               
