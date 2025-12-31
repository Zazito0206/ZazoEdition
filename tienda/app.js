const grid = document.getElementById("productsGrid");
const results = document.getElementById("resultsCount");
const categoryList = document.getElementById("categoryList");
const searchInput = document.getElementById("searchInput");

let products = [];

fetch("products.json")
  .then(res => res.json())
  .then(data => {
    products = data;
    renderProducts(products);
    renderCategories(products);
    updateCartCount();
  })
  .catch(err => {
    console.error("Error cargando productos:", err);
    results.textContent = "Error cargando productos";
  });

function parsePriceValue(str) {
  if (str == null) return null;
  const s = String(str).trim().toLowerCase();
  if (s.includes('gratis') || s === '$0' || s === '$0.00' || s === '0' || s === '0.00') return 0;
  const num = parseFloat(s.replace(/[^0-9\.,-]/g, '').replace(',', '.'));
  return Number.isNaN(num) ? null : num;
}

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const total = cart.reduce((s, i) => s + (i.qty || 1), 0);
  const el = document.getElementById('cartCount');
  if (!el) return;
  el.textContent = total;
  if (total === 0) el.classList.add('zero'); else el.classList.remove('zero');
}

function renderProducts(list) {
  grid.innerHTML = "";
  results.textContent = `Mostrando ${list.length} productos`;

  list.forEach(p => {
    const origVal = parsePriceValue(p.originalPrice);
    const priceVal = parsePriceValue(p.price);

    const showOriginal = p.originalPrice && (
      (origVal !== null && priceVal !== null && origVal > priceVal) ||
      (origVal === null || priceVal === null) && p.originalPrice !== p.price
    );

    const btnClass = p.soldOut ? 'btn-secondary' : 'btn-primary';
    const btnText = p.soldOut ? 'Leer más' : 'Añadir al carrito';

    grid.innerHTML += `
      <div class="product-card">
        <div class="product-img">
          ${p.soldOut ? `<span class="sold-out">AGOTADO</span>` : ""}
          <img src="${p.image}" alt="${p.title}">
        </div>

        <p class="category">${p.category}</p>
        <h2>${p.title}</h2>

        <div class="price">
          ${showOriginal ? `<span class="original-price">${p.originalPrice}</span>` : ""}
          <strong class="current-price">${p.price}</strong>
        </div>

        <div class="product-actions">
          <button class="${btnClass}" data-id="${p.id}">${btnText}</button>
        </div>
      </div>
    `;
  });
}

/* Delegación para botones dentro del grid */
document.getElementById('productsGrid').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-id]');
  if (!btn) return;
  const id = Number(btn.dataset.id);
  if (btn.classList.contains('btn-primary')) addToCart(id);
  else if (btn.classList.contains('btn-secondary')) {
    alert('Página de producto no implementada.');
  }
});

function addToCart(id) {
  const prod = products.find(p => p.id === id);
  if (!prod) return;
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const item = cart.find(i => i.id === id);
  if (item) item.qty++;
  else cart.push({ 
    id: prod.id, 
    title: prod.title, 
    price: prod.price, 
    image: prod.image, 
    downloadUrl: prod.downloadUrl,
    qty: 1 
  });
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  alert(`Añadido "${prod.title}" al carrito`);
}

function renderCategories(data) {
  // Cuenta productos por categoría
  const counts = data.reduce((acc, p) => {
    const cat = p.category || 'Sin categoría';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const cats = ["Todos", ...Object.keys(counts)];
  const total = data.length;

  categoryList.innerHTML = cats.map(cat => {
    const n = cat === "Todos" ? total : (counts[cat] || 0);
    return `<li onclick="filterCategory('${cat}')">
              <span class="cat-name">${cat}</span>
              <span class="cat-count">${n}</span>
            </li>`;
  }).join("");
}

function filterCategory(cat) {
  if (cat === "Todos") renderProducts(products);
  else renderProducts(products.filter(p => p.category === cat));
}

searchInput.addEventListener("input", e => {
  const value = e.target.value.toLowerCase();
  renderProducts(products.filter(p =>
    p.title.toLowerCase().includes(value)
  ));
});

/* Sincronizar contador entre pestañas */
window.addEventListener('storage', (e) => {
  if (e.key === 'cart') updateCartCount();
});