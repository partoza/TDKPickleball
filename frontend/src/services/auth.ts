import { api } from './api';
import { ApiResponse, AuthResponse, SystemUser } from '@/types';

export const authService = {
  login: async (credentials: Record<string, string>): Promise<AuthResponse> => {
    const { data } = await api.post('/api/auth/login', credentials);
    return data.data;
  },
  getGoogleLoginUrl: () => `${api.defaults.baseURL}/api/auth/google/start`,
  exchangeGoogleCode: async (code: string): Promise<AuthResponse> => {
    const { data } = await api.post('/api/auth/google/exchange', { code });
    return data.data;
  },
  getMe: async (): Promise<AuthResponse> => {
    const { data } = await api.get('/api/auth/me');
    return data.data;
  },
  changePassword: async (payload: { currentPassword?: string; newPassword: string; confirmPassword: string }): Promise<ApiResponse<boolean>> => {
    const { data } = await api.post('/api/auth/change-password', payload);
    return data;
  },
  getUsers: async (): Promise<ApiResponse<SystemUser[]>> => {
    const { data } = await api.get('/api/admin/users');
    return data;
  },
  createUser: async (payload: { email: string; firstName: string; lastName: string; role: string }): Promise<ApiResponse<SystemUser>> => {
    const { data } = await api.post('/api/admin/users', payload);
    return data;
  },
};
