/* =====================================================
   FAEZA ERP
   CORE SYSTEM V2
   ===================================================== */

"use strict";

/* =====================================================
   DATABASE LOCAL
   ===================================================== */

const DB_KEY = "FAEZA_ERP_DATABASE_V2";

let db = {
    products: [],
    customers: [],
    transactions: []
};

let cart = [];


/* =====================================================
   LOAD DATABASE
   ===================================================== */

function loadDatabase() {

    try {

        const saved = localStorage.getItem(DB_KEY);

        if (saved) {
            const parsed = JSON.parse(saved);

            db = {
    products: Array.isArray(parsed.products)
        ? parsed.products : [],

    customers: Array.isArray(parsed.customers)
        ? parsed.customers : [],

    transactions: Array.isArray(parsed.transactions)
        ? parsed.transactions : [],

    suppliers: Array.isArray(parsed.suppliers)
        ? parsed.suppliers : []
};
                
        

    } catch (error) {

        console.error("Database error:", error);

        db = {
            products: [],
            customers: [],
            transactions: []
        };
    }
}


/* =====================================================
   SAVE DATABASE
   ===================================================== */

function saveDatabase() {

    localStorage.setItem(
        DB_KEY,
        JSON.stringify(db)
    );
}


/* =====================================================
   HELPER
   ===================================================== */

function rupiah(value) {

    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(Number(value) || 0);
}


function generateId(prefix = "ID") {

    return prefix + "_" +
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .substring(2, 7);
}


function showToast(message) {

    const toast = document.getElementById("toast");

    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2200);
}


/* =====================================================
   NAVIGATION
   ===================================================== */

function setupNavigation() {

    const buttons =
        document.querySelectorAll(
            ".side-menu button"
        );

    buttons.forEach(button => {

        button.addEventListener("click", () => {

            const page =
                button.dataset.page;

            openPage(page);

        });

    });


    const menuButton =
        document.getElementById("menuButton");

    const sideMenu =
        document.getElementById("sideMenu");

    menuButton.addEventListener(
        "click",
        () => {

            sideMenu.classList.toggle("open");

        }
    );
}


function openPage(pageId) {

    document
        .querySelectorAll(".page")
        .forEach(page => {

            page.classList.remove("active");

        });


    const target =
        document.getElementById(pageId);

    if (target) {
        target.classList.add("active");
    }


    if (pageId === "dashboard") {
        renderDashboard();
    }

    if (pageId === "kasir") {
        renderCashierProducts();
        renderCart();
    }

    if (pageId === "produk") {
        renderProducts();
    }

    if (pageId === "pelanggan") {
        renderCustomers();
    }

    if (pageId === "laporan") {
        renderReports();
    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =====================================================
   PRODUCT
   ===================================================== */

function saveProduct() {

    const name =
        document.getElementById("productName")
            .value.trim();

    const code =
        document.getElementById("productCode")
            .value.trim();

    const buyPrice =
        Number(
            document.getElementById(
                "productBuyPrice"
            ).value
        );

    const sellPrice =
        Number(
            document.getElementById(
                "productSellPrice"
            ).value
        );

    const stock =
        Number(
            document.getElementById(
                "productStock"
            ).value
        );

    const minStock =
        Number(
            document.getElementById(
                "productMinStock"
            ).value
        );


    if (!name) {
        showToast("Nama produk wajib diisi");
        return;
    }

    if (!sellPrice || sellPrice < 0) {
        showToast("Harga jual belum benar");
        return;
    }


    const product = {

        id: generateId("PROD"),

        name,

        code: code ||
            "PRD-" +
            String(db.products.length + 1)
                .padStart(3, "0"),

        buyPrice: buyPrice || 0,

        sellPrice,

        stock: stock || 0,

        minStock: minStock || 0,

        createdAt:
            new Date().toISOString()

    };


    db.products.push(product);

    saveDatabase();

    clearProductForm();

    renderProducts();

    renderCashierProducts();

    renderDashboard();

    showToast("Produk berhasil disimpan");
}


function clearProductForm() {

    document.getElementById(
        "productName"
    ).value = "";

    document.getElementById(
        "productCode"
    ).value = "";

    document.getElementById(
        "productBuyPrice"
    ).value = "";

    document.getElementById(
        "productSellPrice"
    ).value = "";

    document.getElementById(
        "productStock"
    ).value = "";

    document.getElementById(
        "productMinStock"
    ).value = "";
}


function renderProducts() {

    const tbody =
        document.getElementById(
            "productTableBody"
        );

    if (!tbody) return;

    tbody.innerHTML = "";


    if (db.products.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    Belum ada produk.
                </td>
            </tr>
        `;

        return;
    }


    db.products.forEach(product => {

        const row =
            document.createElement("tr");

        row.innerHTML = `

            <td>${product.code}</td>

            <td>${product.name}</td>

            <td>${rupiah(product.sellPrice)}</td>

            <td>${product.stock}</td>

            <td>

                <button
                    class="small-btn delete-btn"
                    data-delete-product="${product.id}">
                    Hapus
                </button>

            </td>
        `;

        tbody.appendChild(row);

    });
}


function deleteProduct(id) {

    const product =
        db.products.find(
            item => item.id === id
        );

    if (!product) return;


    const usedInCart =
        cart.some(
            item => item.productId === id
        );

    if (usedInCart) {

        showToast(
            "Produk masih ada di keranjang"
        );

        return;
    }


    if (!confirm(
        `Hapus produk "${product.name}"?`
    )) {
        return;
    }


    db.products =
        db.products.filter(
            item => item.id !== id
        );

    saveDatabase();

    renderProducts();

    renderCashierProducts();

    renderDashboard();

    showToast("Produk dihapus");
}


/* =====================================================
   CASHIER PRODUCT SELECT
   ===================================================== */

function renderCashierProducts() {

    const select =
        document.getElementById(
            "cashierProduct"
        );

    if (!select) return;

    select.innerHTML =
        `<option value="">Pilih produk</option>`;


    db.products.forEach(product => {

        const option =
            document.createElement("option");

        option.value = product.id;

        option.textContent =
            `${product.name} — ${rupiah(product.sellPrice)} — Stok ${product.stock}`;

        select.appendChild(option);

    });
}


/* =====================================================
   CART
   ===================================================== */

function addToCart() {

    const productId =
        document.getElementById(
            "cashierProduct"
        ).value;

    const qty =
        Number(
            document.getElementById(
                "cashierQty"
            ).value
        );


    if (!productId) {

        showToast("Pilih produk terlebih dahulu");

        return;
    }


    if (!qty || qty <= 0) {

        showToast("Jumlah produk tidak valid");

        return;
    }


    const product =
        db.products.find(
            item => item.id === productId
        );


    if (!product) return;


    if (qty > product.stock) {

        showToast(
            `Stok ${product.name} hanya ${product.stock}`
        );

        return;
    }


    const existing =
        cart.find(
            item => item.productId === productId
        );


    if (existing) {

        const newQty =
            existing.qty + qty;

        if (newQty > product.stock) {

            showToast("Melebihi stok tersedia");

            return;
        }

        existing.qty = newQty;

    } else {

        cart.push({

            productId,

            name: product.name,

            price: product.sellPrice,

            qty

        });

    }


    document.getElementById(
        "cashierQty"
    ).value = 1;

    renderCart();

    showToast("Produk masuk keranjang");
}


function renderCart() {

    const container =
        document.getElementById(
            "cartContainer"
        );

    if (!container) return;


    if (cart.length === 0) {

        container.innerHTML =
            "Keranjang masih kosong.";

        updateCartTotal();

        return;
    }


    container.innerHTML = "";


    cart.forEach(item => {

        const subtotal =
            item.price * item.qty;


        const div =
            document.createElement("div");

        div.className = "cart-item";

        div.innerHTML = `

            <span>${item.name}</span>

            <span>${item.qty}x</span>

            <span>${rupiah(subtotal)}</span>

            <button
                data-remove-cart="${item.productId}">
                ×
            </button>

        `;

        container.appendChild(div);

    });


    updateCartTotal();
}


function getCartTotal() {

    return cart.reduce(
        (total, item) =>
            total + item.price * item.qty,
        0
    );
}


function updateCartTotal() {

    const total =
        getCartTotal();

    document.getElementById(
        "cartTotal"
    ).textContent = rupiah(total);

    updateChange();
}


function removeFromCart(productId) {

    cart =
        cart.filter(
            item => item.productId !== productId
        );

    renderCart();

    showToast("Produk dihapus dari keranjang");
}


function clearCart() {

    cart = [];

    document.getElementById(
        "paymentAmount"
    ).value = "";

    renderCart();

    showToast("Keranjang dikosongkan");
}


/* =====================================================
   PAYMENT
   ===================================================== */

function updateChange() {

    const total =
        getCartTotal();

    const payment =
        Number(
            document.getElementById(
                "paymentAmount"
            ).value
        ) || 0;

    const change =
        payment - total;


    document.getElementById(
        "changeAmount"
    ).textContent =
        rupiah(
            change > 0 ? change : 0
        );
}


/* =====================================================
   CANCEL TRANSACTION
   ===================================================== */

function cancelTransaction() {

    cart = [];

    document.getElementById(
        "paymentAmount"
    ).value = "";

    renderCart();

    showToast("Transaksi dibatalkan");
}


/* =====================================================
   SAVE TRANSACTION
   ===================================================== */

function saveTransaction() {

    if (cart.length === 0) {

        showToast(
            "Keranjang masih kosong"
        );

        return;
    }


    const total =
        getCartTotal();


    const payment =
        Number(
            document.getElementById(
                "paymentAmount"
            ).value
        ) || 0;


    if (payment < total) {

        showToast(
            "Pembayaran masih kurang"
        );

        return;
    }


    const transaction = {

        id: generateId("TRX"),

        date:
            new Date().toISOString(),

        items:
            cart.map(item => ({
                ...item
            })),

        total,

        payment,

        change:
            payment - total

    };


    cart.forEach(item => {

        const product =
            db.products.find(
                product =>
                    product.id === item.productId
            );

        if (product) {

            product.stock -= item.qty;

        }

    });


    db.transactions.push(
        transaction
    );


    saveDatabase();


    cart = [];


    document.getElementById(
        "paymentAmount"
    ).value = "";


    renderCart();

    renderProducts();

    renderCashierProducts();

    renderDashboard();

    renderReports();


    showToast(
        "Transaksi berhasil disimpan"
    );
}


/* =====================================================
   CUSTOMER
   ===================================================== */

function saveCustomer() {

    const name =
        document.getElementById(
            "customerName"
        ).value.trim();

    const phone =
        document.getElementById(
            "customerPhone"
        ).value.trim();

    const address =
        document.getElementById(
            "customerAddress"
        ).value.trim();


    if (!name) {

        showToast(
            "Nama pelanggan wajib diisi"
        );

        return;
    }


    db.customers.push({

        id: generateId("CUS"),

        name,

        phone,

        address,

        createdAt:
            new Date().toISOString()

    });


    saveDatabase();

    clearCustomerForm();

    renderCustomers();

    showToast(
        "Pelanggan berhasil disimpan"
    );
}


function clearCustomerForm() {

    document.getElementById(
        "customerName"
    ).value = "";

    document.getElementById(
        "customerPhone"
    ).value = "";

    document.getElementById(
        "customerAddress"
    ).value = "";
}


function renderCustomers() {

    const container =
        document.getElementById(
            "customerList"
        );

    if (!container) return;


    if (db.customers.length === 0) {

        container.innerHTML =
            "Belum ada pelanggan.";

        return;
    }


    container.innerHTML = "";


    db.customers.forEach(customer => {

        const div =
            document.createElement("div");

        div.className =
            "customer-card";

        div.innerHTML = `

            <strong>${customer.name}</strong>

            <span>
                ${customer.phone || "-"}
            </span>

            <br>

            <span>
                ${customer.address || "-"}
            </span>

        `;

        container.appendChild(div);

    });
}


/* =====================================================
   DASHBOARD
   ===================================================== */

function renderDashboard() {

    const today =
        new Date()
            .toISOString()
            .slice(0, 10);


    const todayTransactions =
        db.transactions.filter(
            transaction =>
                transaction.date.slice(0, 10)
                === today
        );


    const omzet =
        todayTransactions.reduce(
            (sum, transaction) =>
                sum + transaction.total,
            0
        );


    const lowStock =
        db.products.filter(
            product =>
                product.stock <= product.minStock
        ).length;


    document.getElementById(
        "dashboardOmzet"
    ).textContent = rupiah(omzet);


    document.getElementById(
        "dashboardTransaksi"
    ).textContent =
        todayTransactions.length;


    document.getElementById(
        "dashboardProduk"
    ).textContent =
        db.products.length;


    document.getElementById(
        "dashboardStokMenipis"
    ).textContent =
        lowStock;


    const recent =
        document.getElementById(
            "recentTransactions"
        );


    if (!recent) return;


    if (db.transactions.length === 0) {

        recent.innerHTML =
            "Belum ada transaksi.";

        return;
    }


    recent.innerHTML = "";


    db.transactions
        .slice(-5)
        .reverse()
        .forEach(transaction => {

            const div =
                document.createElement("div");

            div.className =
                "transaction-card";

            div.innerHTML = `

                <strong>
                    ${transaction.id}
                </strong>

                <span>
                    ${new Date(
                        transaction.date
                    ).toLocaleString("id-ID")}
                </span>

                <br>

                <span>
                    Total:
                    ${rupiah(transaction.total)}
                </span>

            `;

            recent.appendChild(div);

        });
}


/* =====================================================
   REPORT
   ===================================================== */

function renderReports() {

    const omzet =
        db.transactions.reduce(
            (sum, transaction) =>
                sum + transaction.total,
            0
        );


    const itemCount =
        db.transactions.reduce(
            (sum, transaction) => {

                return sum +
                    transaction.items.reduce(
                        (itemSum, item) =>
                            itemSum + item.qty,
                        0
                    );

            },
            0
        );


    document.getElementById(
        "reportOmzet"
    ).textContent = rupiah(omzet);


    document.getElementById(
        "reportTransaksi"
    ).textContent =
        db.transactions.length;


    document.getElementById(
        "reportItem"
    ).textContent =
        itemCount;


    const container =
        document.getElementById(
            "transactionReport"
        );


    if (!container) return;


    if (db.transactions.length === 0) {

        container.innerHTML =
            "Belum ada transaksi.";

        return;
    }


    container.innerHTML = "";


    db.transactions
        .slice()
        .reverse()
        .forEach(transaction => {

            const div =
                document.createElement("div");

            div.className =
                "transaction-card";

            div.innerHTML = `

                <strong>
                    ${transaction.id}
                </strong>

                <span>
                    ${new Date(
                        transaction.date
                    ).toLocaleString("id-ID")}
                </span>

                <br>

                <span>
                    Total:
                    ${rupiah(transaction.total)}
                </span>

                <br>

                <span>
                    Bayar:
                    ${rupiah(transaction.payment)}
                </span>

                <br>

                <span>
                    Kembali:
                    ${rupiah(transaction.change)}
                </span>

            `;

            container.appendChild(div);

        });
}


/* =====================================================
   EVENT DELEGATION
   ===================================================== */

document.addEventListener(
    "click",
    function(event) {

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


        const removeCartButton =
            event.target.closest(
                "[data-remove-cart]"
            );

        if (removeCartButton) {

            removeFromCart(
                removeCartButton.dataset
                    .removeCart
            );

        }

    }
);

/* =====================================================
   INITIALIZATION
   ===================================================== */

function init() {

    loadDatabase();

    setupNavigation();

    renderDashboard();

    renderProducts();

    renderCashierProducts();

    renderCart();

    renderCustomers();

    renderReports();


    document.getElementById(
        "addCartButton"
    ).addEventListener(
        "click",
        addToCart
    );


    document.getElementById(
        "clearCartButton"
    ).addEventListener(
        "click",
        clearCart
    );


    document.getElementById(
        "cancelTransactionButton"
    ).addEventListener(
        "click",
        cancelTransaction
    );


    document.getElementById(
        "saveTransactionButton"
    ).addEventListener(
        "click",
        saveTransaction
    );


    document.getElementById(
        "paymentAmount"
    ).addEventListener(
        "input",
        updateChange
    );


    document.getElementById(
        "saveProductButton"
    ).addEventListener(
        "click",
        saveProduct
    );


    document.getElementById(
        "cancelProductButton"
    ).addEventListener(
        "click",
        clearProductForm
    );


    document.getElementById(
        "saveCustomerButton"
    ).addEventListener(
        "click",
        saveCustomer
    );


    document.getElementById(
        "cancelCustomerButton"
    ).addEventListener(
        "click",
        clearCustomerForm
    );

}


document.addEventListener(
    "DOMContentLoaded",
    init
);
