import { api } from './api';
import { AdminNotification, ApiResponse } from '@/types';

export const notificationsService = {
  getNotifications: async (): Promise<ApiResponse<AdminNotification[]>> => {
    const { data } = await api.get('/api/admin/notifications');
    return data;
  },
};
