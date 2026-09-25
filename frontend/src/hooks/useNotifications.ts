import { useQuery } from '@tanstack/react-query';
import { notificationsService } from '@/services/notifications';
import { QUERY_KEYS } from '@/lib/constants';

export const useNotifications = (enabled = true) => useQuery({
  queryKey: [QUERY_KEYS.NOTIFICATIONS],
  queryFn: notificationsService.getNotifications,
  enabled,
  refetchInterval: 60_000,
  refetchOnWindowFocus: true,
});
