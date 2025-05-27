import api from './api';

const pedidosRestauranteService = {
  getAll: async () => {
    try {
      const response = await api.get('/orders/');
      console.log('Resposta bruta da API:', response.data); // Log detalhado
      return response.data;
    } catch (error) {
      console.error('Erro no serviço getAll:', error);
      throw error;
    }
  },

  getById: (id) => api.get(`/orders/${id}/`),
  update: (id, data) => api.put(`/orders/${id}/`, data),
  delete: (id) => api.delete(`/orders/${id}/`),

  updateStatus: async (pedidoId, status) => {
    try {
      const response = await api.post(`/orders/${pedidoId}/update-status/`, { status });
      console.log('Resposta do updateStatus:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erro no serviço updateStatus:', error);
      throw error;
    }
  },
};

export default pedidosRestauranteService; 