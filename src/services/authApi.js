import axios from 'axios';

const authApi = axios.create({
  baseURL: 'http://192.168.1.65:8000',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

export default authApi; 