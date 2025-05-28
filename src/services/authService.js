import authApi from './authApi';
import api from './api';

const authService = {
  login: async (username, password) => {
    try {
      const response = await authApi.post('/api/token/', {
        username,
        password,
      });
      
      if (response.data.access) {
        localStorage.setItem('token', response.data.access);
        localStorage.setItem('refreshToken', response.data.refresh);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Configura o token no header do api para futuras requisições
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    // Força o redirecionamento para a página de login
    window.location.replace('/login');
  },

  getToken: () => {
    return localStorage.getItem('token');
  },

  getRefreshToken: () => {
    return localStorage.getItem('refreshToken');
  },

  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  verifyToken: async () => {
    try {
      const response = await authApi.get('/api/verify-token/');
      return response.status === 200;
    } catch (error) {
      console.error('Erro na verificação do token:', error);
      return false;
    }
  }
};

// Configura o interceptor para adicionar o token em todas as requisições
api.interceptors.request.use((config) => {
  const token = authService.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Configura o interceptor para tratar erros de token expirado
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Se o erro for 401, faz logout imediatamente
    if (error.response?.status === 401) {
      authService.logout();
    }
    return Promise.reject(error);
  }
);

export default authService; 