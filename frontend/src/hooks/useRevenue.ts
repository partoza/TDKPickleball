import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { ApiResponse, RevenueSummary } from '@/types';

export function useRevenue(fromDate: string, throughDate: string) {
  return useQuery({
    queryKey: ['admin-revenue', fromDate, throughDate],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<RevenueSummary>>('/api/admin/revenue', {
        params: { fromDate, throughDate },
      });
      return data;
    },
    enabled: Boolean(fromDate && throughDate),
  });
}
