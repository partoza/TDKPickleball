import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ratesService } from '@/services/rates';
import { QUERY_KEYS } from '@/lib/constants';
import { Rate } from '@/types';

export const useRates = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.RATES],
    queryFn: () => ratesService.getRates(),
  });
};

export const useCreateRate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ratesService.createRate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RATES] });
    },
  });
};

export const useUpdateRate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rate }: { id: number; rate: Partial<Rate> }) => 
      ratesService.updateRate(id, rate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RATES] });
    },
  });
};

export const useDeleteRate = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: ratesService.deleteRate, onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RATES] }) });
};
