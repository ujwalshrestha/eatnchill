const API_BASE = '/api';

async function request(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

export const api = {
  // Categories
  getCategories: () => request('/categories'),
  getCategory: (id) => request(`/categories/${id}`),
  createCategory: (body) => request('/categories', { method: 'POST', body: JSON.stringify(body) }),
  updateCategory: (id, body) => request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),

  // Food Items
  getFoodItems: (params = '') => request(`/food-items${params ? '?' + params : ''}`),
  getFoodItem: (id) => request(`/food-items/${id}`),
  createFoodItem: (body) => request('/food-items', { method: 'POST', body: JSON.stringify(body) }),
  updateFoodItem: (id, body) => request(`/food-items/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteFoodItem: (id) => request(`/food-items/${id}`, { method: 'DELETE' }),

  // Tables
  getTables: () => request('/tables'),
  getTable: (id) => request(`/tables/${id}`),
  createTable: (body) => request('/tables', { method: 'POST', body: JSON.stringify(body) }),
  updateTable: (id, body) => request(`/tables/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteTable: (id) => request(`/tables/${id}`, { method: 'DELETE' }),
  getTableQR: (id) => request(`/tables/${id}/qr`),
  getAllQR: () => request('/tables/qr/all'),
  startTableSession: (id) => request(`/tables/${id}/session`, { method: 'POST' }),
  resetTableSession: (id) => request(`/tables/${id}/session/reset`, { method: 'POST' }),
  getSessionTimeoutSettings: () => request('/tables/settings/session-timeout'),
  updateSessionTimeoutSettings: (session_timeout_minutes) => request('/tables/settings/session-timeout', {
    method: 'PUT',
    body: JSON.stringify({ session_timeout_minutes })
  }),

  // Orders
  getOrders: (params = '') => request(`/orders${params ? '?' + params : ''}`),
  getOrder: (id) => request(`/orders/${id}`),
  createOrder: (body) => request('/orders', { method: 'POST', body: JSON.stringify(body) }),
  updateOrderStatus: (id, status) => request(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // Transactions
  getDailyTransactions: (date) => request(`/transactions/daily${date ? '?date=' + date : ''}`),
  getDailyTransactionsSummary: (date) => request(`/transactions/daily/summary${date ? '?date=' + date : ''}`),
};
