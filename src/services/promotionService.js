import api from './api';

const promotionService = {
  // Listar todas as promoções ativas
  listPromotions: async (showInactive = false) => {
    const response = await api.get(`products/promotions/${showInactive ? '?show_inactive=true' : ''}`);
    return response.data;
  },

  // Buscar uma promoção específica
  getPromotion: async (id) => {
    const response = await api.get(`products/promotions/${id}/`);
    return response.data;
  },

  // Criar uma nova promoção
  createPromotion: async (promotionData) => {
    // Se tiver imagem, usa multipart/form-data
    if (promotionData instanceof FormData) {
      const response = await api.post('products/promotions/', promotionData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    }
    // Se não tiver imagem, usa JSON normal
    const response = await api.post('products/promotions/', promotionData);
    return response.data;
  },

  // Atualizar uma promoção
  updatePromotion: async (id, promotionData) => {
    // Se tiver imagem, usa multipart/form-data
    if (promotionData instanceof FormData) {
      const response = await api.put(`products/promotions/${id}/`, promotionData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    }
    // Se não tiver imagem, usa JSON normal
    const response = await api.put(`products/promotions/${id}/`, promotionData);
    return response.data;
  },

  // Ativar/Desativar uma promoção
  togglePromotionActive: async (id) => {
    const response = await api.post(`products/promotions/${id}/toggle_active/`);
    return response.data;
  },

  // Excluir uma promoção
  deletePromotion: async (id) => {
    await api.delete(`products/promotions/${id}/`);
  }
};

export default promotionService; 