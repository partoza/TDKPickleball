import { api } from './api';
import { Booking, ApiResponse, RateType } from '@/types';
import { withSeconds } from '@/lib/time-range';

export const bookingsService = {
  getAvailability: async (date: string, courtId: string) => {
    const { data } = await api.get(`/api/bookings/availability?date=${date}&courtId=${courtId}`);
    return data;
  },
  createBooking: async (payload: any): Promise<ApiResponse<Booking>> => {
    const mapped = {
      courtId: Number(payload.courtId), bookingDate: payload.bookingDate || payload.date,
      startTime: withSeconds(payload.startTime), endTime: withSeconds(payload.endTime),
      customerName: payload.customerName, email: payload.email || payload.customerEmail,
      phone: payload.phone || payload.customerPhone, notes: payload.notes, amountPaid: payload.amountPaid || 0,
      rateType: payload.rateType || RateType.Booking,
      paddleRentalQuantity: Number(payload.paddleRentalQuantity || 0)
    };
    if (payload.receipt instanceof File) {
      const form = new FormData();
      Object.entries(mapped).forEach(([key, value]) => form.append(key, String(value ?? '')));
      form.append('receipt', payload.receipt);
      const { data } = await api.post('/api/bookings/with-receipt', form);
      return data;
    }
    const { data } = await api.post('/api/bookings', mapped);
    return data;
  },
  submitPublicBookingRequest: async (payload: any): Promise<ApiResponse<{ requestReference: string; submittedAt: string }>> => {
    const form = new FormData();
    form.append('customerName', payload.customerName);
    form.append('phone', payload.phone || '');
    form.append('notes', payload.notes || '');
    form.append('paddleRentalQuantity', String(Number(payload.paddleRentalQuantity || 0)));
    form.append('schedulesJson', JSON.stringify(payload.schedules.map((schedule: any) => ({
      courtId: Number(schedule.courtId),
      bookingDate: schedule.bookingDate || schedule.date,
      startTime: withSeconds(schedule.startTime),
      endTime: withSeconds(schedule.endTime),
    }))));
    form.append('receipt', payload.receipt);
    const { data } = await api.post('/api/booking-requests/with-receipt', form);
    return data;
  },
  submitPublicPayMongoRequest: async (payload: any): Promise<ApiResponse<{ requestReference: string; checkoutUrl: string; submittedAt: string }>> => {
    const request = {
      customerName: payload.customerName,
      phone: payload.phone || '',
      notes: payload.notes || '',
      paddleRentalQuantity: Number(payload.paddleRentalQuantity || 0),
      schedulesJson: JSON.stringify(payload.schedules.map((schedule: any) => ({
        courtId: Number(schedule.courtId),
        bookingDate: schedule.bookingDate || schedule.date,
        startTime: withSeconds(schedule.startTime),
        endTime: withSeconds(schedule.endTime),
      })))
    };
    const { data } = await api.post('/api/booking-requests/paymongo', request);
    return data;
  },
  verifyBooking: async (bookingReference: string): Promise<ApiResponse<Booking>> => {
    const { data } = await api.post('/api/bookings/verify', { bookingReference });
    return data;
  },
  getBookings: async (): Promise<ApiResponse<Booking[]>> => {
    const { data } = await api.get('/api/admin/bookings');
    return data;
  },
  getBooking: async (id: number): Promise<ApiResponse<Booking>> => {
    const { data } = await api.get(`/api/admin/bookings/${id}`);
    return data;
  },
  updateBooking: async ({ id, payload }: { id: number; payload: any }): Promise<ApiResponse<Booking>> => {
    const request = { ...payload, startTime: withSeconds(payload.startTime), endTime: withSeconds(payload.endTime) };
    const { data } = await api.put(`/api/admin/bookings/${id}`, request); return data;
  },
  rescheduleBooking: async ({ id, payload }: { id: number; payload: any }): Promise<ApiResponse<Booking>> => {
    const request = { ...payload, startTime: withSeconds(payload.startTime), endTime: withSeconds(payload.endTime) };
    const { data } = await api.post(`/api/admin/bookings/${id}/reschedule`, request); return data;
  },
  confirmBooking: async (id: number): Promise<ApiResponse<Booking>> => {
    const { data } = await api.post(`/api/admin/bookings/${id}/confirm`);
    return data;
  },
  addPaddleRental: async ({ id, quantity }: { id: number; quantity: number }): Promise<ApiResponse<Booking>> => {
    const { data } = await api.post(`/api/admin/bookings/${id}/paddle-rentals`, { quantity });
    return data;
  },
  cancelBooking: async (id: number): Promise<ApiResponse<Booking>> => {
    const { data } = await api.post(`/api/admin/bookings/${id}/cancel`);
    return data;
  },
  completeBooking: async (id: number): Promise<ApiResponse<Booking>> => {
    const { data } = await api.post(`/api/admin/bookings/${id}/complete`);
    return data;
  },
  deleteBooking: async (id: number): Promise<ApiResponse<boolean>> => {
    const { data } = await api.delete(`/api/admin/bookings/${id}`);
    return data;
  },
};
