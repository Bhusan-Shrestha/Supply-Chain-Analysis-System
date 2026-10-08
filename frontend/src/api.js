const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  pendingUsers: (token) => request('/auth/pending-users', { token }),
  setUserStatus: (token, id, status) => request(`/auth/users/${id}/status`, { method: 'PATCH', body: { status }, token }),

  getProducts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/products${qs ? `?${qs}` : ''}`);
  },
  getTraceability: (id) => request(`/products/${id}/traceability`),
  createProduct: (token, payload) => request('/products', { method: 'POST', body: payload, token }),
  updateProduct: (token, id, payload) => request(`/products/${id}`, { method: 'PUT', body: payload, token }),
  deleteProduct: (token, id) => request(`/products/${id}`, { method: 'DELETE', token }),
  getCategories: () => request('/products/categories/all'),
  createCategory: (token, name) => request('/products/categories', { method: 'POST', body: { name }, token }),

  placeOrder: (token, payload) => request('/orders', { method: 'POST', body: payload, token }),
  updateOrderStatus: (token, id, status, remarks) => request(`/orders/${id}/status`, { method: 'PATCH', body: { status, remarks }, token }),
  myOrders: (token) => request('/orders/mine', { token }),
  incomingOrders: (token) => request('/orders/incoming', { token }),
  orderTracking: (token, id) => request(`/orders/${id}/tracking`, { token }),

  myInventory: (token) => request('/inventory/mine', { token }),
  lowStock: (token) => request('/inventory/low-stock', { token }),
  sellableBy: (role) => request(`/inventory/sellable/${role}`),

  dashboardSummary: (token) => request('/dashboard/summary', { token })
};
