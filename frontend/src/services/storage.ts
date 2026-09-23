import { api } from './api';
import { ApiResponse, BookingCleanupHistory, BookingCleanupPreview, StorageStatus } from '@/types';

export const storageService = {
  async getStatus() {
    const { data } = await api.get<ApiResponse<StorageStatus>>('/api/admin/storage/status');
    return data;
  },
  async getPreview(fromDate: string, throughDate: string) {
    const { data } = await api.get<ApiResponse<BookingCleanupPreview>>('/api/admin/storage/cleanup-preview', { params: { fromDate, throughDate } });
    return data;
  },
  async getHistory() {
    const { data } = await api.get<ApiResponse<BookingCleanupHistory[]>>('/api/admin/storage/cleanup-history');
    return data;
  },
  async cleanup(fromDate: string, throughDate: string) {
    const { data } = await api.post<ApiResponse<{ deletedBookingCount: number; deletedReceiptCount: number; fromDate: string; throughDate: string }>>('/api/admin/storage/cleanup', {
      fromDate,
      throughDate,
      confirmation: 'DELETE',
    });
    return data;
  },
};
