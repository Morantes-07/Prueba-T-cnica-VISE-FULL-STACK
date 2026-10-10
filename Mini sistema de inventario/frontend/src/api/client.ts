import axios from 'axios';

export const TOKEN_KEY = 'access_token';

export const api = axios.create({ baseURL: '/api' });

// Adjunta el token a cada petición.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Si el backend responde 401 (token ausente, inválido o vencido), cierra la sesión.
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      if (!isLoginRequest) {
        localStorage.removeItem(TOKEN_KEY);
        if (window.location.pathname !== '/login') {
          window.location.assign('/login');
        }
      }
    }
    return Promise.reject(error);
  },
);