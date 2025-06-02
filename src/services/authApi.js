import axios from 'axios';

const authApi = axios.create({
  baseURL: 'https://restaurantesystem.pythonanywhere.com',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

export default authApi; 