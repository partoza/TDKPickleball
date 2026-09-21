import { api } from './api';
import { Rate, ApiResponse } from '@/types';

export const ratesService = {
  getRates: async (): Promise<ApiResponse<Rate[]>> => {
    const { data } = await api.get('/api/rates');
    return data;
  },
  createRate: async (rate: Partial<Rate>): Promise<ApiResponse<Rate>> => {
    const { data } = await api.post('/api/admin/rates', rate);
    return data;
  },
  updateRate: async (id: number, rate: Partial<Rate>): Promise<ApiResponse<Rate>> => {
    const { data } = await api.put(`/api/admin/rates/${id}`, rate);
    return data;
  },
  deleteRate: async (id: number): Promise<ApiResponse<void>> => {
    const { data } = await api.delete(`/api/admin/rates/${id}`);
    return data;
  },
};
