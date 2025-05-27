import api from '../api';

const pedidosService = {
  create: async (pedidoData) => {
    const response = await api.post('/client-orders/create/', pedidoData);
    return response.data;
  },
};

export default pedidosService; 