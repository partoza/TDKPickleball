import { api } from './api';
import { Court, ApiResponse } from '@/types';
import { withSeconds } from '@/lib/time-range';

const normalizeCourtTimes = (court: Partial<Court>) => ({
  ...court,
  ...(court.openTime ? { openTime: withSeconds(court.openTime) } : {}),
  ...(court.closeTime ? { closeTime: withSeconds(court.closeTime) } : {}),
});

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
    const { data } = await api.post('/api/admin/courts', normalizeCourtTimes(court));
    return data;
  },
  updateCourt: async (id: number, court: Partial<Court>): Promise<ApiResponse<Court>> => {
    const { data } = await api.put(`/api/admin/courts/${id}`, normalizeCourtTimes(court));
    return data;
  },
  deleteCourt: async ({ id, credentials }: { id: number; credentials: { email: string; password: string } }): Promise<ApiResponse<void>> => {
    const { data } = await api.post(`/api/admin/courts/${id}/delete`, credentials);
    return data;
  },
};
