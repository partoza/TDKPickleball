import { api } from './api';
import { Rate, ApiResponse } from '@/types';
import { withSeconds } from '@/lib/time-range';

const normalizeRateTimes = (rate: Partial<Rate>) => ({
  ...rate,
  ...(rate.startTime ? { startTime: withSeconds(rate.startTime) } : {}),
  ...(rate.endTime ? { endTime: withSeconds(rate.endTime) } : {}),
});

export const ratesService = {
  getRates: async (): Promise<ApiResponse<Rate[]>> => {
    const { data } = await api.get('/api/rates');
    return data;
  },
  createRate: async (rate: Partial<Rate>): Promise<ApiResponse<Rate>> => {
    const { data } = await api.post('/api/admin/rates', normalizeRateTimes(rate));
    return data;
  },
  updateRate: async (id: number, rate: Partial<Rate>): Promise<ApiResponse<Rate>> => {
    const { data } = await api.put(`/api/admin/rates/${id}`, normalizeRateTimes(rate));
    return data;
  },
  deleteRate: async ({ id, credentials }: { id: number; credentials: { email: string; password: string } }): Promise<ApiResponse<void>> => {
    const { data } = await api.post(`/api/admin/rates/${id}/delete`, credentials);
    return data;
  },
};
