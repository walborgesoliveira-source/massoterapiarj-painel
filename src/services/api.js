import axios from 'axios';

const api = axios.create({ baseURL: '/painel/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mrj_painel_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('mrj_painel_token');
      localStorage.removeItem('mrj_painel_usuario');
      window.location.href = '/painel/login';
    }
    return Promise.reject(error);
  }
);

export default api;
