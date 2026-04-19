// --- State ---
const state = {
  menu: [
    { id: 1, name: "Fries", price: 140, category: "snacks", icon: "🍟" },
    { id: 2, name: "Noodles", price: 90, category: "main", icon: "🍜" },
    { id: 3, name: "Soup", price: 140, category: "snacks", icon: "🥣" },
    { id: 4, name: "Burger", price: 260, category: "snacks", icon: "🍔" },
    { id: 5, name: "Sandwich", price: 300, category: "snacks", icon: "🥪" },
    { id: 6, name: "Drinks", price: 65, category: "beverages", icon: "🥤" },
    { id: 7, name: "Pizza", price: 450, category: "main", icon: "🍕" },
    { id: 8, name: "Coffee", price: 120, category: "beverages", icon: "☕" }
  ],
  cart: [],
  orders: JSON.parse(localStorage.getItem('ankush_orders')) || [],
  currentCategory: 'all',
  taxRate: 0.05
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  startClock();
  initNavigation();
  renderMenu();
  renderOrders();
  updateDashboard();
  generateNewReference();
});

// --- Time Widget ---
function startClock() {
  const timeEl = document.getElementById('currentTime');
  setInterval(() => {
    const now = new Date();
    timeEl.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }, 1000);
}

// --- Navigation ---
const viewTitles = {
  'dashboard': { title: 'Dashboard', sub: 'Overview of your restaurant' },
  'pos': { title: 'Point of Sale', sub: 'Manage orders and billing' },
  'orders': { title: 'Order History', sub: 'View past transactions' },
  'menu': { title: 'Menu Management', sub: 'Add or edit items' }
};

function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      // Update active state
      navItems.forEach(nav => nav.classList.remove('active'));
      e.currentTarget.classList.add('active');

      // Switch view
      const viewId = e.currentTarget.getAttribute('data-view');
      document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
      document.getElementById(`view-${viewId}`).classList.add('active');

      // Update Header
      document.getElementById('page-title-text').textContent = viewTitles[viewId].title;
      document.getElementById('page-subtitle-text').textContent = viewTitles[viewId].sub;
      
      if(viewId === 'dashboard') updateDashboard();
    });
  });

  // Category filters
  const catBtns = document.querySelectorAll('.cat-btn');
  catBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      catBtns.forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      state.currentCategory = e.currentTarget.getAttribute('data-cat');
      renderMenu();
    });
  });
}

// --- POS Logic ---
function renderMenu() {
  const grid = document.getElementById('pos-menu-grid');
  grid.innerHTML = '';
  
  const filtered = state.currentCategory === 'all' 
    ? state.menu 
    : state.menu.filter(item => item.category === state.currentCategory);

  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = 'menu-item-card';
    card.onclick = () => addToCart(item);
    card.innerHTML = `
      <div class="item-icon">${item.icon}</div>
      <div class="item-info">
        <h4>${item.name}</h4>
        <span class="price">₹${item.price.toFixed(2)}</span>
      </div>
    `;
    grid.appendChild(card);
  });
}

function addToCart(item) {
  const existing = state.cart.find(c => c.id === item.id);
  if (existing) {
    existing.qty += 1;
  } else {
    state.cart.push({ ...item, qty: 1 });
  }
  renderCart();
}

function updateQty(id, delta) {
  const item = state.cart.find(c => c.id === id);
  if (item) {
    item.qty += delta;
    if (item.qty <= 0) {
      state.cart = state.cart.filter(c => c.id !== id);
    }
  }
  renderCart();
}

function renderCart() {
  const cartContainer = document.getElementById('cart-items');
  
  if (state.cart.length === 0) {
    cartContainer.innerHTML = `
      <div class="cart-empty">
        <i class="fa-solid fa-basket-shopping"></i>
        <p>Cart is empty</p>
      </div>`;
  } else {
    cartContainer.innerHTML = '';
    state.cart.forEach(item => {
      const el = document.createElement('div');
      el.className = 'cart-item';
      el.innerHTML = `
        <div class="cart-item-info">
          <span class="cart-item-name">${item.name}</span>
          <span class="cart-item-price">₹${item.price.toFixed(2)}</span>
        </div>
        <div class="cart-item-controls">
          <button class="qty-btn" onclick="updateQty(${item.id}, -1)">-</button>
          <span class="qty-value">${item.qty}</span>
          <button class="qty-btn" onclick="updateQty(${item.id}, 1)">+</button>
        </div>
      `;
      cartContainer.appendChild(el);
    });
  }
  updateCartTotals();
}

function updateCartTotals() {
  const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const tax = subtotal * state.taxRate;
  const total = subtotal + tax;

  document.getElementById('cart-subtotal').textContent = `₹${subtotal.toFixed(2)}`;
  document.getElementById('cart-tax').textContent = `₹${tax.toFixed(2)}`;
  document.getElementById('cart-total').textContent = `₹${total.toFixed(2)}`;
}

function generateNewReference() {
  const ref = Math.floor(Math.random() * 90000) + 10000;
  document.getElementById('ref-number').textContent = ref;
  return ref;
}

function processCheckout() {
  if (state.cart.length === 0) {
    showToast('Cart is empty!', 'error');
    return;
  }

  const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const total = subtotal + (subtotal * state.taxRate);
  
  const order = {
    ref: document.getElementById('ref-number').textContent,
    date: new Date().toLocaleString(),
    items: [...state.cart],
    total: total,
    totalItems: state.cart.reduce((sum, i) => sum + i.qty, 0)
  };

  state.orders.unshift(order);
  localStorage.setItem('ankush_orders', JSON.stringify(state.orders));
  
  // Reset
  state.cart = [];
  renderCart();
  generateNewReference();
  renderOrders();
  updateDashboard();
  
  showToast('Order completed successfully!', 'success');
}

// --- Orders View ---
function renderOrders() {
  const tbody = document.getElementById('orders-table-body');
  tbody.innerHTML = '';
  
  if(state.orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No orders yet.</td></tr>';
    return;
  }

  state.orders.forEach(order => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>#${order.ref}</td>
      <td>${order.date}</td>
      <td>${order.totalItems} items</td>
      <td style="font-weight:700; color:var(--primary);">₹${order.total.toFixed(2)}</td>
      <td><span class="status-badge completed">Completed</span></td>
    `;
    tbody.appendChild(tr);
  });
}

// --- Dashboard ---
function updateDashboard() {
  const totalSales = state.orders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = state.orders.length;
  const totalItems = state.orders.reduce((sum, o) => sum + o.totalItems, 0);

  document.getElementById('dash-sales').textContent = `₹${totalSales.toFixed(2)}`;
  document.getElementById('dash-orders').textContent = totalOrders;
  document.getElementById('dash-items').textContent = totalItems;
}

// --- Utils ---
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="${type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-exclamation'}"></i>
    <div class="toast-content">
      <h4>${type === 'success' ? 'Success' : 'Error'}</h4>
      <p>${message}</p>
    </div>
  `;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
