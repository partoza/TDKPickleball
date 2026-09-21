import axios from 'axios';

const defaultApiUrl = typeof window !== 'undefined' 
  ? `http://${window.location.hostname}:5000` 
  : 'http://localhost:5000';

export const api = axios.create({
  baseURL: (import.meta as any).env.VITE_API_URL || defaultApiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function getApiErrorMessage(error: any, fallback = 'The request could not be completed') {
  const payload = error?.response?.data;
  if (typeof payload?.message === 'string' && payload.message.trim()) return payload.message;
  if (Array.isArray(payload?.errors) && payload.errors.length) return String(payload.errors[0]);
  if (payload?.errors && typeof payload.errors === 'object') {
    const first = Object.values(payload.errors).flat().find(Boolean);
    if (first) return String(first);
  }
  return error?.message || fallback;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Redirect to login handled by AuthContext
    }
    return Promise.reject(error);
  }
);
