import api from './api';

const produtosRestauranteService = {
  getAll: () => api.get('/products/products/'),
  getById: (id) => api.get(`/products/products/${id}/`),
  create: (data, isFormData = false) =>
    api.post('/products/products/', data, isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {}),
  update: (id, data, isFormData = false) =>
    api.put(`/products/products/${id}/`, data, isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {}),
  delete: (id) => api.delete(`/products/products/${id}/`),
};

export default produtosRestauranteService; 