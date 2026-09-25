import { api } from './api';
import { ApiResponse, AuthResponse, SystemUser } from '@/types';

export const authService = {
  login: async (credentials: Record<string, string>): Promise<AuthResponse> => {
    const { data } = await api.post('/api/auth/login', credentials);
    return data.data;
  },
  verifyGoogleCredential: async (credential: string): Promise<AuthResponse> => {
    const { data } = await api.post('/api/auth/google/verify', { credential });
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
  setUserActive: async (userId: string, isActive: boolean): Promise<ApiResponse<SystemUser>> => {
    const { data } = await api.patch(`/api/admin/users/${encodeURIComponent(userId)}/status`, { isActive });
    return data;
  },
  deleteUser: async ({ userId, credentials }: { userId: string; credentials: { email: string; password: string } }): Promise<ApiResponse<boolean>> => {
    const { data } = await api.post(`/api/admin/users/${encodeURIComponent(userId)}/delete`, credentials);
    return data;
  },
  uploadUserProfileImage: async (userId: string, image: File): Promise<ApiResponse<SystemUser>> => {
    const form = new FormData();
    form.append('image', image);
    const { data } = await api.post(`/api/admin/users/${encodeURIComponent(userId)}/profile-image`, form);
    return data;
  },
  uploadMyProfileImage: async (image: File): Promise<ApiResponse<SystemUser>> => {
    const form = new FormData();
    form.append('image', image);
    const { data } = await api.post('/api/auth/profile-image', form);
    return data;
  },
};
