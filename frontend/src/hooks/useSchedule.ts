import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schedulesService } from '@/services/schedules';
import { QUERY_KEYS } from '@/lib/constants';
import { Schedule } from '@/types';

export const useScheduleBoard = (date: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.SCHEDULES, 'board', date],
    queryFn: () => schedulesService.getScheduleBoard(date),
  });
};

export const usePublicWeeklySchedules = (dates: string[]) => {
  return useQuery({
    queryKey: [QUERY_KEYS.SCHEDULES, 'board', 'weekly', dates],
    queryFn: () => schedulesService.getPublicWeeklySchedules(dates),
  });
};

export const useAdminSchedules = (date: string, courtId?: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.SCHEDULES, 'admin', date, courtId],
    queryFn: () => schedulesService.getAdminSchedules(date, courtId),
  });
};

export const useAdminWeeklySchedules = (dates: string[], courtId?: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.SCHEDULES, 'admin', 'weekly', dates, courtId],
    queryFn: () => schedulesService.getAdminWeeklySchedules(dates, courtId),
  });
};

export const useUpdateSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, update }: { id: string; update: Partial<Schedule> }) => 
      schedulesService.updateSchedule(id, update),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SCHEDULES] });
    },
  });
};

export const useBulkUpdate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: schedulesService.bulkUpdate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SCHEDULES] });
    },
  });
};

export const useCopySchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: schedulesService.copySchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SCHEDULES] });
    },
  });
};
