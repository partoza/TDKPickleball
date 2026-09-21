import { api } from './api';
import { Court, ApiResponse } from '@/types';

export const courtsService = {
  getCourts: async (): Promise<ApiResponse<Court[]>> => {
    const { data } = await api.get('/api/courts');
    return data;
  },
  getCourt: async (id: number): Promise<ApiResponse<Court>> => {
    const { data } = await api.get(`/api/courts/${id}`);
    return data;
  },
  createCourt: async (court: Partial<Court>): Promise<ApiResponse<Court>> => {
    const { data } = await api.post('/api/admin/courts', court);
    return data;
  },
  updateCourt: async (id: number, court: Partial<Court>): Promise<ApiResponse<Court>> => {
    const { data } = await api.put(`/api/admin/courts/${id}`, court);
    return data;
  },
  deleteCourt: async (id: number): Promise<ApiResponse<void>> => {
    const { data } = await api.delete(`/api/admin/courts/${id}`);
    return data;
  },
};
