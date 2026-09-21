import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsService } from '@/services/bookings';
import { QUERY_KEYS } from '@/lib/constants';

export const useAvailability = (date: string, courtId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.AVAILABILITY, date, courtId],
    queryFn: () => bookingsService.getAvailability(date, courtId),
    enabled: !!date && !!courtId,
  });
};

export const useBookings = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.BOOKINGS],
    queryFn: () => bookingsService.getBookings(),
  });
};

export const useVerifyBooking = () => useMutation({ mutationFn: bookingsService.verifyBooking });

export const useUpdateBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: bookingsService.updateBooking, onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BOOKINGS] });
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SCHEDULES] });
  }});
};

export const useRescheduleBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: bookingsService.rescheduleBooking, onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BOOKINGS] });
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SCHEDULES] });
  }});
};

export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bookingsService.createBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BOOKINGS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SCHEDULES] });
    },
  });
};

export const useConfirmBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bookingsService.confirmBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BOOKINGS] });
    },
  });
};

export const useCancelBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bookingsService.cancelBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BOOKINGS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SCHEDULES] });
    },
  });
};

export const useCompleteBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bookingsService.completeBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BOOKINGS] });
    },
  });
};

export const useDeleteBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bookingsService.deleteBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BOOKINGS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SCHEDULES] });
    },
  });
};
