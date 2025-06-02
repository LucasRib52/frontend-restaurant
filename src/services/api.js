import axios from 'axios';

const api = axios.create({
  baseURL: 'https://restaurantesystem.pythonanywhere.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Serviços do Dashboard
export const dashboardService = {
  getSummary: () => api.get('/dashboard/summary/'),
  getDailyStats: (days = 7) => api.get(`/dashboard/daily_stats/?days=${days}`),
  getProductStats: (days = 30) => api.get(`/dashboard/product_stats/?days=${days}`),
  getCategoryStats: (days = 30) => api.get(`/dashboard/category_stats/?days=${days}`),
};

// Serviços de Pedidos
export const orderService = {
  getOrders: () => api.get('/orders/'),
  getOrder: (id) => api.get(`/orders/${id}/`),
  updateOrderStatus: (id, status) => api.patch(`/orders/${id}/`, { status }),
};

// Serviços de Produtos
export const productService = {
  getProducts: () => api.get('/products/'),
  getProduct: (id) => api.get(`/products/${id}/`),
  createProduct: (data) => api.post('/products/', data),
  updateProduct: (id, data) => api.put(`/products/${id}/`, data),
  deleteProduct: (id) => api.delete(`/products/${id}/`),
};

// Serviços de Categorias
export const categoryService = {
  getCategories: () => api.get('/categories/'),
  getCategory: (id) => api.get(`/categories/${id}/`),
  createCategory: (data) => api.post('/categories/', data),
  updateCategory: (id, data) => api.put(`/categories/${id}/`, data),
  deleteCategory: (id) => api.delete(`/categories/${id}/`),
};

// Serviços de Clientes
export const customerService = {
  getCustomers: () => api.get('/customers/'),
  getCustomer: (id) => api.get(`/customers/${id}/`),
  createCustomer: (data) => api.post('/customers/', data),
  updateCustomer: (id, data) => api.put(`/customers/${id}/`, data),
  deleteCustomer: (id) => api.delete(`/customers/${id}/`),
};

export default api; 