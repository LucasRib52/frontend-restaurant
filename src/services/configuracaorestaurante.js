import api from './api';

const configuracaoRestauranteService = {
  get: () => api.get('/settings/me/'),
  update: (data, isFormData = false) => {
    const config = {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
    };
    return api.put('/settings/me/', data, config);
  },
};

export default configuracaoRestauranteService; 