import { api } from './api';
import { ScheduleBoardResponse, Schedule, ApiResponse } from '@/types';

export const schedulesService = {
  getScheduleBoard: async (date: string): Promise<ApiResponse<ScheduleBoardResponse>> => {
    const { data } = await api.get(`/api/schedule-board?date=${date}`);
    return data;
  },
  getPublicWeeklySchedules: async (dates: string[]): Promise<ScheduleBoardResponse[]> => {
    const promises = dates.map(date => api.get<ApiResponse<ScheduleBoardResponse>>(`/api/schedule-board?date=${date}`));
    const responses = await Promise.all(promises);
    return responses.map(res => res.data.data!);
  },
  getAdminSchedules: async (date: string, courtId?: string): Promise<ApiResponse<Schedule[]>> => {
    const url = `/api/admin/schedules?date=${date}${courtId && courtId !== 'all' ? `&courtId=${courtId}` : ''}`;
    const { data } = await api.get(url);
    return data;
  },
  getAdminWeeklySchedules: async (dates: string[], courtId?: string): Promise<Schedule[]> => {
    const promises = dates.map(date => {
      const url = `/api/admin/schedules?date=${date}${courtId && courtId !== 'all' ? `&courtId=${courtId}` : ''}`;
      return api.get<ApiResponse<Schedule[]>>(url);
    });
    const responses = await Promise.all(promises);
    return responses.flatMap(res => res.data.data || []);
  },
  updateSchedule: async (id: string, update: Partial<Schedule>): Promise<ApiResponse<Schedule>> => {
    const { data } = await api.put(`/api/admin/schedules/${id}`, update);
    return data;
  },
  bulkUpdate: async (payload: any): Promise<ApiResponse<void>> => {
    const { data } = await api.post('/api/admin/schedules/bulk-update', payload);
    return data;
  },
  copySchedule: async (payload: any): Promise<ApiResponse<void>> => {
    const { data } = await api.post('/api/admin/schedules/copy', payload);
    return data;
  }
};
