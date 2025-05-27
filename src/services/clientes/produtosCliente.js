import api from '../api';

export const produtosClienteService = {
  // Buscar todas as categorias
  getCategorias: () => api.get('/clientes/categories/'),
  
  // Buscar todos os produtos
  getProdutos: () => api.get('/clientes/products/'),
  
  // Buscar produtos por categoria
  getProdutosPorCategoria: (categoriaId) => 
    api.get(`/clientes/products/?category=${categoriaId}`),
    
  // Buscar detalhes de um produto específico
  getProduto: (id) => api.get(`/clientes/products/${id}/`),
}; 