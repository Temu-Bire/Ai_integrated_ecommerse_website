/**
 * Centralized API Client for NovaMart AI E-Commerce Platform.
 * Connects to FastAPI Backend (/api/v1).
 */

const API_BASE = '/api/v1';

// Session token generator for anonymous guests
function getSessionToken() {
  let token = localStorage.getItem('novamart_guest_session');
  if (!token) {
    token = 'guest_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('novamart_guest_session', token);
  }
  return token;
}

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const sessionToken = getSessionToken();

  const headers = {
    'Content-Type': 'application/json',
    'X-Session-Token': sessionToken,
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || (data.details && data.details[0] && data.details[0].message) || 'Request failed';
    const error = new Error(errorMsg);
    error.status = response.status;
    error.code = data.code;
    error.details = data.details;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),

  // Categories
  getCategories: (tree = true) => request(`/categories?tree=${tree}`),
  getCategory: (slug) => request(`/categories/${slug}`),

  // Products
  getProducts: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.append(k, v);
    });
    return request(`/products?${query.toString()}`);
  },
  getProduct: (idOrSlug) => request(`/products/${idOrSlug}`),
  getProductVariants: (id) => request(`/products/${id}/variants`),

  // Search
  search: (q, params = {}) => {
    const query = new URLSearchParams({ q, ...params });
    return request(`/search?${query.toString()}`);
  },
  autocomplete: (q) => request(`/search/autocomplete?q=${encodeURIComponent(q)}`),

  // Cart
  getCart: () => request('/cart'),
  addToCart: (variant_id, quantity = 1) =>
    request('/cart/items', { method: 'POST', body: JSON.stringify({ variant_id, quantity }) }),
  updateCartItem: (itemId, quantity) =>
    request(`/cart/items/${itemId}`, { method: 'PATCH', body: JSON.stringify({ quantity }) }),
  removeFromCart: (itemId) => request(`/cart/items/${itemId}`, { method: 'DELETE' }),
  mergeCart: () => request('/cart/merge', { method: 'POST', body: JSON.stringify({ session_token: getSessionToken() }) }),
  clearCart: () => request('/cart', { method: 'DELETE' }),

  // Checkout & Orders
  calculateCheckout: (items) =>
    request('/checkout/calculate', { method: 'POST', body: JSON.stringify({ items }) }),
  createPaymentIntent: (idempotency_key) =>
    request('/checkout/create-intent', { method: 'POST', body: JSON.stringify({ idempotency_key }) }),
  submitOrder: (orderData) =>
    request('/orders', { method: 'POST', body: JSON.stringify(orderData) }),
  getMyOrders: (params = {}) => {
    const query = new URLSearchParams(params);
    return request(`/orders?${query.toString()}`);
  },
  getOrder: (id) => request(`/orders/${id}`),
  cancelOrder: (id) => request(`/orders/${id}/cancel`, { method: 'POST' }),

  // Admin
  adminCreateProduct: (body) => request('/admin/products', { method: 'POST', body: JSON.stringify(body) }),
  adminUpdateProduct: (id, body) => request(`/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  adminDeleteProduct: (id) => request(`/admin/products/${id}`, { method: 'DELETE' }),
  adminUpdateInventory: (variantId, quantity) =>
    request(`/admin/inventory/${variantId}`, { method: 'PATCH', body: JSON.stringify({ quantity }) }),
  adminGetAnalyticsOverview: () => request('/admin/analytics/overview'),
  adminGetTopProducts: (limit = 5) => request(`/admin/analytics/top-products?limit=${limit}`),
  adminGetSalesChart: () => request('/admin/analytics/sales-chart'),
  adminGetOrders: (status) => request(`/admin/orders${status ? `?status=${status}` : ''}`),
  adminUpdateOrderStatus: (orderId, body) =>
    request(`/admin/orders/${orderId}/status`, { method: 'PATCH', body: JSON.stringify(body) }),
  adminGenerateAIDescription: (body) =>
    request('/admin/ai/generate-description', { method: 'POST', body: JSON.stringify(body) }),
};
