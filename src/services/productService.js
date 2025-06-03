import api from './api';

const productService = {
  // Listar todos os produtos
  listProducts: async () => {
    const response = await api.get('products/products/');
    return response.data;
  },

  // Buscar um produto específico
  getProduct: async (id) => {
    const response = await api.get(`products/products/${id}/`);
    return response.data;
  },

  // Criar um novo produto
  createProduct: async (productData) => {
    const response = await api.post('products/products/', productData);
    return response.data;
  },

  // Atualizar um produto
  updateProduct: async (id, productData) => {
    const response = await api.put(`products/products/${id}/`, productData);
    return response.data;
  },

  // Excluir um produto
  deleteProduct: async (id) => {
    await api.delete(`products/products/${id}/`);
  },

  // Listar produtos por categoria
  listProductsByCategory: async (categoryId) => {
    const response = await api.get(`products/products/?category=${categoryId}`);
    return response.data;
  },

  // Atualizar imagem do produto
  updateProductImage: async (id, imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await api.patch(`products/products/${id}/update_image/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Ativar/Desativar um produto
  toggleProductActive: async (id) => {
    const response = await api.post(`products/products/${id}/toggle_active/`);
    return response.data;
  }
};

export default productService; 