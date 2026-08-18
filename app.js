// =========================================================
// LIZZY'S STORE — lógica de la tienda
// =========================================================

const STOCK_LABELS = {
  disponible: { text: "Disponible", class: "disponible" },
  pedido: { text: "Reponible en 1 semana", class: "pedido" },
  agotado: { text: "Agotado", class: "agotado" },
};

const DEMO_PRODUCTS = [
  { id: "d1", name: "Paleta de sombras Rosé", description: "12 tonos mate y shimmer", price: 450, category: "maquillaje", stock_status: "disponible", emoji: "💄" },
  { id: "d2", name: "Serum de vitamina C", description: "Facial, 30ml", price: 320, category: "facial", stock_status: "disponible", emoji: "🧴" },
  { id: "d3", name: "Plancha para cabello", description: "Cerámica, temperatura ajustable", price: 890, category: "capilar", stock_status: "pedido", emoji: "💇" },
  { id: "d4", name: "Licuadora compacta", description: "600W, 3 velocidades", price: 1250, category: "electrodomesticos", stock_status: "disponible", emoji: "🔌" },
  { id: "d5", name: "Set de brochas (8pz)", description: "Con estuche", price: 380, category: "maquillaje", stock_status: "agotado", emoji: "🖌" },
  { id: "d6", name: "Mascarilla de arcilla", description: "Facial, purificante", price: 210, category: "facial", stock_status: "pedido", emoji: "🧖" },
];

let PRODUCTS = [];
let currentCategory = "todos";
let cart = JSON.parse(localStorage.getItem("lizzys_cart") || "[]");

function saveCart() {
  localStorage.setItem("lizzys_cart", JSON.stringify(cart));
  renderCart();
}

async function loadProducts() {
  if (typeof CONFIGURADO !== "undefined" && CONFIGURADO) {
    try {
      const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      PRODUCTS = data;
    } catch (e) {
      console.error("Error cargando productos de Supabase:", e);
      PRODUCTS = DEMO_PRODUCTS;
      document.getElementById("demoNotice").style.display = "block";
    }
  } else {
    PRODUCTS = DEMO_PRODUCTS;
    document.getElementById("demoNotice").style.display = "block";
  }
  renderProducts();
}

function renderProducts() {
  const grid = document.getElementById("productGrid");
  const list = PRODUCTS.filter(p => currentCategory === "todos" || p.category === currentCategory);
  grid.innerHTML = list.map(p => {
    const stock = STOCK_LABELS[p.stock_status] || STOCK_LABELS.disponible;
    const disabled = p.stock_status === "agotado";
    return `
      <div class="card">
        <span class="badge ${stock.class}">${stock.text}</span>
        <div class="card-img">${p.image_url ? `<img src="${p.image_url}" alt="${p.name}" onerror="this.parentNode.textContent='${p.emoji || "🛍"}'">` : (p.emoji || "🛍")}</div>
        <div class="card-body">
          <div class="card-name">${p.name}</div>
          <div class="card-desc">${p.description || ""}</div>
          <div class="card-price">L ${Number(p.price).toFixed(2)}</div>
          <button class="add-btn" ${disabled ? "disabled" : ""} onclick="addToCart('${p.id}')">
            ${disabled ? "Agotado" : "Agregar al carrito"}
          </button>
        </div>
      </div>`;
  }).join("");
}

function addToCart(id) {
  const product = PRODUCTS.find(p => String(p.id) === String(id));
  if (!product) return;
  const existing = cart.find(i => String(i.id) === String(id));
  if (existing) existing.qty += 1;
  else cart.push({ id: product.id, name: product.name, price: product.price, qty: 1 });
  saveCart();
  openCart();
}

function removeFromCart(id) {
  cart = cart.filter(i => String(i.id) !== String(id));
  saveCart();
}

function renderCart() {
  const itemsEl = document.getElementById("cartItems");
  const totalEl = document.getElementById("cartTotal");
  const countEl = document.getElementById("cartCount");
  if (cart.length === 0) {
    itemsEl.innerHTML = `<p style="color:#999;font-size:.85rem;">Tu carrito está vacío.</p>`;
  } else {
    itemsEl.innerHTML = cart.map(i => `
      <div class="cart-item">
        <span>${i.name} × ${i.qty}</span>
        <span>L ${(i.price * i.qty).toFixed(2)} <a href="#" onclick="removeFromCart('${i.id}');return false;" style="color:#AA4F45;margin-left:6px;">✕</a></span>
      </div>`).join("");
  }
  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  totalEl.textContent = `L ${total.toFixed(2)}`;
  countEl.textContent = cart.reduce((sum, i) => sum + i.qty, 0);
}

function openCart() {
  document.getElementById("cartPanel").classList.add("open");
  document.getElementById("overlay").classList.add("show");
}
function closeCart() {
  document.getElementById("cartPanel").classList.remove("open");
  document.getElementById("overlay").classList.remove("show");
}

async function checkout() {
  if (cart.length === 0) return;
  try {
    const res = await fetch("/.netlify/functions/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: cart }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url; // redirige a Stripe Checkout
    } else {
      alert("No se pudo iniciar el pago. Revisa la configuración de Stripe (ver GUIA.md).");
    }
  } catch (e) {
    alert("Esta función solo funciona una vez publicada la tienda en Netlify con Stripe configurado (ver GUIA.md).");
  }
}

// Eventos
document.getElementById("cartBtn").addEventListener("click", openCart);
document.getElementById("closeCart").addEventListener("click", closeCart);
document.getElementById("overlay").addEventListener("click", closeCart);
document.getElementById("checkoutBtn").addEventListener("click", checkout);
document.getElementById("categoryNav").addEventListener("click", (e) => {
  if (!e.target.classList.contains("cat-pill")) return;
  document.querySelectorAll(".cat-pill").forEach(b => b.classList.remove("active"));
  e.target.classList.add("active");
  currentCategory = e.target.dataset.cat;
  renderProducts();
});
document.getElementById("year").textContent = new Date().getFullYear();

renderCart();
loadProducts();
