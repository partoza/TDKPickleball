import { useState, useEffect } from 'react';
import { format, addDays, startOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, endOfWeek } from 'date-fns';
import { useAdminSchedules, useBulkUpdate, useDeleteSchedule, usePublicBookingWindow, useUpdatePublicBookingWindow, useUpdateSchedule } from '@/hooks/useSchedule';
import { useCourts } from '@/hooks/useCourts';
import { ChevronLeftIcon as ChevronLeft, ChevronRightIcon as ChevronRight, CalendarDaysIcon as CalendarIcon, PlusIcon as Plus, MinusIcon as Minus, TrashIcon as Trash } from '@heroicons/react/24/solid';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminPageSkeleton } from '@/components/admin/AdminPageSkeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { STATUS_COLORS, STATUS_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { BookingStatus, InternalCoachType, PromoAudience, RateType, Schedule, ScheduleStatus } from '@/types';
import { useInternalCoaches } from '@/hooks/useInternalCoaches';
import { usePromos } from '@/hooks/usePromos';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/services/api';
import { Input } from '@/components/ui/input';
import { useRates } from '@/hooks/useRates';
import { calculateRateQuote } from '@/lib/rate-calculation';
import { isValidTimeRange, minimumEndTime, withSeconds } from '@/lib/time-range';
import { BookingBlocksEditor } from '@/components/booking/BookingBlocksEditor';
import { allocateBatchPayment, BookingBlockErrors, BookingBlockValue, bookingBlocksTotal, createBookingBlock, hasBookingBlockErrors, validateBookingBlocks } from '@/lib/booking-blocks';
import { getManilaDate, isPastManilaStart } from '@/lib/manila-time';
import { useAuth } from '@/hooks/useAuth';
import { isPromoAvailable } from '@/lib/promo-availability';
import { PaddleIcon } from '@/components/ui/paddle-icon';
import { AdminDatePicker } from '@/components/admin/AdminFormControls';
import { CustomerCombobox } from '@/components/admin/CustomerCombobox';
import { useCustomerAvailablePromos } from '@/hooks/useBookings';
import { formatAppDate, formatAppTime } from '@/lib/date-time';

function getTimedStatus(slot: Schedule) {
  const base = STATUS_LABELS[slot.status];
  if (slot.status === ScheduleStatus.Unavailable || slot.status === ScheduleStatus.Available) return { label: base, phase: 'scheduled' as const };
  const start = new Date(`${slot.date}T${slot.startTime}`);
  const end = new Date(`${slot.date}T${slot.endTime}`);
  if (end <= start) end.setDate(end.getDate() + 1);
  const now = new Date();
  if (now >= end) return { label: `Completed ${base}`, phase: 'completed' as const };
  if (now >= start) return { label: `Ongoing ${base}`, phase: 'ongoing' as const };
  return { label: base, phase: 'scheduled' as const };
}

function formatHourLabel(hour: number) {
  if (hour === 12) return '12:00 NN';
  if (hour === 24 || hour === 0) return '12:00 MN';
  if (hour < 12) return `${hour}:00 AM`;
  return `${hour - 12}:00 PM`;
}

function toMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function scheduleAtHour(schedules: Schedule[], courtId: string, date: string, time: string) {
  const minute = toMinutes(time);
  return schedules.find(schedule => {
    if (String(schedule.courtId) !== courtId || schedule.date !== date) return false;
    const start = toMinutes(schedule.startTime);
    const rawEnd = toMinutes(schedule.endTime);
    const end = rawEnd <= start ? rawEnd + 1440 : rawEnd;
    return minute >= start && minute < end;
  });
}

const MiniCalendar = ({ currentDate, onSelect }: { currentDate: Date, onSelect: (d: Date) => void }) => {
  const [viewDate, setViewDate] = useState(currentDate);
  const start = startOfWeek(startOfMonth(viewDate), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(viewDate), { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start, end });

  return (
    <div className="w-[240px] p-1">
      <div className="flex justify-between items-center mb-4 gap-1">
         <Select
           value={String(viewDate.getMonth())}
           onValueChange={(value) => {
             const newDate = new Date(viewDate);
             newDate.setMonth(parseInt(value));
             setViewDate(newDate);
           }}
         >
           <SelectTrigger className="h-8 w-[126px] border-0 bg-transparent px-2 text-xs font-semibold shadow-none"><SelectValue /></SelectTrigger>
           <SelectContent>{Array.from({length: 12}).map((_, i) => <SelectItem key={i} value={String(i)}>{format(new Date(2000, i, 1), 'MMMM')}</SelectItem>)}</SelectContent>
         </Select>
         
         <Select
           value={String(viewDate.getFullYear())}
           onValueChange={(value) => {
             const newDate = new Date(viewDate);
             newDate.setFullYear(parseInt(value));
             setViewDate(newDate);
           }}
         >
           <SelectTrigger className="h-8 w-[84px] border-0 bg-transparent px-2 text-xs font-semibold shadow-none"><SelectValue /></SelectTrigger>
           <SelectContent>{Array.from({length: 10}).map((_, i) => {
             const y = new Date().getFullYear() - 2 + i;
             return <SelectItem key={y} value={String(y)}>{y}</SelectItem>;
           })}</SelectContent>
         </Select>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map(day => {
          const isCurrentMonth = day.getMonth() === viewDate.getMonth();
          const isSelected = format(day, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd');
          const isToday = format(day, 'yyyy-MM-dd') === getManilaDate();
          
          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelect(day)}
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-[12px] font-medium transition-colors",
                !isCurrentMonth && "text-slate-300",
                isCurrentMonth && !isSelected && !isToday && "text-slate-700 hover:bg-slate-100",
                isToday && !isSelected && "bg-slate-100 text-primary font-bold",
                isSelected && "bg-primary text-primary-foreground font-bold shadow-sm"
              )}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function SchedulePage() {
  const { user } = useAuth();
  const isStaff = user?.role === 'Staff';
  const [currentDate, setCurrentDate] = useState(new Date());
  const [clock, setClock] = useState(Date.now());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [bookingModalData, setBookingModalData] = useState<{ id?: string; bookingId?: number | null; courtId: string; dateStr: string; startTimeStr: string; endTimeStr: string; status: string; notes: string; bookedBy: string; email: string; phone: string; paymentStatus: BookingStatus; amountPaid: number | ''; internalCoachProfileId: number | null; promoId: number | null; paddleRentalQuantity: number; customerId: number | null } | null>(null);
  const [scheduleErrors, setScheduleErrors] = useState<Record<string, string>>({});
  const [scheduleBlocks, setScheduleBlocks] = useState<BookingBlockValue[]>([createBookingBlock()]);
  const [scheduleBlockErrors, setScheduleBlockErrors] = useState<BookingBlockErrors[]>([]);
  const [savingBatch, setSavingBatch] = useState(false);
  const [viewModalData, setViewModalData] = useState<Schedule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; date: string; startTime: string; endTime: string; hasLinkedBooking: boolean } | null>(null);
  const [deleteCredentials, setDeleteCredentials] = useState({ email: '', password: '' });
  const [deleteError, setDeleteError] = useState('');
  const bulkUpdateMutation = useBulkUpdate();
  const updateMutation = useUpdateSchedule();
  const deleteMutation = useDeleteSchedule();
  const { data: publicBookingWindowResponse } = usePublicBookingWindow();
  const updatePublicBookingWindow = useUpdatePublicBookingWindow();
  const [publicBookingThroughDate, setPublicBookingThroughDate] = useState('');
  
  const { data: courtsRes, isLoading: courtsLoading } = useCourts();
  const courts = courtsRes?.data || [];
  const { data: ratesRes } = useRates();
  const rates = ratesRes?.data || [];
  const { internalCoaches, fetchInternalCoaches } = useInternalCoaches(); 
  const { promos, fetchPromos } = usePromos();
  useEffect(() => { fetchInternalCoaches(); fetchPromos(); }, [fetchInternalCoaches, fetchPromos]);

  useEffect(() => {
    setPublicBookingThroughDate(publicBookingWindowResponse?.data?.bookingThroughDate || '');
  }, [publicBookingWindowResponse?.data?.bookingThroughDate]);

  const savePublicBookingWindow = (bookingThroughDate: string | null) => {
    updatePublicBookingWindow.mutate(bookingThroughDate, {
      onSuccess: response => {
        if (!response.success) return toast.error(response.message || 'The public booking window could not be updated');
        setPublicBookingThroughDate(response.data?.bookingThroughDate || '');
        toast.success(response.message || 'Public booking window updated');
      },
      onError: error => toast.error(getApiErrorMessage(error, 'The public booking window could not be updated')),
    });
  };

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const prevDay = () => setCurrentDate(addDays(currentDate, -1));
  const nextDay = () => setCurrentDate(addDays(currentDate, 1));
  const today = () => setCurrentDate(new Date());
  const getInitials = (name: string) => {
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const selectedDate = format(currentDate, 'yyyy-MM-dd');
  const { data: schedulesResponse, isLoading: scheduleLoading } = useAdminSchedules(selectedDate);
  const isLoading = courtsLoading || scheduleLoading;
  const daySchedules = schedulesResponse?.data || [];
  const timeColumnWidth = 148;
  const scheduleGridTemplate = `${timeColumnWidth}px repeat(${Math.max(courts.length, 1)}, minmax(210px, 1fr))`;
  const scheduleGridMinWidth = timeColumnWidth + Math.max(courts.length, 1) * 210;
  const modalRateType = bookingModalData?.status === 'Training' ? RateType.Training : RateType.Booking;
  const isAddingCustomerSchedule = !!bookingModalData && !bookingModalData.id && (bookingModalData.status === 'Booked' || bookingModalData.status === 'Training');
  const { data: customerPromosResponse, isFetching: customerPromosLoading } = useCustomerAvailablePromos(
    bookingModalData?.customerId,
    modalRateType,
    scheduleBlocks.length,
    isAddingCustomerSchedule,
  );
  const linkedCustomerPromos = customerPromosResponse?.data || [];
  const modalPromoOptions = bookingModalData?.customerId
    ? linkedCustomerPromos
    : promos.filter(promo => isPromoAvailable(promo, modalRateType) && promo.audience !== PromoAudience.NfcCustomersOnly);
  const selectedLinkedPromo = linkedCustomerPromos.find(promo => promo.id === bookingModalData?.promoId);
  const modalQuote = bookingModalData ? calculateRateQuote(rates, bookingModalData.startTimeStr, bookingModalData.endTimeStr, modalRateType) : null;

  useEffect(() => {
    if (!isAddingCustomerSchedule || !bookingModalData?.customerId || customerPromosLoading || !customerPromosResponse) return;
    setBookingModalData(current => {
      if (!current?.customerId || current.id) return current;
      const nextPromoId = linkedCustomerPromos.some(promo => promo.id === current.promoId)
        ? current.promoId
        : linkedCustomerPromos[0]?.id ?? null;
      return nextPromoId === current.promoId ? current : { ...current, promoId: nextPromoId };
    });
  }, [isAddingCustomerSchedule, bookingModalData?.customerId, modalRateType, scheduleBlocks.length, customerPromosLoading, customerPromosResponse]);
  
  let batchDiscount = 0;
  if (!bookingModalData?.id && bookingModalData?.promoId && promos) {
    const promo = promos.find((p: any) => p.id === bookingModalData.promoId);
    if (promo && isPromoAvailable(promo, modalRateType)) {
      const rawGrandTotal = bookingBlocksTotal(scheduleBlocks, rates, modalRateType);
      batchDiscount = promo.type === 'Percentage' ? (rawGrandTotal * (promo.value / 100)) : promo.value;
      if (batchDiscount > rawGrandTotal) batchDiscount = rawGrandTotal;
    }
  }
  const modalRawGrandTotal = bookingBlocksTotal(scheduleBlocks, rates, modalRateType);
  const modalCourtTotal = Math.max(0, modalRawGrandTotal - batchDiscount);
  const modalPaddleRentalFee = (bookingModalData?.paddleRentalQuantity || 0) * 100;
  const modalGrandTotal = bookingModalData?.id ? (modalQuote?.covered ? modalQuote.total : 0) : modalCourtTotal + modalPaddleRentalFee;

  const openDeleteConfirmation = () => {
    if (!bookingModalData?.id || user?.role !== 'Admin') return;
    setDeleteTarget({ id: bookingModalData.id, date: bookingModalData.dateStr, startTime: bookingModalData.startTimeStr, endTime: bookingModalData.endTimeStr, hasLinkedBooking: !!bookingModalData.bookingId });
    setDeleteCredentials({ email: '', password: '' });
    setDeleteError('');
    setBookingModalData(null);
  };

  const handleDeleteSchedule = () => {
    if (!deleteTarget) return;
    if (!deleteCredentials.email.trim() || !deleteCredentials.password) {
      setDeleteError('Enter the signed-in administrator email and password.');
      return;
    }
    deleteMutation.mutate({ id: deleteTarget.id, email: deleteCredentials.email.trim(), password: deleteCredentials.password }, {
      onSuccess: response => {
        if (!response.success) {
          setDeleteError(response.message || 'The administrator credentials could not be verified.');
          return;
        }
        toast.success(deleteTarget.hasLinkedBooking ? 'Schedule and linked booking deleted' : 'Schedule deleted');
        setDeleteTarget(null);
        setDeleteCredentials({ email: '', password: '' });
      },
      onError: error => setDeleteError(getApiErrorMessage(error, 'The schedule could not be deleted.')),
    });
  };

  const handleSaveSchedule = async () => {
    if (!bookingModalData) return;
    const needsContact = bookingModalData.status === 'Booked' || bookingModalData.status === 'Training';
    const errors: Record<string, string> = {};
    if (needsContact && !bookingModalData.bookedBy.trim()) errors.bookedBy = 'Booked by is required.';
    if (needsContact && bookingModalData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bookingModalData.email)) errors.email = 'Enter a valid email address.';

    if (!bookingModalData.id) {
      const rateType = bookingModalData.status === 'Training' ? RateType.Training : RateType.Booking;
      const nextBlockErrors = validateBookingBlocks(scheduleBlocks, rates, rateType, {
        requireRate: needsContact,
      });
      if (needsContact && bookingModalData.paymentStatus === BookingStatus.Reserved && Number(bookingModalData.amountPaid) < 0) errors.amountPaid = 'Reservation amount cannot be negative.';
      else if (needsContact && bookingModalData.paymentStatus === BookingStatus.Reserved && Number(bookingModalData.amountPaid) > modalGrandTotal) errors.amountPaid = `Reservation amount cannot exceed the total of ₱${modalGrandTotal.toLocaleString()}.`;
      setScheduleErrors(errors);
      setScheduleBlockErrors(nextBlockErrors);
      if (Object.keys(errors).length || hasBookingBlockErrors(nextBlockErrors)) return;

      setSavingBatch(true);
      try {
        const batchAmount = bookingModalData.paymentStatus === BookingStatus.Paid ? modalGrandTotal : Number(bookingModalData.amountPaid || 0);
        const allocatedPayments = needsContact ? allocateBatchPayment(scheduleBlocks, rates, rateType, batchAmount, modalPaddleRentalFee) : scheduleBlocks.map(() => 0);
        const results = [];
        for (const [index, block] of scheduleBlocks.entries()) {
          results.push(await bulkUpdateMutation.mutateAsync({
            courtId: Number(block.courtId), date: block.date, startTime: block.startTime, endTime: block.endTime,
            status: bookingModalData.status as any, notes: bookingModalData.notes,
            bookedBy: needsContact ? bookingModalData.bookedBy : null,
            email: needsContact ? bookingModalData.email : null,
            phone: needsContact ? bookingModalData.phone : null,
            paymentStatus: needsContact ? bookingModalData.paymentStatus : BookingStatus.Paid,
            amountPaid: needsContact ? allocatedPayments[index] : 0,
            internalCoachProfileId: bookingModalData.internalCoachProfileId,
            promoId: needsContact ? bookingModalData.promoId : null,
            paddleRentalQuantity: needsContact && index === 0 ? bookingModalData.paddleRentalQuantity : 0,
            customerId: needsContact ? bookingModalData.customerId : null,
          }));
        }
        const failed = results.find((response: any) => response?.success === false);
        if (failed) { toast.error(failed.message || 'One or more schedules could not be saved'); return; }
        toast.success(`${results.length} ${results.length === 1 ? 'schedule' : 'schedules'} saved`);
        setScheduleErrors({}); setScheduleBlockErrors([]); setBookingModalData(null);
      } catch (error: any) {
        toast.error(error.response?.status === 401 ? 'Your admin session expired. Please sign in again.' : getApiErrorMessage(error, 'Unable to save schedules'));
      } finally {
        setSavingBatch(false);
      }
      return;
    }

    if (!bookingModalData.courtId) return;
    if (needsContact && bookingModalData.paymentStatus === BookingStatus.Reserved && Number(bookingModalData.amountPaid) < 0) errors.amountPaid = 'Reservation amount cannot be negative.';
    else if (needsContact && bookingModalData.paymentStatus === BookingStatus.Reserved && modalQuote?.covered && Number(bookingModalData.amountPaid) > modalQuote.total) errors.amountPaid = `Reservation amount cannot exceed the total of ₱${modalQuote.total.toLocaleString()}.`;
    if (needsContact && !modalQuote?.covered) errors.rate = 'No active rate covers the complete selected schedule.';
    if (!isValidTimeRange(bookingModalData.startTimeStr, bookingModalData.endTimeStr)) errors.endTimeStr = 'End time must be at least 1 hour after start time.';
    setScheduleErrors(errors);
    if (Object.keys(errors).length) return;
    const payload = {
      courtId: parseInt(bookingModalData.courtId),
      date: bookingModalData.dateStr,
      startTime: bookingModalData.startTimeStr,
      endTime: bookingModalData.endTimeStr,
      status: bookingModalData.status as any,
      notes: bookingModalData.notes,
      bookedBy: needsContact ? bookingModalData.bookedBy : null,
      email: needsContact ? bookingModalData.email : null,
      phone: needsContact ? bookingModalData.phone : null,
      paymentStatus: needsContact ? bookingModalData.paymentStatus : BookingStatus.Paid,
      amountPaid: needsContact && bookingModalData.paymentStatus === BookingStatus.Reserved ? Number(bookingModalData.amountPaid) : 0,
      internalCoachProfileId: bookingModalData.internalCoachProfileId,
      promoId: needsContact ? bookingModalData.promoId : null,
      paddleRentalQuantity: needsContact ? bookingModalData.paddleRentalQuantity : 0,
      customerId: needsContact ? bookingModalData.customerId : null,
    };
    const mutation = bookingModalData.id
      ? { mutate: (p: any, o: any) => updateMutation.mutate({ id: bookingModalData.id!, update: p }, o) }
      : bulkUpdateMutation;
    mutation.mutate(payload, {
      onSuccess: (response: any) => {
        if (response?.success === false) {
          toast.error(response.message || response.errors?.[0] || 'The schedule could not be saved');
          return;
        }
        toast.success(bookingModalData.id ? 'Schedule updated' : 'Schedule saved');
        setScheduleErrors({});
        setBookingModalData(null);
      },
      onError: (error: any) => toast.error(error.response?.status === 401 ? 'Your admin session expired. Please sign in again.' : getApiErrorMessage(error, 'Unable to save schedule'))
    });
  };

  if (isLoading) return <AdminPageSkeleton layout="schedule" label="Loading court schedule" />;

  return (
    <div className="space-y-6 max-w-[1600px] w-full mx-auto px-4 sm:px-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="mb-6 pl-1">
        <h1 className="text-[28px] font-bold tracking-tight text-slate-900">Court Schedule</h1>
        <p className="text-[14px] text-slate-500 mt-2 leading-relaxed max-w-[600px]">
          Manage court availability, daily bookings, and coordinate upcoming time slots. Click any empty slot to add a new booking.
        </p>
      </div>

      {user?.role === 'Admin' && <section className="rounded-xl border border-primary/15 bg-primary/[0.035] p-4 shadow-sm md:p-5" aria-labelledby="public-booking-window-title">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Public booking access</p>
            <h2 id="public-booking-window-title" className="mt-1 text-lg font-bold text-slate-900">Set the last publicly bookable date</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">Customers cannot select or submit dates after this limit. Admin scheduling remains available for every future date.</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto lg:items-end">
            <div className="w-full sm:w-[230px]">
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Booking open through</label>
              <AdminDatePicker value={publicBookingThroughDate} minDate={new Date(`${getManilaDate()}T00:00:00`)} onChange={setPublicBookingThroughDate} placeholder="No date limit" />
            </div>
            <button type="button" className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 disabled:opacity-60" onClick={() => savePublicBookingWindow(publicBookingThroughDate || null)} disabled={updatePublicBookingWindow.isPending || !publicBookingThroughDate}>
              {updatePublicBookingWindow.isPending ? <LoadingIndicator label="Saving public booking window" /> : 'Save limit'}
            </button>
            {publicBookingWindowResponse?.data?.bookingThroughDate && <button type="button" className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60" onClick={() => savePublicBookingWindow(null)} disabled={updatePublicBookingWindow.isPending}>Remove limit</button>}
          </div>
        </div>
      </section>}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-label={`Court schedules for ${formatAppDate(currentDate)}`}>
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Schedule date</span>
            <div className="flex min-w-0 items-center gap-2">
              <button type="button" onClick={prevDay} aria-label="Previous date" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"><ChevronLeft className="h-5 w-5" /></button>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild><button type="button" className="flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[15px] font-bold text-slate-800 shadow-sm hover:bg-slate-50 sm:min-w-[290px] sm:flex-none"><CalendarIcon className="h-4 w-4 shrink-0 text-primary" /><span className="truncate">{format(currentDate, 'EEE, MMM d, yyyy')}</span>{selectedDate === getManilaDate(new Date(clock)) && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Today</span>}</button></PopoverTrigger>
                <PopoverContent className="w-auto rounded-xl border-slate-200 bg-white p-4 shadow-xl" align="center" sideOffset={8}><MiniCalendar currentDate={currentDate} onSelect={date => { setCurrentDate(date); setIsCalendarOpen(false); }} /></PopoverContent>
              </Popover>
              <button type="button" onClick={nextDay} aria-label="Next date" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"><ChevronRight className="h-5 w-5" /></button>
              {selectedDate !== getManilaDate(new Date(clock)) && <button type="button" onClick={today} className="hidden h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:block">Today</button>}
            </div>
          </div>

          {!isStaff && <button type="button" disabled={!courts.length} onClick={() => {
            const courtId = courts[0]?.id.toString() || '';
            setScheduleBlocks([createBookingBlock({ courtId, date: selectedDate })]);
            setScheduleBlockErrors([]);
            setBookingModalData({ courtId, dateStr: selectedDate, startTimeStr: '07:00:00', endTimeStr: '08:00:00', status: 'Booked', notes: '', bookedBy: '', email: '', phone: '', paymentStatus: BookingStatus.Paid, amountPaid: '', internalCoachProfileId: null, promoId: null, paddleRentalQuantity: 0, customerId: null });
          }} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:opacity-50 sm:w-auto"><Plus className="h-4 w-4" />Add Schedule</button>}
        </div>

        {!courts.length && !isLoading ? <div className="grid min-h-64 place-items-center text-center"><div><p className="font-bold text-slate-800">No active courts available</p><p className="mt-1 text-sm text-slate-500">Add or activate a court to manage its schedule.</p></div></div> : <div className="relative">
          {isLoading && <div className="pointer-events-none absolute left-1/2 top-6 z-50 -translate-x-1/2"><div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white/95 px-5 py-2.5 shadow-lg backdrop-blur"><LoadingIndicator size="sm" className="text-primary" /><span className="text-xs font-bold text-slate-700">Loading schedule</span></div></div>}
          <div className="overflow-x-auto custom-scrollbar"><div style={{ minWidth: `${scheduleGridMinWidth}px` }}>
            <div className="sticky top-0 z-20 grid border-b border-slate-200 bg-slate-50" style={{ gridTemplateColumns: scheduleGridTemplate }}>
              <div className="sticky left-0 z-30 flex min-h-20 items-center border-r border-slate-200 bg-slate-50 px-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Time</div>
              {courts.map(court => <div key={court.id} className="flex min-h-20 flex-col items-center justify-center border-r border-slate-200 px-4 text-center last:border-r-0"><span className="text-base font-bold text-slate-900">{court.displayName || court.name}</span><span className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Indoor court</span></div>)}
            </div>
            <div className="max-h-[680px] overflow-y-auto custom-scrollbar">{Array.from({ length: 17 }, (_, index) => index + 7).map(hour => {
              const startTime = `${String(hour).padStart(2, '0')}:00:00`;
              const endTime = hour + 1 === 24 ? '00:00:00' : `${String(hour + 1).padStart(2, '0')}:00:00`;
              const isPastStart = isPastManilaStart(selectedDate, startTime, new Date(clock));
              return <div key={startTime} className="grid border-b border-slate-200 last:border-b-0" style={{ gridTemplateColumns: scheduleGridTemplate }}>
                <div className="sticky left-0 z-10 flex min-h-[90px] flex-col justify-center border-r border-slate-200 bg-white px-4 sm:px-5"><span className="text-[15px] font-bold tracking-tight text-slate-900">{formatHourLabel(hour)}</span><span className="mt-1 text-xs font-medium text-slate-500">to {formatHourLabel(hour + 1)}</span></div>
                {courts.map(court => {
                  const courtId = court.id.toString();
                  const record = scheduleAtHour(daySchedules, courtId, selectedDate, startTime);
                  const slot = record?.status === ScheduleStatus.Available ? undefined : record;
                  return <div key={`${courtId}-${startTime}`} className={cn('group/cell min-h-[86px] border-r border-slate-200 p-2 last:border-r-0', !slot && isPastStart && 'bg-slate-50', !isStaff && !slot && !isPastStart && 'cursor-pointer hover:bg-primary/[0.025]')} onClick={() => {
                    if (isStaff || slot || isPastStart) return;
                    setScheduleBlocks([createBookingBlock({ courtId, date: selectedDate, startTime: startTime.slice(0, 5), endTime: endTime.slice(0, 5) })]);
                    setScheduleBlockErrors([]);
                    setBookingModalData({ courtId, dateStr: selectedDate, startTimeStr: startTime, endTimeStr: endTime, status: 'Booked', notes: '', bookedBy: '', email: '', phone: '', paymentStatus: BookingStatus.Paid, amountPaid: '', internalCoachProfileId: null, promoId: null, paddleRentalQuantity: 0, customerId: null });
                  }}>
                    {isLoading ? <Skeleton className="h-full min-h-[68px] w-full rounded-lg" /> : slot ? (() => {
                      const timedStatus = getTimedStatus(slot);
                      return <button type="button" onClick={event => { event.stopPropagation(); setViewModalData(slot); }} className={cn('group/booked relative flex h-full min-h-[68px] w-full flex-col items-center justify-center overflow-hidden rounded-lg border p-2.5 text-center shadow-sm', STATUS_COLORS[slot.status], timedStatus.phase === 'ongoing' && 'ring-2 ring-emerald-500 ring-offset-1', timedStatus.phase === 'completed' && 'brightness-75 saturate-50')}>
                        <span className="w-full text-[11px] font-bold uppercase tracking-wider">{timedStatus.label}</span>
                        {slot.status === ScheduleStatus.Training ? <span className="mt-1 flex w-full flex-col overflow-hidden text-[11px] font-medium opacity-90"><span className="truncate">{slot.bookedBy || 'No Trainee'}</span>{slot.internalCoachProfileId && (() => { const coach = internalCoaches.find(item => item.id === slot.internalCoachProfileId); return coach ? <span className="truncate text-[9px] opacity-75">w/ {coach.name}</span> : null; })()}</span> : slot.status === ScheduleStatus.Internal ? <span className="mt-1 w-full truncate text-[11px] font-medium opacity-90">{internalCoaches.find(profile => profile.id === slot.internalCoachProfileId)?.name || 'No internal assigned'}</span> : (slot.bookedBy || slot.notes) && <span className="mt-1 w-full truncate text-[11px] font-medium opacity-90">{slot.bookedBy || slot.notes}</span>}
                        <span className="absolute inset-0 grid place-items-center bg-black/60 text-[11px] font-bold text-white opacity-0 backdrop-blur-[1px] transition-opacity group-hover/booked:opacity-100">View details</span>
                      </button>;
                    })() : isPastStart ? <div className="flex min-h-[68px] items-center justify-center text-[10px] font-bold uppercase tracking-wider text-slate-400">Past</div> : !isStaff ? <div className="flex min-h-[68px] items-center justify-center"><span className="grid h-8 w-8 place-items-center rounded-full border border-primary/20 bg-primary/10 text-primary opacity-0 transition-opacity group-hover/cell:opacity-100"><Plus className="h-4 w-4" /></span></div> : <div className="flex min-h-[68px] items-center justify-center text-[10px] font-semibold uppercase tracking-wider text-slate-300">Available</div>}
                  </div>;
                })}
              </div>;
            })}</div>
          </div></div>
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500 sm:hidden">Swipe sideways to view every court.</div>
        </div>}
      </section>

      {/* Booking Modal */}
      <Dialog open={!!bookingModalData} onOpenChange={(open) => { if (!open) { setBookingModalData(null); setScheduleErrors({}); setScheduleBlockErrors([]); } }}>
        <DialogContent className="schedule-form-modal sm:max-w-[760px] p-0 bg-white text-slate-900 dark:bg-[#2c2c2e] dark:text-slate-100 rounded-2xl border-slate-200 dark:border-white/10 shadow-2xl gap-0 flex flex-col max-h-[90vh] overflow-hidden">
          
          <div className="px-6 pt-6 pb-2 sm:px-7 sm:pt-7 sm:pb-2 shrink-0">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{bookingModalData?.id ? 'Edit Schedule' : 'New Schedule'}</DialogTitle>
              <DialogDescription className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
                Block out court time or add a new booking.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-6 sm:px-7 pb-6 overflow-y-auto custom-scrollbar flex-1">
            {bookingModalData && (
              <div className="schedule-form mt-4 space-y-5">
                {!bookingModalData.id && <BookingBlocksEditor
                  blocks={scheduleBlocks}
                  onChange={blocks => { setScheduleBlocks(blocks); setScheduleBlockErrors([]); setScheduleErrors(current => ({...current, amountPaid: ''})); }}
                  courts={courts}
                  rates={rates}
                  rateType={modalRateType}
                  errors={scheduleBlockErrors}
                  showQuote={bookingModalData.status === 'Booked' || bookingModalData.status === 'Training'}
                  addLabel="Add Another Schedule"
                  discount={batchDiscount}
                  showSummary={false}
                />}
                {/* Vercel-like Data Badge using Brand Palette */}
                {bookingModalData.id && <div className="relative flex min-w-0 items-center gap-3 overflow-hidden rounded-xl border border-primary/15 bg-white p-3.5 pl-4 shadow-sm dark:border-primary/30 dark:bg-[#3a3a3c]">
                  <span className="absolute inset-y-0 left-0 w-1 bg-primary" aria-hidden="true" />
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                    <CalendarIcon className="h-[18px] w-[18px] text-white" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary/70">Selected Date</span>
                    <span className="break-words text-[13px] font-bold leading-snug text-primary sm:truncate">
                      {formatAppDate(bookingModalData.dateStr)}
                    </span>
                  </div>
                </div>}

                {/* Form Fields */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {bookingModalData.id && <div className="grid grid-cols-2 gap-4 sm:col-span-2">
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider dark:text-slate-200">Start Time *</label>
                      <Select disabled={!!bookingModalData.id && (bookingModalData.status === 'Booked' || bookingModalData.status === 'Training')} value={bookingModalData.startTimeStr} onValueChange={(val) => { const endTime = isValidTimeRange(val, bookingModalData.endTimeStr) ? bookingModalData.endTimeStr : withSeconds(minimumEndTime(val)); setBookingModalData({...bookingModalData, startTimeStr: val, endTimeStr: endTime}); setScheduleErrors(e => ({...e, startTimeStr: '', endTimeStr: ''})); }}>
                        <SelectTrigger className="w-full h-10 rounded-xl border-slate-200 shadow-sm focus:ring-primary/20 text-[13px] font-medium">
                          <SelectValue placeholder="Start" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200 shadow-lg max-h-[200px]">
                          {Array.from({ length: 17 }).map((_, i) => {
                            const hour = i + 7;
                            const hStr = hour === 24 ? '00:00:00' : `${hour.toString().padStart(2, '0')}:00:00`;
                            const formatHourLabel = (h: number) => {
                              if (h === 12) return '12NN';
                              if (h === 24 || h === 0) return '12MN';
                              return h < 12 ? `${h}AM` : `${h - 12}PM`;
                            };
                            return (
                              <SelectItem key={hStr} value={hStr} className="text-[13px] font-medium rounded-lg py-2">
                                {formatHourLabel(hour)}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider dark:text-slate-200">End Time *</label>
                      <Select disabled={!!bookingModalData.id && (bookingModalData.status === 'Booked' || bookingModalData.status === 'Training')} value={bookingModalData.endTimeStr} onValueChange={(val) => { setBookingModalData({...bookingModalData, endTimeStr: val}); setScheduleErrors(e => ({...e, endTimeStr: ''})); }}>
                        <SelectTrigger aria-invalid={!!scheduleErrors.endTimeStr} className={cn("w-full h-10 rounded-xl border-slate-200 shadow-sm focus:ring-primary/20 text-[13px] font-medium", scheduleErrors.endTimeStr && "field-invalid")}>
                          <SelectValue placeholder="End" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200 shadow-lg max-h-[200px]">
                          {Array.from({ length: 17 }).map((_, i) => {
                            const hour = i + 8; // End time starts from 8AM up to 12MN
                            const hStr = hour === 24 ? '00:00:00' : `${hour.toString().padStart(2, '0')}:00:00`;
                            const formatHourLabel = (h: number) => {
                              if (h === 12) return '12NN';
                              if (h === 24 || h === 0) return '12MN';
                              return h < 12 ? `${h}AM` : `${h - 12}PM`;
                            };
                            return (
                              <SelectItem key={hStr} value={hStr} disabled={!isValidTimeRange(bookingModalData.startTimeStr, hStr)} className="text-[13px] font-medium rounded-lg py-2">
                                {formatHourLabel(hour)}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      {scheduleErrors.endTimeStr && <p className="field-error" role="alert">{scheduleErrors.endTimeStr}</p>}
                    </div>
                  </div>}

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider dark:text-slate-200">Status *</label>
                    <Select disabled={!!bookingModalData.id && (bookingModalData.status === 'Booked' || bookingModalData.status === 'Training')} value={bookingModalData.status} onValueChange={(val) => { setBookingModalData({...bookingModalData, status: val, promoId: null}); setScheduleErrors({}); }}>
                      <SelectTrigger className="w-full h-10 rounded-xl border-slate-200 shadow-sm focus:ring-primary/20 text-[13px] font-medium">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                        <SelectItem value="Booked" className="text-[13px] font-medium rounded-lg py-2">Booked</SelectItem>
                        <SelectItem value="Training" className="text-[13px] font-medium rounded-lg py-2">Training</SelectItem>
                        <SelectItem value="Internal" className="text-[13px] font-medium rounded-lg py-2">Internal</SelectItem>
                        <SelectItem value="Unavailable" className="text-[13px] font-medium rounded-lg py-2">Unavailable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider dark:text-slate-200">Notes</label>
                    <Input
                      value={bookingModalData.notes}
                      onChange={(e) => setBookingModalData({...bookingModalData, notes: e.target.value})}
                      placeholder="Optional schedule notes" 
                      className="w-full h-10 text-[13px]" 
                    />
                  </div>
                  {bookingModalData.status === 'Internal' && (
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider dark:text-slate-200">
                        Internal
                      </label>
                      <Select value={bookingModalData.internalCoachProfileId?.toString() || 'none'} onValueChange={(val) => setBookingModalData({...bookingModalData, internalCoachProfileId: val && val !== 'none' ? Number(val) : null})}>
                        <SelectTrigger className="w-full h-10 rounded-xl border-slate-200 shadow-sm focus:ring-primary/20 text-[13px] font-medium">
                          <SelectValue placeholder="Select internal" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                          <SelectItem value="none">None</SelectItem>
                          {internalCoaches.filter(profile => profile.type === InternalCoachType.Internal && profile.isActive).map(profile => (
                            <SelectItem key={profile.id} value={profile.id.toString()} className="text-[13px] font-medium rounded-lg py-2">
                              <div className="flex items-center gap-2">
                                {profile.profilePictureUrl ? (
                                  <img src={profile.profilePictureUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
                                ) : (
                                  <div className="h-6 w-6 rounded-full bg-[#2a2e25] flex items-center justify-center text-[#88cc22] font-bold text-[10px] tracking-wider">
                                    {getInitials(profile.name)}
                                  </div>
                                )}
                                <span>{profile.name} <span className="text-muted-foreground ml-1">(Internal)</span></span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {(bookingModalData.status === 'Booked' || bookingModalData.status === 'Training') && (
                    <div className="grid grid-cols-1 gap-x-4 gap-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:col-span-2 sm:grid-cols-2 dark:border-white/10 dark:bg-[#323234]">
                      {bookingModalData.id && modalQuote && <div className={cn("rounded-xl border p-3 sm:col-span-2", modalQuote.covered ? "border-primary/25 bg-primary/5" : "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/20")}><div className="flex items-center justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Calculated total</p><p className="mt-1 text-xs text-muted-foreground">{modalQuote.covered ? modalQuote.lines.map(line => `${Number.isInteger(line.hours) ? line.hours : line.hours.toFixed(2)} hr × ₱${line.pricePerHour.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${line.pricingId})`).join(' + ') : `No ${modalRateType} rate covers the complete schedule.`}</p></div><p className="shrink-0 text-base font-bold text-primary">{modalQuote.covered ? `₱${modalQuote.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}</p></div></div>}
                      
                      <CustomerCombobox value={bookingModalData.customerId} onSelect={customer => setBookingModalData({...bookingModalData, customerId: customer.id, bookedBy: customer.fullName, email: customer.email, phone: customer.phone || '', promoId: null})} onClear={() => setBookingModalData({...bookingModalData, customerId: null, bookedBy: '', email: '', phone: '', promoId: null})} />
                      <div className={cn("space-y-1.5", bookingModalData.status === 'Training' ? "" : "sm:col-span-2")}>
                        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider dark:text-slate-200">{bookingModalData.status === 'Training' ? 'Trainee *' : 'Booked By *'}</label>
                        <Input aria-invalid={!!scheduleErrors.bookedBy} value={bookingModalData.bookedBy} onChange={e => { setBookingModalData({...bookingModalData, customerId: null, bookedBy: e.target.value, promoId: null}); setScheduleErrors(v => ({...v, bookedBy: ''})); }} className={cn("h-10 text-[13px] bg-white", scheduleErrors.bookedBy && "field-invalid")} placeholder={bookingModalData.status === 'Training' ? "Trainee name" : "Customer name"} />
                        {scheduleErrors.bookedBy && <p className="field-error" role="alert">{scheduleErrors.bookedBy}</p>}
                      </div>

                      {bookingModalData.status === 'Training' && (
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider dark:text-slate-200">Coach</label>
                          <Select value={bookingModalData.internalCoachProfileId?.toString() || 'none'} onValueChange={(val) => setBookingModalData({...bookingModalData, internalCoachProfileId: val && val !== 'none' ? Number(val) : null})}>
                            <SelectTrigger className="w-full h-10 rounded-xl border-slate-200 shadow-sm focus:ring-primary/20 text-[13px] font-medium bg-white">
                              <SelectValue placeholder="Select coach" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                              <SelectItem value="none">None</SelectItem>
                              {internalCoaches.filter(profile => profile.type === InternalCoachType.Coach && profile.isActive).map(profile => (
                                <SelectItem key={profile.id} value={profile.id.toString()} className="text-[13px] font-medium rounded-lg py-2">
                                  <div className="flex items-center gap-2">
                                    {profile.profilePictureUrl ? (
                                      <img src={profile.profilePictureUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
                                    ) : (
                                      <div className="h-6 w-6 rounded-full bg-[#2a2e25] flex items-center justify-center text-[#88cc22] font-bold text-[10px] tracking-wider">
                                        {getInitials(profile.name)}
                                      </div>
                                    )}
                                    <span>{profile.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="space-y-1.5"><label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider dark:text-slate-200">Email (optional)</label><Input aria-invalid={!!scheduleErrors.email} type="email" value={bookingModalData.email} onChange={e => { setBookingModalData({...bookingModalData, customerId: null, email: e.target.value, promoId: null}); setScheduleErrors(v => ({...v, email: ''})); }} className={cn("h-10 text-[13px] bg-white", scheduleErrors.email && "field-invalid")} placeholder="name@example.com" />{scheduleErrors.email && <p className="field-error" role="alert">{scheduleErrors.email}</p>}</div>
                      <div className="space-y-1.5"><label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider dark:text-slate-200">Phone</label><Input value={bookingModalData.phone} onChange={e => setBookingModalData({...bookingModalData, customerId: null, phone: e.target.value, promoId: null})} className="h-10 text-[13px] bg-white" placeholder="Optional phone number" /></div>
                      {!bookingModalData.id && (
                        <div className="space-y-1.5"><label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider dark:text-slate-200">Promo Code (Optional)</label><Select value={bookingModalData.promoId?.toString() || 'none'} onValueChange={value => setBookingModalData({...bookingModalData, promoId: value !== 'none' ? Number(value) : null})}><SelectTrigger className="h-10 bg-white"><SelectValue placeholder="Select promo" /></SelectTrigger><SelectContent><SelectItem value="none">None</SelectItem>{modalPromoOptions.map((p) => (<SelectItem key={p.id} value={p.id.toString()}>{p.code} - {p.type === 'Percentage' ? `${p.value}%` : `₱${p.value}`} off{p.remainingUsesThisMonth != null ? ` · ${p.remainingUsesThisMonth} left this month` : ''}</SelectItem>))}</SelectContent></Select>{bookingModalData.customerId && customerPromosLoading && <p className="text-xs text-muted-foreground">Checking this customer’s promo usage…</p>}{bookingModalData.customerId && !customerPromosLoading && !modalPromoOptions.length && <p className="text-xs text-muted-foreground">No promos are currently available for this customer.</p>}{selectedLinkedPromo?.remainingUsesThisMonth != null && <p className="text-xs font-medium text-primary">{selectedLinkedPromo.remainingUsesThisMonth} use{selectedLinkedPromo.remainingUsesThisMonth === 1 ? '' : 's'} remaining this month · {Math.max(0, selectedLinkedPromo.remainingUsesThisMonth - scheduleBlocks.length)} after these {scheduleBlocks.length} schedule{scheduleBlocks.length === 1 ? '' : 's'}.</p>}</div>
                      )}
                      <div className="space-y-1.5"><label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider dark:text-slate-200">Payment *</label><Select value={bookingModalData.paymentStatus} onValueChange={(value: BookingStatus) => setBookingModalData({...bookingModalData, paymentStatus: value, amountPaid: value === BookingStatus.Paid ? '' : bookingModalData.amountPaid})}><SelectTrigger className="h-10 bg-white"><SelectValue placeholder="Select payment status" /></SelectTrigger><SelectContent><SelectItem value={BookingStatus.Paid}>Paid</SelectItem><SelectItem value={BookingStatus.Reserved}>Reservation</SelectItem></SelectContent></Select></div>
                      {bookingModalData.paymentStatus === BookingStatus.Reserved && <div className="space-y-1.5"><label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider dark:text-slate-200">Downpayment</label><Input aria-invalid={!!scheduleErrors.amountPaid} type="number" min="0" max={modalGrandTotal} step="0.01" value={bookingModalData.amountPaid} onChange={e => { setBookingModalData({...bookingModalData, amountPaid: e.target.value === '' ? '' : Number(e.target.value)}); setScheduleErrors(v => ({...v, amountPaid: ''})); }} className={cn("h-10 text-[13px] bg-white", scheduleErrors.amountPaid && "field-invalid")} placeholder="0" />{scheduleErrors.amountPaid && <p className="field-error" role="alert">{scheduleErrors.amountPaid}</p>}</div>}
                      {!bookingModalData.id && <><div className="sm:col-span-2"><label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider dark:text-slate-200">Paddle Rental</label><div className="mt-1.5 flex items-center justify-between rounded-xl border bg-white p-3 dark:bg-[#3a3a3c]"><div className="flex items-center gap-3"><PaddleIcon className="h-9 w-9" /><div><p className="text-sm font-semibold">Selkirk Paddle · ₱100 each</p><p className="text-xs text-muted-foreground">Charged once for the complete session.</p></div></div><div className="flex items-center rounded-lg border p-1"><button type="button" className="grid h-8 w-8 place-items-center rounded-md transition-colors hover:bg-accent disabled:opacity-40" disabled={bookingModalData.paddleRentalQuantity === 0} onClick={() => setBookingModalData({...bookingModalData, paddleRentalQuantity: Math.max(0, bookingModalData.paddleRentalQuantity - 1)})}><Minus className="h-4 w-4" /></button><span className="w-9 text-center text-sm font-bold">{bookingModalData.paddleRentalQuantity}</span><button type="button" className="grid h-8 w-8 place-items-center rounded-md transition-colors hover:bg-accent disabled:opacity-40" disabled={bookingModalData.paddleRentalQuantity === 50} onClick={() => setBookingModalData({...bookingModalData, paddleRentalQuantity: Math.min(50, bookingModalData.paddleRentalQuantity + 1)})}><Plus className="h-4 w-4" /></button></div></div></div><div className="sm:col-span-2 mt-1 rounded-xl border border-primary/25 bg-primary/5 p-4" aria-live="polite"><div className="space-y-2 border-b border-primary/15 pb-3 text-sm"><div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">Court booking ({scheduleBlocks.length} {scheduleBlocks.length === 1 ? 'block' : 'blocks'})</span><span className="font-semibold">₱{modalRawGrandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>{batchDiscount > 0 && <div className="flex items-center justify-between gap-4 text-emerald-600 dark:text-emerald-400"><span>Promo discount</span><span className="font-semibold">−₱{batchDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>}<div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">Paddle rentals × {bookingModalData.paddleRentalQuantity}</span><span className="font-semibold">₱{modalPaddleRentalFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div></div><div className="flex items-end justify-between gap-4 pt-3"><div><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total amount</p><p className="text-xs text-muted-foreground">Schedule and add-ons included</p></div><p className="text-xl font-bold text-primary">₱{modalGrandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div></div></>}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div data-slot="dialog-footer" className="p-4 sm:px-7 bg-slate-50 dark:bg-[#252527] border-t border-slate-100 dark:border-white/10 flex items-center justify-end gap-3 shrink-0 rounded-b-2xl">
            {bookingModalData?.id && user?.role === 'Admin' && <button data-modal-action="danger" type="button" className="mr-auto flex h-9 items-center gap-2 rounded-lg border border-red-200 bg-white px-4 text-[13px] font-semibold text-red-600 shadow-sm transition-colors hover:bg-red-50 dark:border-red-900/70 dark:bg-[#3a3a3c] dark:hover:bg-red-950/40" onClick={openDeleteConfirmation} disabled={savingBatch || bulkUpdateMutation.isPending || updateMutation.isPending}><Trash className="h-4 w-4" />Delete</button>}
            <button
              className="inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg h-9 px-4 text-[13px] font-semibold transition-[color,background-color,border-color,box-shadow,transform] duration-150 ease-out hover:-translate-y-px active:translate-y-0 active:scale-[.98] border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground dark:border-white/15 dark:bg-[#3a3a3c] dark:text-slate-100 dark:hover:bg-[#48484a] dark:hover:text-white" 
              onClick={() => setBookingModalData(null)}
              disabled={savingBatch || bulkUpdateMutation.isPending || updateMutation.isPending}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSchedule}
              disabled={savingBatch || bulkUpdateMutation.isPending || updateMutation.isPending}
              className="inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg h-9 px-4 text-[13px] font-semibold transition-[color,background-color,border-color,box-shadow,transform] duration-150 ease-out hover:-translate-y-px active:translate-y-0 active:scale-[.98] bg-primary hover:bg-primary/90 text-white shadow-sm"
            >
              {bookingModalData?.id ? 'Update Schedule' : 'Save Schedule'}
              {(savingBatch || bulkUpdateMutation.isPending || updateMutation.isPending) && <LoadingIndicator label="Saving schedule" />}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={open => { if (!open && !deleteMutation.isPending) { setDeleteTarget(null); setDeleteCredentials({ email: '', password: '' }); setDeleteError(''); } }}>
        <DialogContent className="schedule-form-modal sm:max-w-md p-0 bg-white dark:bg-[#252527] rounded-2xl border-slate-200 dark:border-white/10 shadow-2xl gap-0 overflow-hidden">
          <div className="px-6 pt-6 pb-2">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Delete schedule permanently?</DialogTitle>
              <DialogDescription className="text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                {deleteTarget ? <span className="font-medium text-slate-700 dark:text-slate-300 block mb-1">{formatAppDate(deleteTarget.date)} · {formatAppTime(deleteTarget.startTime)}–{formatAppTime(deleteTarget.endTime)}.</span> : ''}
                {deleteTarget?.hasLinkedBooking && 'The linked booking will also be permanently removed from the Bookings page. '}Confirm with the email and password of the administrator currently signed in. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <label htmlFor="delete-schedule-email" className="text-[12px] font-bold text-slate-700 uppercase tracking-wider dark:text-slate-200">Admin email</label>
                <Input id="delete-schedule-email" type="email" autoComplete="email" value={deleteCredentials.email} onChange={event => { setDeleteCredentials(current => ({ ...current, email: event.target.value })); setDeleteError(''); }} placeholder="Enter admin email" disabled={deleteMutation.isPending} className="h-10 text-[13px]" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="delete-schedule-password" className="text-[12px] font-bold text-slate-700 uppercase tracking-wider dark:text-slate-200">Password</label>
                <Input id="delete-schedule-password" type="password" autoComplete="current-password" value={deleteCredentials.password} onChange={event => { setDeleteCredentials(current => ({ ...current, password: event.target.value })); setDeleteError(''); }} placeholder="••••••••" onKeyDown={event => { if (event.key === 'Enter') handleDeleteSchedule(); }} disabled={deleteMutation.isPending} className="h-10 text-[13px]" />
              </div>
              {deleteError && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300" role="alert">{deleteError}</p>}
            </div>
          </div>
          <div data-slot="dialog-footer" className="p-4 sm:px-6 bg-slate-50 dark:bg-[#252527] border-t border-slate-100 dark:border-white/10 flex items-center justify-end gap-3 rounded-b-2xl">
            <button type="button" className="h-9 px-4 rounded-lg text-[13px] font-semibold border border-slate-200 dark:border-white/15 bg-white dark:bg-[#3a3a3c] text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-[#444446] transition-colors shadow-sm" onClick={() => setDeleteTarget(null)} disabled={deleteMutation.isPending}>Cancel</button>
            <button data-modal-action="danger" type="button" className="flex h-9 items-center gap-2 rounded-lg bg-red-600 px-4 text-[13px] font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-60" onClick={handleDeleteSchedule} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <LoadingIndicator label="Deleting schedule" />}Permanently delete
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Details Modal */}
      <Dialog open={!!viewModalData} onOpenChange={(open) => !open && setViewModalData(null)}>
        <DialogContent className="schedule-form-modal sm:max-w-[425px] p-0 bg-white text-slate-900 dark:bg-[#2c2c2e] dark:text-slate-100 rounded-xl border-slate-200 dark:border-white/10 shadow-xl gap-0 flex flex-col max-h-[90vh] overflow-hidden">
          <div className="px-6 pt-6 pb-2 shrink-0">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold tracking-tight text-slate-900">Schedule Details</DialogTitle>
              <DialogDescription className="text-[13px] text-slate-500 mt-1">
                Viewing details for the selected schedule.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-6 pb-6 overflow-y-auto custom-scrollbar flex-1">
            {viewModalData && (
              <div className="mt-4 space-y-6">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                    <CalendarIcon className="h-4 w-4 text-slate-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Date & Time</span>
                    <span className="text-[13px] font-bold text-slate-900">
                      {formatAppDate(viewModalData.date)} <br/>
                      <span className="text-slate-500 font-medium">
                        {formatAppTime(viewModalData.startTime)} - {formatAppTime(viewModalData.endTime)}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</label>
                    <div className="mt-1">
                      <span className={cn("inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold", STATUS_COLORS[viewModalData.status])}>
                        {getTimedStatus(viewModalData).label}
                      </span>
                    </div>
                  </div>
                  {(viewModalData.status === ScheduleStatus.Booked || viewModalData.status === ScheduleStatus.Training || viewModalData.status === ScheduleStatus.Requested) && <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment</label><div className="mt-1 flex items-center gap-2"><span className={cn("rounded-md px-2.5 py-1 text-xs font-bold shadow-sm", viewModalData.status === ScheduleStatus.Requested ? "bg-blue-600 text-white" : viewModalData.paymentStatus === BookingStatus.Paid ? "bg-emerald-600 text-white" : "bg-amber-500 text-white")}>{viewModalData.status === ScheduleStatus.Requested ? 'Awaiting confirmation' : viewModalData.paymentStatus === BookingStatus.Paid ? 'Paid' : 'Reservation'}</span>{viewModalData.status !== ScheduleStatus.Requested && viewModalData.paymentStatus !== BookingStatus.Paid && <span className="text-xs font-medium text-slate-600">₱{(viewModalData.amountPaid || 0).toLocaleString()} paid</span>}</div></div>}
                  
                  <div>
                    {viewModalData.status === ScheduleStatus.Training ? (
                      <>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trainee / Coach</label>
                        <div className="mt-1 p-3 rounded-lg bg-slate-50 border border-slate-100 min-h-[60px] flex flex-col gap-1">
                          <p className="text-[13px] font-medium text-slate-700">
                            <span className="text-slate-500 text-xs mr-2">Trainee:</span>{viewModalData.bookedBy || 'N/A'}
                          </p>
                          <p className="text-[13px] font-medium text-slate-700">
                            <span className="text-slate-500 text-xs mr-2">Coach:</span>
                            {(() => {
                              const coach = internalCoaches?.find((c: any) => c.id === viewModalData.internalCoachProfileId);
                              return coach ? coach.name : 'N/A';
                            })()}
                          </p>
                          {viewModalData.notes && (
                            <p className="text-[12px] text-slate-500 mt-2 pt-2 border-t border-slate-200">
                              <span className="font-semibold text-slate-400 uppercase text-[9px] block mb-0.5">Notes:</span>
                              {viewModalData.notes}
                            </p>
                          )}
                        </div>
                      </>
                    ) : viewModalData.status === ScheduleStatus.Internal ? (
                      <>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Internal / Notes</label>
                        <div className="mt-1 p-3 rounded-lg bg-slate-50 border border-slate-100 min-h-[60px]">
                          <p className="text-[13px] font-medium text-slate-700">
                            {(() => {
                              const coach = internalCoaches?.find((c: any) => c.id === viewModalData.internalCoachProfileId);
                              return coach ? coach.name : 'Unknown Internal';
                            })()}
                          </p>
                          {viewModalData.notes && (
                            <p className="text-[12px] text-slate-500 mt-2 pt-2 border-t border-slate-200">
                              <span className="font-semibold text-slate-400 uppercase text-[9px] block mb-0.5">Notes:</span>
                              {viewModalData.notes}
                            </p>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Booked By / Notes</label>
                        <div className="mt-1 p-3 rounded-lg bg-slate-50 border border-slate-100 min-h-[60px]">
                          <p className="text-[13px] font-medium text-slate-700">
                            {viewModalData.bookedBy || viewModalData.notes || 'No additional details provided.'}
                          </p>
                          {viewModalData.bookedBy && viewModalData.notes && (
                            <p className="text-[12px] text-slate-500 mt-2 pt-2 border-t border-slate-200">
                              <span className="font-semibold text-slate-400 uppercase text-[9px] block mb-0.5">Notes:</span>
                              {viewModalData.notes}
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div data-slot="dialog-footer" className="p-4 sm:px-6 bg-slate-50 dark:bg-[#252527] border-t border-slate-100 dark:border-white/10 flex justify-end gap-2">
            {!isStaff && viewModalData && viewModalData.status !== ScheduleStatus.Requested && getTimedStatus(viewModalData).phase === 'scheduled' && <button className="h-9 px-6 rounded-lg text-[13px] font-semibold bg-primary text-white" onClick={() => { setBookingModalData({ id: viewModalData.id, bookingId: viewModalData.bookingId, courtId: String(viewModalData.courtId), dateStr: viewModalData.date, startTimeStr: viewModalData.startTime, endTimeStr: viewModalData.endTime, status: viewModalData.status, notes: viewModalData.notes || '', bookedBy: viewModalData.bookedBy || '', email: viewModalData.email || '', phone: viewModalData.phone || '', paymentStatus: viewModalData.paymentStatus === BookingStatus.Paid ? BookingStatus.Paid : BookingStatus.Reserved, amountPaid: viewModalData.amountPaid || '', internalCoachProfileId: viewModalData.internalCoachProfileId || null, promoId: null, paddleRentalQuantity: 0, customerId: viewModalData.customerId || null }); setViewModalData(null); }}>Edit Details</button>}
            <button
              className="h-9 px-6 rounded-lg text-[13px] font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm transition-colors"
              onClick={() => setViewModalData(null)}
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}





