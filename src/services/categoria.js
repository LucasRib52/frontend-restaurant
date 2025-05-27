import api from './api';

const categoriaService = {
  // Listar todas as categorias
  getAll: () => api.get('/products/categories/'),
  
  // Buscar uma categoria específica
  getById: (id) => api.get(`/products/categories/${id}/`),
  
  // Criar uma nova categoria
  create: (data) => api.post('/products/categories/', data),
  
  // Atualizar uma categoria existente
  update: (id, data) => api.put(`/products/categories/${id}/`, data),
  
  // Deletar uma categoria
  delete: (id) => api.delete(`/products/categories/${id}/`),
  
  // Buscar produtos de uma categoria
  getProducts: (id) => api.get(`/products/categories/${id}/products/`),
};

export default categoriaService; 