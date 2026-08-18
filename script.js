/* =========================================================
   FAEZA STORE ERP
   SCRIPT.JS - MASTER PRODUK + STOK + MUTASI
========================================================= */

const KEY = "faeza_store_erp_v2";

const demo = {
    products: [
        {id:1, barcode:"8991001", name:"Indomie Goreng", cat:"Sembako", unit:"pcs", buy:2500, sell:3500, stock:24, min:8},
        {id:2, barcode:"8991002", name:"Gula Pasir 1 Kg", cat:"Sembako", unit:"kg", buy:15000, sell:17500, stock:6, min:8},
        {id:3, barcode:"8991003", name:"Minyak Goreng 1 L", cat:"Sembako", unit:"liter", buy:16000, sell:19000, stock:14, min:5},
        {id:4, barcode:"8991004", name:"Teh Celup", cat:"Minuman", unit:"pcs", buy:7000, sell:9500, stock:18, min:5},
        {id:5, barcode:"8991005", name:"Air Mineral 600ml", cat:"Minuman", unit:"pcs", buy:2000, sell:3000, stock:30, min:10}
    ],
    sales: [],
    suppliers: [],
    debts: [],
    expenses: [],
    stockMoves: []
};

let db = JSON.parse(localStorage.getItem(KEY) || "null") || demo;
let cart = [];

/* =========================================================
   NORMALISASI DATA LAMA
========================================================= */

db.products = (db.products || []).map(p => ({
    id: p.id || Date.now() + Math.random(),
    barcode: p.barcode || "",
    name: p.name || "",
    cat: p.cat || "Umum",
    unit: p.unit || "pcs",
    buy: Number(p.buy) || 0,
    sell: Number(p.sell) || 0,
    stock: Number(p.stock) || 0,
    min: Number(p.min) || 5
}));

db.sales = db.sales || [];
db.suppliers = db.suppliers || [];
db.debts = db.debts || [];
db.expenses = db.expenses || [];
db.stockMoves = db.stockMoves || [];

const rp = n =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(Number(n) || 0);

function save() {
    localStorage.setItem(KEY, JSON.stringify(db));
}

/* =========================================================
   NAVIGASI
========================================================= */

document.getElementById("menu").onclick = () =>
    document.getElementById("nav").classList.toggle("open");

document.querySelectorAll("#nav button").forEach(b => {
    b.onclick = () => go(b.dataset.page);
});

function go(id) {
    document.querySelectorAll(".page").forEach(x =>
        x.classList.remove("active")
    );

    const page = document.getElementById(id);
    if (page) page.classList.add("active");

    document.getElementById("nav").classList.remove("open");

    render();
}

/* =========================================================
   RENDER UTAMA
========================================================= */

function render() {
    dash();
    renderPOS();
    products();
    stocks();
    suppliers();
    debts();
    report();
}

/* =========================================================
   DASHBOARD
========================================================= */

function dash() {
    const today = new Date().toISOString().slice(0, 10);

    const salesToday = db.sales.filter(x =>
        x.date && x.date.slice(0, 10) === today
    );

    const omzet = salesToday.reduce((a, x) => a + Number(x.total || 0), 0);
    const laba = salesToday.reduce((a, x) => a + Number(x.profit || 0), 0);

    const low = db.products.filter(p => p.stock <= p.min);

    document.getElementById("omzet").textContent = rp(omzet);
    document.getElementById("trx").textContent = salesToday.length;
    document.getElementById("laba").textContent = rp(laba);
    document.getElementById("menipis").textContent = low.length;

    document.getElementById("dashStock").innerHTML =
        low.map(p => `
            <div class="row">
                <span>${escapeHTML(p.name)}</span>
                <b class="danger">${p.stock} ${escapeHTML(p.unit)}</b>
            </div>
        `).join("") || "Semua stok aman.";

    document.getElementById("dashSales").innerHTML =
        db.sales.slice(-5).reverse().map(x => `
            <div class="row">
                <span>${escapeHTML(x.invoice)}</span>
                <span>${rp(x.total)}</span>
            </div>
        `).join("") || "Belum ada transaksi.";
}

/* =========================================================
   KASIR / POS
========================================================= */

function renderPOS() {
    const q = (document.getElementById("search")?.value || "")
        .toLowerCase();

    const list = db.products.filter(p =>
        (p.name + " " + p.barcode + " " + p.cat)
            .toLowerCase()
            .includes(q)
    );

    document.getElementById("posProducts").innerHTML =
        list.map(p => `
            <div class="product">
                <small>${escapeHTML(p.barcode)}</small>
                <b>${escapeHTML(p.name)}</b>
                <span>
                    ${rp(p.sell)} • stok ${p.stock} ${escapeHTML(p.unit)}
                </span>
                <br><br>
                <button
                    onclick="addCart(${p.id})"
                    ${p.stock <= 0 ? "disabled" : ""}
                >
                    ${p.stock <= 0 ? "Stok Habis" : "Tambah"}
                </button>
            </div>
        `).join("");

    document.getElementById("cart").innerHTML =
        cart.map(c => {
            const p = db.products.find(x => x.id == c.id);
            if (!p) return "";

            return `
                <div class="row">
                    <span>${escapeHTML(p.name)}</span>
                    <span>${c.qty}x</span>
                    <span>${rp(p.sell * c.qty)}</span>
                    <button onclick="qty(${p.id},-1)">−</button>
                    <button onclick="qty(${p.id},1)">+</button>
                </div>
            `;
        }).join("") || "Keranjang kosong";

    const total = cart.reduce((a, c) => {
        const p = db.products.find(x => x.id == c.id);
        return a + (p ? p.sell * c.qty : 0);
    }, 0);

    document.getElementById("total").textContent = rp(total);
}

function addCart(id) {
    const p = db.products.find(x => x.id == id);

    if (!p || p.stock < 1) {
        return alert("Stok habis.");
    }

    const c = cart.find(x => x.id == id);

    if (c) {
        if (c.qty < p.stock) {
            c.qty++;
        } else {
            alert("Jumlah melebihi stok.");
        }
    } else {
        cart.push({
            id,
            qty: 1
        });
    }

    renderPOS();
}

function qty(id, d) {
    const c = cart.find(x => x.id == id);

    if (!c) return;

    const p = db.products.find(x => x.id == id);

    c.qty += d;

    if (c.qty > p.stock) {
        c.qty = p.stock;
        alert("Jumlah melebihi stok.");
    }

    if (c.qty <= 0) {
        cart = cart.filter(x => x.id != id);
    }

    renderPOS();
}

function clearCart() {
    cart = [];
    renderPOS();
}

/* =========================================================
   PEMBAYARAN
========================================================= */

function pay() {
    if (!cart.length) {
        return alert("Keranjang kosong.");
    }

    const total = cart.reduce((a, c) => {
        const p = db.products.find(x => x.id == c.id);
        return a + p.sell * c.qty;
    }, 0);

    const paid =
        Number(document.getElementById("paid").value) || 0;

    if (paid < total) {
        return alert("Pembayaran kurang.");
    }

    let profit = 0;

    cart.forEach(c => {
        const p = db.products.find(x => x.id == c.id);

        const oldStock = p.stock;

        p.stock -= c.qty;

        profit += (p.sell - p.buy) * c.qty;

        db.stockMoves.push({
            id: Date.now() + Math.random(),
            date: new Date().toISOString(),
            productId: p.id,
            productName: p.name,
            type: "keluar",
            qty: c.qty,
            before: oldStock,
            after: p.stock,
            note: "Penjualan kasir"
        });
    });

    const invoice =
        "INV-" + Date.now().toString().slice(-8);

    db.sales.push({
        invoice,
        date: new Date().toISOString(),
        total,
        profit,
        items: cart.map(x => ({
            id: x.id,
            qty: x.qty
        }))
    });

    save();

    alert(
        "Transaksi berhasil.\n\n" +
        "No: " + invoice +
        "\nKembalian: " + rp(paid - total)
    );

    cart = [];

    document.getElementById("paid").value = "";

    render();
}

/* =========================================================
   MASTER PRODUK
========================================================= */

function products() {
    document.getElementById("productsTable").innerHTML =
        `
        <div class="row">
            <b>Produk</b>
            <b>Jual</b>
            <b>Stok</b>
            <b>Aksi</b>
        </div>
        ` +
        db.products.map(p => `
            <div class="row">
                <span>
                    <b>${escapeHTML(p.name)}</b>
                    <small>
                        • ${escapeHTML(p.cat)}
                        • ${escapeHTML(p.unit)}
                        • ${escapeHTML(p.barcode)}
                    </small>
                </span>

                <span>${rp(p.sell)}</span>

                <span class="${p.stock <= p.min ? "danger" : ""}">
                    ${p.stock} ${escapeHTML(p.unit)}
                </span>

                <span>
                    <button onclick="editProduct(${p.id})">
                        Edit
                    </button>

                    <button onclick="delProduct(${p.id})">
                        Hapus
                    </button>
                </span>
            </div>
        `).join("");
}

/* =========================================================
   TAMBAH PRODUK
========================================================= */

function addProduct() {
    modal(`
        <h3>Tambah Produk</h3>

        <input id="n" placeholder="Nama produk">

        <br><br>

        <input id="b" placeholder="Barcode">

        <br><br>

        <input id="cat" placeholder="Kategori">

        <br><br>

        <select id="unit">
            <option value="pcs">pcs</option>
            <option value="kg">kg</option>
            <option value="gram">gram</option>
            <option value="liter">liter</option>
            <option value="dus">dus</option>
            <option value="karton">karton</option>
            <option value="botol">botol</option>
            <option value="pack">pack</option>
        </select>

        <br><br>

        <input id="buy"
            type="number"
            placeholder="Harga beli">

        <br><br>

        <input id="sell"
            type="number"
            placeholder="Harga jual">

        <br><br>

        <input id="st"
            type="number"
            placeholder="Stok awal">

        <br><br>

        <input id="min"
            type="number"
            placeholder="Stok minimum">

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
    const n = document.getElementById("n").value.trim();
    const b = document.getElementById("b").value.trim();
    const cat =
        document.getElementById("cat").value.trim() || "Umum";

    const unit =
        document.getElementById("unit").value || "pcs";

    const buy =
        Number(document.getElementById("buy").value) || 0;

    const sell =
        Number(document.getElementById("sell").value) || 0;

    const stock =
        Number(document.getElementById("st").value) || 0;

    const min =
        Number(document.getElementById("min").value) || 5;

    if (!n) {
        return alert("Nama produk wajib diisi.");
    }

    if (b && db.products.some(p => p.barcode === b)) {
        return alert("Barcode sudah digunakan produk lain.");
    }

    const id = Date.now();

    db.products.push({
        id,
        barcode: b || String(id),
        name: n,
        cat,
        unit,
        buy,
        sell,
        stock,
        min
    });

    if (stock > 0) {
        db.stockMoves.push({
            id: Date.now() + Math.random(),
            date: new Date().toISOString(),
            productId: id,
            productName: n,
            type: "masuk",
            qty: stock,
            before: 0,
            after: stock,
            note: "Stok awal produk"
        });
    }

    save();
    close();
    render();
}

/* =========================================================
   EDIT PRODUK
========================================================= */

function editProduct(id) {
    const p = db.products.find(x => x.id == id);

    if (!p) return;

    modal(`
        <h3>Edit Produk</h3>

        <input id="en"
            value="${escapeAttr(p.name)}"
            placeholder="Nama produk">

        <br><br>

        <input id="eb"
            value="${escapeAttr(p.barcode)}"
            placeholder="Barcode">

        <br><br>

        <input id="ec"
            value="${escapeAttr(p.cat)}"
            placeholder="Kategori">

        <br><br>

        <select id="eu">
            ${["pcs","kg","gram","liter","dus","karton","botol","pack"]
                .map(u =>
                    `<option value="${u}" ${p.unit === u ? "selected" : ""}>
                        ${u}
                    </option>`
                ).join("")}
        </select>

        <br><br>

        <input id="ebuy"
            type="number"
            value="${p.buy}"
            placeholder="Harga beli">

        <br><br>

        <input id="esell"
            type="number"
            value="${p.sell}"
            placeholder="Harga jual">

        <br><br>

        <input id="emin"
            type="number"
            value="${p.min}"
            placeholder="Stok minimum">

        <br><br>

        <button class="gold"
            onclick="updateProduct(${id})">
            Simpan Perubahan
        </button>

        <button onclick="close()">
            Batal
        </button>
    `);
}

function updateProduct(id) {
    const p = db.products.find(x => x.id == id);

    if (!p) return;

    const barcode =
        document.getElementById("eb").value.trim();

    if (
        barcode &&
        db.products.some(x =>
            x.id != id && x.barcode === barcode
        )
    ) {
        return alert("Barcode sudah digunakan produk lain.");
    }

    p.name =
        document.getElementById("en").value.trim();

    p.barcode = barcode;

    p.cat =
        document.getElementById("ec").value.trim() || "Umum";

    p.unit =
        document.getElementById("eu").value || "pcs";

    p.buy =
        Number(document.getElementById("ebuy").value) || 0;

    p.sell =
        Number(document.getElementById("esell").value) || 0;

    p.min =
        Number(document.getElementById("emin").value) || 5;

    save();
    close();
    render();
}

/* =========================================================
   HAPUS PRODUK
========================================================= */

function delProduct(id) {
    const p = db.products.find(x => x.id == id);

    if (!p) return;

    if (
        !confirm(
            "Hapus produk \"" +
            p.name +
            "\"?"
        )
    ) return;

    db.products =
        db.products.filter(x => x.id != id);

    save();
    render();
}

/* =========================================================
   STOK
========================================================= */

function stocks() {
    const table = document.getElementById("stockTable");
    const history = document.getElementById("stockHistory");

    if (!table) return;

    table.innerHTML = `
        <div class="row">
            <b>Produk</b>
            <b>Stok</b>
            <b>Min</b>
            <b>Status</b>
        </div>

        ${
            db.products.map(p => `
                <div class="row">
                    <span>
                        <b>${escapeHTML(p.name)}</b><br>
                        <small>${escapeHTML(p.barcode)}</small>
                    </span>

                    <span>
                        ${p.stock} ${escapeHTML(p.unit)}
                    </span>

                    <span>${p.min}</span>

                    <span class="${p.stock <= p.min ? "danger" : ""}">
                        ${
                            p.stock <= p.min
                            ? "MENIPIS"
                            : "AMAN"
                        }
                    </span>
                </div>
            `).join("")
            || "Belum ada produk."
        }
    `;

    if (!history) return;

    const moves = (db.stockMoves || [])
        .slice()
        .reverse();

    history.innerHTML =
        moves.length
        ? moves.map(m => `
            <div class="row">
                <span>
                    <b>${escapeHTML(m.productName)}</b><br>
                    <small>
                        ${new Date(m.date).toLocaleString("id-ID")}
                    </small>
                </span>

                <span>
                    ${
                        m.type === "masuk"
                        ? "＋"
                        : "−"
                    }${m.qty}
                </span>

                <span>
                    ${m.before} → ${m.after}
                </span>

                <small>
                    ${escapeHTML(m.note || "")}
                </small>
            </div>
        `).join("")
        : "Belum ada riwayat mutasi stok.";
}


/* =========================================================
   STOK MASUK
========================================================= */

function stockIn() {
    const o = db.products.map(p =>
        `<option value="${p.id}">
            ${escapeHTML(p.name)}
        </option>`
    ).join("");

    modal(`
        <h3>Stok Masuk</h3>

        <select id="sp">
            ${o}
        </select>

        <br><br>

        <input id="sq"
            type="number"
            min="1"
            placeholder="Jumlah">

        <br><br>

        <input id="snote"
            placeholder="Keterangan">

        <br><br>

        <button class="gold"
            onclick="saveStock()">
            Simpan Stok
        </button>

        <button onclick="close()">
            Batal
        </button>
    `);
}

function saveStock() {
    const p =
        db.products.find(
            x => x.id == document.getElementById("sp").value
        );

    const q =
        Number(document.getElementById("sq").value);

    const note =
        document.getElementById("snote").value.trim()
        || "Stok masuk";

    if (!p || q < 1) {
        return alert("Jumlah tidak valid.");
    }

    const before = p.stock;

    p.stock += q;

    db.stockMoves.push({
        id: Date.now() + Math.random(),
        date: new Date().toISOString(),
        productId: p.id,
        productName: p.name,
        type: "masuk",
        qty: q,
        before,
        after: p.stock,
        note
    });

    save();
    close();
    render();
}

/* =========================================================
   STOK KELUAR / PENYESUAIAN
========================================================= */

function stockOut() {
    const o = db.products.map(p =>
        `<option value="${p.id}">
            ${escapeHTML(p.name)}
        </option>`
    ).join("");

    modal(`
        <h3>Stok Keluar / Penyesuaian</h3>

        <select id="so">
            ${o}
        </select>

        <br><br>

        <input id="oq"
            type="number"
            min="1"
            placeholder="Jumlah keluar">

        <br><br>

        <input id="onote"
            placeholder="Keterangan">

        <br><br>

        <button class="gold"
            onclick="saveStockOut()">
            Simpan
        </button>

        <button onclick="close()">
            Batal
        </button>
    `);
}

function saveStockOut() {
    const p =
        db.products.find(
            x => x.id == document.getElementById("so").value
        );

    const q =
        Number(document.getElementById("oq").value);

    const note =
        document.getElementById("onote").value.trim()
        || "Stok keluar";

    if (!p || q < 1) {
        return alert("Jumlah tidak valid.");
    }

    if (q > p.stock) {
        return alert("Stok tidak mencukupi.");
    }

    const before = p.stock;

    p.stock -= q;

    db.stockMoves.push({
        id: Date.now() + Math.random(),
        date: new Date().toISOString(),
        productId: p.id,
        productName: p.name,
        type: "keluar",
        qty: q,
        before,
        after: p.stock,
        note
    });

    save();
    close();
    render();
}

/* =========================================================
   SUPPLIER
========================================================= */

function suppliers() {
    document.getElementById("supplierTable").innerHTML =
        db.suppliers.map(s => `
            <div class="row">
                <span>${escapeHTML(s.name)}</span>
                <span>${escapeHTML(s.phone || "-")}</span>
                <button onclick="delSupplier(${s.id})">
                    Hapus
                </button>
            </div>
        `).join("") || "Belum ada supplier.";
}

function addSupplier() {
    modal(`
        <h3>Tambah Supplier</h3>

        <input id="sn"
            placeholder="Nama supplier">

        <br><br>

        <input id="ph"
            placeholder="No. WhatsApp">

        <br><br>

        <button class="gold"
            onclick="saveSupplier()">
            Simpan
        </button>

        <button onclick="close()">
            Batal
        </button>
    `);
}

function saveSupplier() {
    const n =
        document.getElementById("sn").value.trim();

    if (!n) return;

    db.suppliers.push({
        id: Date.now(),
        name: n,
        phone:
            document.getElementById("ph").value
    });

    save();
    close();
    render();
}

function delSupplier(id) {
    db.suppliers =
        db.suppliers.filter(x => x.id != id);

    save();
    render();
}

/* =========================================================
   HUTANG / PIUTANG
========================================================= */

function debts() {
    const h =
        db.debts
            .filter(x => x.type === "hutang")
            .reduce(
                (a, x) => a + x.amount - x.paid,
                0
            );

    const p =
        db.debts
            .filter(x => x.type === "piutang")
            .reduce(
                (a, x) => a + x.amount - x.paid,
                0
            );

    document.getElementById("hutangTotal").textContent = rp(h);
    document.getElementById("piutangTotal").textContent = rp(p);

    document.getElementById("debtTable").innerHTML =
        db.debts.map(x => `
            <div class="row">
                <span>${escapeHTML(x.name)}</span>
                <span>${escapeHTML(x.type)}</span>
                <span>${rp(x.amount - x.paid)}</span>
                <button onclick="payDebt(${x.id})">
                    Bayar
                </button>
            </div>
        `).join("") || "Belum ada catatan.";
}

function addDebt() {
    modal(`
        <h3>Catat Hutang/Piutang</h3>

        <select id="dt">
            <option value="hutang">Hutang</option>
            <option value="piutang">Piutang</option>
        </select>

        <br><br>

        <input id="dn"
            placeholder="Nama">

        <br><br>

        <input id="da"
            type="number"
            placeholder="Nominal">

        <br><br>

        <button class="gold"
            onclick="saveDebt()">
            Simpan
        </button>

        <button onclick="close()">
            Batal
        </button>
    `);
}

function saveDebt() {
    db.debts.push({
        id: Date.now(),
        type: document.getElementById("dt").value,
        name: document.getElementById("dn").value,
        amount:
            Number(document.getElementById("da").value) || 0,
        paid: 0
    });

    save();
    close();
    render();
}

function payDebt(id) {
    const d =
        db.debts.find(x => x.id == id);

    if (!d) return;

    const q =
        Number(
            prompt(
                "Nominal pembayaran",
                d.amount - d.paid
            )
        ) || 0;

    d.paid =
        Math.min(
            d.amount,
            d.paid + q
        );

    save();
    render();
}

/* =========================================================
   LAPORAN
========================================================= */

function report() {
    const om =
        db.sales.reduce(
            (a, x) => a + x.total,
            0
        );

    const lb =
        db.sales.reduce(
            (a, x) => a + x.profit,
            0
        );

    const h =
        db.debts
            .filter(x => x.type === "hutang")
            .reduce(
                (a, x) => a + x.amount - x.paid,
                0
            );

    const p =
        db.debts
            .filter(x => x.type === "piutang")
            .reduce(
                (a, x) => a + x.amount - x.paid,
                0
            );

    document.getElementById("report").innerHTML = `
        <div class="row">
            <span>Total omzet</span>
            <b>${rp(om)}</b>
        </div>

        <div class="row">
            <span>Laba kotor</span>
            <b>${rp(lb)}</b>
        </div>

        <div class="row">
            <span>Hutang berjalan</span>
            <b>${rp(h)}</b>
        </div>

        <div class="row">
            <span>Piutang berjalan</span>
            <b>${rp(p)}</b>
        </div>

        <div class="row">
            <span>Total produk</span>
            <b>${db.products.length}</b>
        </div>

        <div class="row">
            <span>Total mutasi stok</span>
            <b>${db.stockMoves.length}</b>
        </div>
    `;
}

/* =========================================================
   MODAL
========================================================= */

function modal(body) {
    document.getElementById("modal").innerHTML =
        `<div class="box">${body}</div>`;

    document.getElementById("modal")
        .className = "modal show";
}

function close() {
    document.getElementById("modal")
        .className = "modal";
}

/* =========================================================
   BACKUP & RESTORE
========================================================= */

function backup() {
    const a = document.createElement("a");

    a.href =
        URL.createObjectURL(
            new Blob(
                [JSON.stringify(db, null, 2)],
                {type:"application/json"}
            )
        );

    a.download =
        "faeza-store-backup.json";

    a.click();
}

function restore(e) {
    const f =
        e.target.files[0];

    if (!f) return;

    const r = new FileReader();

    r.onload = () => {
        try {
            db = JSON.parse(r.result);

            db.products = db.products || [];
            db.sales = db.sales || [];
            db.suppliers = db.suppliers || [];
            db.debts = db.debts || [];
            db.expenses = db.expenses || [];
            db.stockMoves = db.stockMoves || [];

            save();
            render();

            alert(
                "Backup berhasil dipulihkan."
            );

        } catch {
            alert(
                "File backup tidak valid."
            );
        }
    };

    r.readAsText(f);
}

function resetData() {
    if (
        confirm(
            "Hapus semua data dan kembali ke data demo?"
        )
    ) {
        localStorage.removeItem(KEY);
        location.reload();
    }
}

/* =========================================================
   KEAMANAN OUTPUT HTML
========================================================= */

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeAttr(value) {
    return escapeHTML(value);
}

/* =========================================================
   SERVICE WORKER
========================================================= */

if ("serviceWorker" in navigator) {
    navigator.serviceWorker
        .register("service-worker.js")
        .catch(() => {});
}

/* =========================================================
   START
========================================================= */

save();
render();


/* =========================================================
   KARTU STOK
========================================================= */

function stockCard() {
    const products = db.products || [];

    modal(`
        <h3>Kartu Stok</h3>

        <select id="cardProduct">
            <option value="">-- Pilih Produk --</option>

            ${products.map(p => `
                <option value="${p.id}">
                    ${escapeHTML(p.name)}
                </option>
            `).join("")}
        </select>

        <br><br>

        <button class="gold" onclick="showStockCard()">
            Tampilkan Kartu Stok
        </button>

        <button onclick="close()">
            Tutup
        </button>

        <div id="stockCardResult"></div>
    `);
}

function showStockCard() {
    const id =
        document.getElementById("cardProduct").value;

    if (!id) {
        alert("Pilih produk terlebih dahulu.");
        return;
    }

    const p =
        db.products.find(x => String(x.id) === String(id));

    if (!p) return;

    const moves =
        (db.stockMoves || [])
            .filter(x =>
                String(x.productId) === String(id)
            )
            .sort(
                (a, b) =>
                    new Date(a.date) -
                    new Date(b.date)
            );

    let saldo = 0;

    const rows = moves.map(m => {

        saldo = Number(m.after);

        return `
            <div class="stock-card-row">

                <div>
                    <b>
                        ${new Date(m.date)
                            .toLocaleString("id-ID")}
                    </b>

                    <small>
                        ${escapeHTML(m.note || "-")}
                    </small>
                </div>

                <div>
                    ${
                        m.type === "masuk"
                        ? m.qty
                        : "-"
                    }
                </div>

                <div>
                    ${
                        m.type === "keluar"
                        ? m.qty
                        : "-"
                    }
                </div>

                <div>
                    <b>${saldo}</b>
                </div>

            </div>
        `;
    }).join("");

    document.getElementById("stockCardResult").innerHTML = `
        <br>

        <h4>
            ${escapeHTML(p.name)}
        </h4>

        <p>
            Stok saat ini:
            <b>${p.stock} ${escapeHTML(p.unit)}</b>
        </p>

        <div class="stock-card-head">
            <b>Waktu</b>
            <b>Masuk</b>
            <b>Keluar</b>
            <b>Saldo</b>
        </div>

        ${
            rows ||
            "<p>Belum ada mutasi untuk produk ini.</p>"
        }
    `;
}





