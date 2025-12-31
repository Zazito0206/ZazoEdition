function parsePriceValue(str) {
  if (str == null) return null;
  const s = String(str).trim().toLowerCase();
  if (s.includes('gratis') || s === '$0' || s === '$0.00' || s === '0' || s === '0.00') return 0;
  const num = parseFloat(s.replace(/[^0-9\.,-]/g, '').replace(',', '.'));
  return Number.isNaN(num) ? null : num;
}

function getCart() {
  return JSON.parse(localStorage.getItem('cart') || '[]');
}
function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function computeItemSubtotal(item) {
  const v = parsePriceValue(item.price);
  return (v === null) ? 0 : v * (item.qty || 1);
}

function formatPrice(num) {
  if (num === 0) return 'Gratis';
  return '$' + num.toFixed(2);
}

function isCartAllFree(cart) {
  return cart.length > 0 && cart.every(item => {
    const price = parsePriceValue(item.price);
    return price === 0;
  });
}

function renderCart() {
  const cart = getCart();
  const itemsContainer = document.getElementById('cartItems');
  const summary = document.getElementById('cartSummary');
  const empty = document.getElementById('cartEmpty');

  if (!cart.length) {
    itemsContainer.innerHTML = '';
    summary.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  itemsContainer.innerHTML = cart.map(item => `
    <div class="cart-item" data-id="${item.id}">
      <img src="${item.image}" alt="${item.title}" style="width:100px;height:auto;border-radius:8px;">
      <div style="flex:1;">
        <h3 style="margin:0 0 6px 0;">${item.title}</h3>
        <div style="color:#bdbdbd;margin-bottom:8px;">
          <strong class="current-price">${item.price}</strong>
        </div>

        <div class="qty-controls" style="display:flex;gap:8px;align-items:center;">
          <button class="qty-btn" data-action="dec">−</button>
          <span class="qty">${item.qty}</span>
          <button class="qty-btn" data-action="inc">+</button>
          <button class="remove-btn" style="margin-left:12px;color:#ff6b6b;background:transparent;border:none;cursor:pointer;">Eliminar</button>
        </div>
      </div>
      <div style="min-width:110px;text-align:right;">
        <div style="color:#bdbdbd;font-size:14px;">Subtotal</div>
        <div class="item-subtotal" style="font-weight:800;color:#007bff;">${formatPrice(computeItemSubtotal(item))}</div>
      </div>
    </div>
  `).join('');

  const total = cart.reduce((sum, it) => sum + (computeItemSubtotal(it) || 0), 0);
  const allFree = isCartAllFree(cart);

  if (allFree) {
    summary.innerHTML = `
      <div style="background:#181818;padding:18px;border-radius:12px;display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;">
        <div style="color:#bdbdbd;">
          <div>Total</div>
          <div style="font-weight:800;font-size:20px;color:#fff;">${formatPrice(total)}</div>
        </div>
        <div>
          <button id="downloadBtn" class="btn-primary" aria-label="Descargar ahora" style="display:inline-flex;align-items:center;gap:10px;padding:10px 18px;border-radius:10px;background:#007bff;cursor:pointer;border:none;font-weight:700;color:white;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M12 2v12m0 0l-4-4m4 4l4-4M3 14v4a2 2 0 002 2h14a2 2 0 002-2v-4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Descargar
          </button>
        </div>
      </div>
    `;
  } else {
    summary.innerHTML = `
      <div style="background:#181818;padding:18px;border-radius:12px;display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;">
        <div style="color:#bdbdbd;">
          <div>Total</div>
          <div style="font-weight:800;font-size:20px;color:#fff;">${formatPrice(total)}</div>
        </div>
        <div>
          <button id="checkoutBtn" class="btn-primary paypal-btn" aria-label="Pagar con PayPal" style="display:inline-flex;align-items:center;gap:10px;padding:10px 18px;border-radius:10px;">
            <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect width="48" height="48" rx="8" fill="#003087"/>
              <path d="M16.5 33.5L19.9 14.8h6.7c6.3 0 8.6 0.8 7.9 5.7-0.7 4.9-3 11.9-3.3 13.2-0.3 1.3-1.8 1.8-3.8 1.8h-7.4c-2.5 0-3.5-1-3.5-1.2z" fill="#009cde"/>
              <path d="M17 33.5s0.6 1.5 3.2 1.5h6.1c2.9 0 5-1.1 5.9-3.9 1-3.3 3.2-9.9 3.8-12.1 0.6-2.1-1-2.9-3.9-2.9h-5.4l-7 16.3z" fill="#fff"/>
            </svg>
            Pagar con PayPal
          </button>
        </div>
      </div>
    `;
  }
}

/* Delegación para botones en la página del carrito: cantidades y eliminar */
document.addEventListener('click', (e) => {
  const incBtn = e.target.closest('.qty-btn[data-action="inc"]');
  const decBtn = e.target.closest('.qty-btn[data-action="dec"]');
  const removeBtn = e.target.closest('.remove-btn');

  if (incBtn || decBtn) {
    const itemEl = e.target.closest('.cart-item');
    if (!itemEl) return;
    const id = Number(itemEl.dataset.id);
    const cart = getCart();
    const item = cart.find(i => i.id === id);
    if (!item) return;
    if (incBtn) item.qty = (item.qty || 1) + 1;
    if (decBtn) {
      item.qty = (item.qty || 1) - 1;
      if (item.qty < 1) item.qty = 1;
    }
    saveCart(cart);
    renderCart();
    return;
  }

  if (removeBtn) {
    const itemEl = e.target.closest('.cart-item');
    if (!itemEl) return;
    const id = Number(itemEl.dataset.id);
    let cart = getCart();
    cart = cart.filter(i => i.id !== id);
    saveCart(cart);
    renderCart();
    return;
  }
});

/* Integración PayPal (client-side): crea y envía formulario a PayPal */
function addHiddenInput(form, name, value) {
  const i = document.createElement('input');
  i.type = 'hidden';
  i.name = name;
  i.value = value;
  form.appendChild(i);
}

function checkoutWithPayPal(businessEmail, currency = 'USD') {
  const cart = getCart();
  if (!cart.length) {
    alert('El carrito está vacío.');
    return;
  }

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = 'https://www.paypal.com/cgi-bin/webscr';
  form.style.display = 'none';

  addHiddenInput(form, 'cmd', '_cart');
  addHiddenInput(form, 'upload', '1');
  addHiddenInput(form, 'business', businessEmail);
  addHiddenInput(form, 'currency_code', currency);

  // URLs de retorno (ajusta si tienes páginas específicas)
  addHiddenInput(form, 'return', window.location.origin + '/tienda/carrito.html?status=success');
  addHiddenInput(form, 'cancel_return', window.location.origin + '/tienda/carrito.html?status=cancel');

  let idx = 1;
  cart.forEach(item => {
    const raw = String(item.price || '').trim().toLowerCase();
    let amount = null;
    if (raw.includes('gratis') || raw === '$0' || raw === '0' || raw === '0.00') amount = 0;
    else {
      const num = parseFloat(raw.replace(/[^0-9\.,-]/g, '').replace(',', '.'));
      amount = Number.isNaN(num) ? 0 : num;
    }
    if (amount === null) amount = 0;

    addHiddenInput(form, `item_name_${idx}`, item.title || `Item ${idx}`);
    addHiddenInput(form, `amount_${idx}`, amount.toFixed(2));
    addHiddenInput(form, `quantity_${idx}`, item.qty || 1);
    idx++;
  });

  document.body.appendChild(form);
  form.submit();
}

/* Función para descargar archivos */
function downloadFile(url, filename) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || url.split('/').pop();
  link.setAttribute('target', '_blank');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/* Función para descargar todos los productos gratis */
function downloadFreeProducts() {
  const cart = getCart();
  if (!cart.length) {
    alert('El carrito está vacío.');
    return;
  }

  let descargas = 0;

  // Descargar cada producto gratis
  cart.forEach(item => {
    const price = parsePriceValue(item.price);
    if (price === 0 && item.downloadUrl) {
      downloadFile(item.downloadUrl, item.title + '.zip');
      descargas++;
    }
  });

  if (descargas === 0) {
    alert('No hay productos para descargar.');
    return;
  }

  // Mostrar mensaje y limpiar carrito
  alert('¡Tus ' + descargas + ' descarga(s) han iniciado! El carrito se vaciará.');
  setTimeout(() => {
    localStorage.removeItem('cart');
    renderCart();
    location.reload();
  }, 1000);
}

/* Listener para el botón de descarga */
document.addEventListener('click', (e) => {
  const downloadBtn = e.target.closest('#downloadBtn');
  if (!downloadBtn) return;
  e.preventDefault();
  downloadFreeProducts();
});

/* Listener específico para el botón de checkout */
document.addEventListener('click', (e) => {
  const checkoutBtn = e.target.closest('#checkoutBtn');
  if (!checkoutBtn) return;
  e.preventDefault();
  checkoutWithPayPal('amilcaraquino12345@gmail.com', 'USD');
});

/* Inicialización y bindings */
document.addEventListener('DOMContentLoaded', () => {
  renderCart();
});