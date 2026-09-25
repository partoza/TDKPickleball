import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courtsService } from '@/services/courts';
import { QUERY_KEYS } from '@/lib/constants';
import { Court } from '@/types';

export const useCourts = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.COURTS],
    queryFn: () => courtsService.getCourts(),
  });
};

export const useCreateCourt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: courtsService.createCourt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COURTS] });
    },
  });
};

export const useUpdateCourt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, court }: { id: number; court: Partial<Court> }) => 
      courtsService.updateCourt(id, court),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COURTS] });
    },
  });
};

export const useDeleteCourt = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: courtsService.deleteCourt, onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COURTS] }) });
};
