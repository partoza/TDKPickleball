import { useState, useEffect } from 'react';
import { format, addDays, startOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, endOfWeek } from 'date-fns';
import { useAdminWeeklySchedules, useBulkUpdate, useDeleteSchedule, useUpdateSchedule } from '@/hooks/useSchedule';
import { useCourts } from '@/hooks/useCourts';
import { ChevronLeftIcon as ChevronLeft, ChevronRightIcon as ChevronRight, CalendarDaysIcon as CalendarIcon, PlusIcon as Plus, MinusIcon as Minus, MapPinIcon as MapPin, TrashIcon as Trash } from '@heroicons/react/24/solid';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { STATUS_COLORS, STATUS_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { BookingStatus, InternalCoachType, RateType, Schedule, ScheduleStatus } from '@/types';
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

function getWeekRangeString(start: Date, end: Date) {
  if (start.getFullYear() !== end.getFullYear()) {
    return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;
  }
  if (start.getMonth() !== end.getMonth()) {
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
  }
  return `${format(start, 'MMM d')} - ${format(end, 'd, yyyy')}`;
}

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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [clock, setClock] = useState(Date.now());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [bookingModalData, setBookingModalData] = useState<{ id?: string; dateStr: string; startTimeStr: string; endTimeStr: string; status: string; notes: string; bookedBy: string; email: string; phone: string; paymentStatus: BookingStatus; amountPaid: number | ''; internalCoachProfileId: number | null; promoId: number | null; paddleRentalQuantity: number } | null>(null);
  const [scheduleErrors, setScheduleErrors] = useState<Record<string, string>>({});
  const [scheduleBlocks, setScheduleBlocks] = useState<BookingBlockValue[]>([createBookingBlock()]);
  const [scheduleBlockErrors, setScheduleBlockErrors] = useState<BookingBlockErrors[]>([]);
  const [savingBatch, setSavingBatch] = useState(false);
  const [viewModalData, setViewModalData] = useState<Schedule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; date: string; startTime: string; endTime: string } | null>(null);
  const [deleteCredentials, setDeleteCredentials] = useState({ email: '', password: '' });
  const [deleteError, setDeleteError] = useState('');
  const bulkUpdateMutation = useBulkUpdate();
  const updateMutation = useUpdateSchedule();
  const deleteMutation = useDeleteSchedule();
  
  const { data: courtsRes } = useCourts();
  const courts = courtsRes?.data || [];
  const { data: ratesRes } = useRates();
  const rates = ratesRes?.data || [];
  const { internalCoaches, fetchInternalCoaches } = useInternalCoaches(); 
  const { promos, fetchPromos } = usePromos();
  useEffect(() => { fetchInternalCoaches(); fetchPromos(); }, [fetchInternalCoaches, fetchPromos]);
  const [selectedCourt, setSelectedCourt] = useState<string>('');

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (courts.length > 0 && !selectedCourt) {
      setSelectedCourt(courts[0].id.toString());
    }
  }, [courts, selectedCourt]);

  const activeCourtId = selectedCourt;

  const prevWeek = () => setCurrentDate(addDays(currentDate, -7));
  const nextWeek = () => setCurrentDate(addDays(currentDate, 7));
  const today = () => setCurrentDate(new Date());
  const getInitials = (name: string) => {
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
  const weekDaysStrs = weekDays.map(d => format(d, 'yyyy-MM-dd'));

  const { data: schedules } = useAdminWeeklySchedules(weekDaysStrs, activeCourtId);
  const weekSchedules = schedules || [];
  const modalRateType = bookingModalData?.status === 'Training' ? RateType.Training : RateType.Booking;
  const modalQuote = bookingModalData ? calculateRateQuote(rates, bookingModalData.startTimeStr, bookingModalData.endTimeStr, modalRateType) : null;
  
  let batchDiscount = 0;
  if (!bookingModalData?.id && bookingModalData?.promoId && promos) {
    const promo = promos.find((p: any) => p.id === bookingModalData.promoId);
    if (promo && isPromoAvailable(promo, modalRateType)) {
      const rawGrandTotal = bookingBlocksTotal(scheduleBlocks, rates, modalRateType);
      batchDiscount = promo.type === 'Percentage' ? (rawGrandTotal * (promo.value / 100)) : promo.value;
      if (batchDiscount > rawGrandTotal) batchDiscount = rawGrandTotal;
    }
  }
  const modalPaddleRentalFee = (bookingModalData?.paddleRentalQuantity || 0) * 100;
  const modalGrandTotal = bookingModalData?.id ? (modalQuote?.covered ? modalQuote.total : 0) : Math.max(0, bookingBlocksTotal(scheduleBlocks, rates, modalRateType) - batchDiscount + modalPaddleRentalFee);

  const openDeleteConfirmation = () => {
    if (!bookingModalData?.id || user?.role !== 'Admin') return;
    setDeleteTarget({ id: bookingModalData.id, date: bookingModalData.dateStr, startTime: bookingModalData.startTimeStr, endTime: bookingModalData.endTimeStr });
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
        toast.success('Schedule deleted');
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

    if (!activeCourtId) return;
    if (needsContact && bookingModalData.paymentStatus === BookingStatus.Reserved && Number(bookingModalData.amountPaid) < 0) errors.amountPaid = 'Reservation amount cannot be negative.';
    else if (needsContact && bookingModalData.paymentStatus === BookingStatus.Reserved && modalQuote?.covered && Number(bookingModalData.amountPaid) > modalQuote.total) errors.amountPaid = `Reservation amount cannot exceed the total of ₱${modalQuote.total.toLocaleString()}.`;
    if (needsContact && !modalQuote?.covered) errors.rate = 'No active rate covers the complete selected schedule.';
    if (!isValidTimeRange(bookingModalData.startTimeStr, bookingModalData.endTimeStr)) errors.endTimeStr = 'End time must be at least 1 hour after start time.';
    setScheduleErrors(errors);
    if (Object.keys(errors).length) return;
    const payload = {
      courtId: parseInt(activeCourtId),
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

  return (
    <div className="space-y-6 max-w-[1600px] w-full mx-auto px-4 sm:px-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="mb-6 pl-1">
        <h1 className="text-[28px] font-bold tracking-tight text-slate-900">Court Schedule</h1>
        <p className="text-[14px] text-slate-500 mt-2 leading-relaxed max-w-[600px]">
          Manage court availability, daily bookings, and coordinate upcoming time slots. Click any empty slot to add a new booking.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-6">
        
        {/* Navigation & Filters Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-6 md:mb-8 border-b border-slate-100 pb-5 md:pb-6">
          
          <div className="flex flex-wrap items-end gap-3 sm:gap-5">
            {/* Date Navigation */}
            <div className="flex flex-col gap-1.5 w-full sm:w-auto order-1 sm:order-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-0.5 block">Week View</label>
              <div className="flex items-center gap-1.5 sm:gap-2 w-full justify-between sm:justify-start">
                <button 
                  onClick={prevWeek} 
                  title="Previous week" 
                  className="h-10 w-10 sm:h-9 sm:w-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 shadow-sm transition-colors"
                >
                  <ChevronLeft className="h-4 w-4 sm:h-4 sm:w-4" />
                </button>

                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-10 sm:h-9 px-3.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm">
                      <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-[13px] font-semibold text-slate-700">
                        {getWeekRangeString(weekDays[0], weekDays[6])}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-4 rounded-xl shadow-xl border-slate-200 bg-white" align="center" sideOffset={8}>
                    <MiniCalendar 
                      currentDate={currentDate} 
                      onSelect={(d) => { setCurrentDate(d); setIsCalendarOpen(false); }}
                    />
                  </PopoverContent>
                </Popover>

                <button 
                  onClick={nextWeek} 
                  title="Next week" 
                  className="h-10 w-10 sm:h-9 sm:w-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 shadow-sm transition-colors"
                >
                  <ChevronRight className="h-4 w-4 sm:h-4 sm:w-4" />
                </button>
              </div>
            </div>

            {/* Quick Jump */}
            <div className="flex flex-col gap-1.5 flex-1 sm:flex-none order-2 sm:order-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-0.5 block">Quick Jump</label>
              <button 
                onClick={today} 
                className="h-10 sm:h-9 px-4 w-full rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[13px] font-semibold text-slate-700 shadow-sm transition-all"
              >
                Today
              </button>
            </div>

            {/* Court Selection */}
            <div className="flex flex-col gap-1.5 flex-1 sm:flex-none order-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-0.5 block">Court</label>
              {courts.length > 0 && (
                <Select value={selectedCourt} onValueChange={setSelectedCourt}>
                  <SelectTrigger className="w-full sm:w-[150px] h-10 sm:h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[13px] font-semibold text-slate-700 shadow-sm focus:ring-0 focus:ring-offset-0 data-[state=open]:border-primary data-[state=open]:text-primary transition-colors">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <SelectValue placeholder="Select Court" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                    {courts.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()} className="text-[13px] font-semibold rounded-lg cursor-pointer py-2">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Add Schedule Button */}
          <div className="w-full lg:w-auto mt-2 lg:mt-0">
            <button 
              onClick={() => {
                setScheduleBlocks([createBookingBlock({ courtId: activeCourtId, date: format(currentDate, 'yyyy-MM-dd') })]);
                setScheduleBlockErrors([]);
                setBookingModalData({
                  dateStr: format(currentDate, 'yyyy-MM-dd'),
                  startTimeStr: '07:00:00',
                  endTimeStr: '08:00:00',
                  status: 'Booked',
                  notes: '', bookedBy: '', email: '', phone: '', paymentStatus: BookingStatus.Paid, amountPaid: '', internalCoachProfileId: null, promoId: null, paddleRentalQuantity: 0
                });
              }}
              className="h-11 sm:h-9 w-full sm:px-5 rounded-lg bg-primary hover:bg-primary/90 text-white text-[14px] sm:text-[13px] font-semibold shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Schedule
            </button>
          </div>
        </div>

        {/* Mobile Day Selector */}
        <div className="md:hidden flex overflow-x-auto gap-2 mb-4 snap-x custom-scrollbar pb-2">
          {weekDays.map(date => {
            const isSelectedDay = format(date, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd');
            const isToday = format(date, 'yyyy-MM-dd') === getManilaDate(new Date(clock));
            return (
              <button 
                key={date.toISOString()}
                onClick={() => setCurrentDate(date)}
                className={cn(
                  "flex flex-col items-center justify-center min-w-[64px] h-[72px] rounded-xl border snap-center transition-all",
                  isSelectedDay 
                    ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                    : isToday 
                      ? "bg-primary/5 border-primary/20 text-primary"
                      : "bg-white border-slate-200 text-slate-600"
                )}
              >
                <span className={cn("text-[10px] font-bold uppercase tracking-wider mb-0.5", isSelectedDay ? "text-primary-foreground/80" : isToday ? "text-primary/70" : "text-slate-400")}>{format(date, 'EEE')}</span>
                <span className="text-xl font-medium leading-none">{format(date, 'd')}</span>
              </button>
            )
          })}
        </div>

        {/* Flush Schedule Grid */}
        <div className="overflow-x-auto custom-scrollbar">
          <div className="min-w-full md:min-w-[950px] border border-slate-200 rounded-xl overflow-hidden bg-white">
            
            {/* Header Row */}
            <div className="grid grid-cols-[120px_1fr] md:grid-cols-[140px_repeat(7,1fr)] border-b border-slate-200 bg-slate-50/50">
              <div className="flex items-center justify-center pb-2 pt-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time</span>
              </div>
              
              {weekDays.map(date => {
                const isSelectedDay = format(date, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd');
                const isToday = format(date, 'yyyy-MM-dd') === getManilaDate(new Date(clock));
                return (
                  <div 
                    key={date.toISOString()} 
                    className={cn(
                      "flex-col items-center py-4 border-l border-slate-200 relative transition-colors",
                      isToday ? "bg-primary/5" : "",
                      isSelectedDay ? "flex" : "hidden md:flex"
                    )}
                  >
                    {isToday && <div className="absolute top-0 left-0 right-0 h-1 bg-primary rounded-t-sm" />}
                    <span className={cn("text-[11px] font-bold uppercase tracking-widest mb-1", isToday ? "text-primary/70" : "text-slate-400")}>
                      {format(date, 'EEEE')}
                    </span>
                    <span className={cn("text-3xl font-light tracking-tight leading-none mb-1", isToday ? "text-primary font-medium" : "text-slate-900")}>
                      {format(date, 'd')}
                    </span>
                    <span className={cn("text-[11px] font-semibold", isToday ? "text-primary" : "text-slate-500")}>
                      {format(date, 'MMMM')}
                    </span>
                  </div>
                );
              })}
            </div>
            
            {/* Time Rows */}
            <div className="overflow-y-auto max-h-[650px] custom-scrollbar bg-white">
              <div className="flex flex-col">
                {Array.from({ length: 17 }).map((_, i) => {
                  const hour = i + 7; // 7 AM to 12 MN
                  const timeStr = `${hour.toString().padStart(2, '0')}:00:00`;
                  
                  const formatHourLabel = (h: number) => {
                    if (h === 12) return '12:00 NN';
                    if (h === 24 || h === 0) return '12:00 MN';
                    if (h < 12) return `${h}:00 AM`;
                    return `${h - 12}:00 PM`;
                  };
                  const displayTime = `${formatHourLabel(hour)} - ${formatHourLabel(hour + 1)}`;
                  return (
                    <div key={timeStr} className="grid grid-cols-[120px_1fr] md:grid-cols-[140px_repeat(7,1fr)] group/row border-b border-slate-200 last:border-b-0">
                      
                      {/* Time Label */}
                      <div className="flex items-center justify-center border-r border-slate-200 bg-white p-1 px-2">
                        <span className="text-[10px] sm:text-[11px] md:text-[12px] font-bold text-black dark:text-white transition-colors tracking-tight text-center">
                          {displayTime}
                        </span>
                      </div>
                      
                      {/* Slots for each day */}
                      {weekDays.map(date => {
                        const dStr = format(date, 'yyyy-MM-dd');
                         const scheduleRecord = weekSchedules.find(s => s.date === dStr && s.startTime === timeStr);
                         const slot = scheduleRecord?.status === ScheduleStatus.Available ? undefined : scheduleRecord;
                        const isSelectedDay = dStr === format(currentDate, 'yyyy-MM-dd');
                        const isToday = dStr === getManilaDate(new Date(clock));
                        const isPastStart = isPastManilaStart(dStr, timeStr, new Date(clock));
                        
                        return (
                          <div 
                            key={`${dStr}-${timeStr}`} 
                            className={cn(
                              "border-l border-slate-200 p-1.5 h-[90px] relative group/cell transition-colors",
                              isToday && "bg-slate-50/40 dark:bg-white/[0.02]",
                              !slot && !isPastStart && "hover:bg-slate-50 dark:hover:bg-white/[0.04] cursor-pointer",
                              !slot && isPastStart && "cursor-not-allowed bg-slate-100/70 dark:bg-white/[0.03]",
                              isSelectedDay ? "block" : "hidden md:block"
                            )}
                            onClick={() => {
                              if (!slot && !isPastStart) {
                                setScheduleBlocks([createBookingBlock({
                                  courtId: activeCourtId,
                                  date: dStr,
                                  startTime: timeStr.slice(0, 5),
                                  endTime: hour + 1 === 24 ? '00:00' : `${(hour + 1).toString().padStart(2, '0')}:00`,
                                })]);
                                setScheduleBlockErrors([]);
                                setBookingModalData({
                                  dateStr: dStr,
                                  startTimeStr: timeStr,
                                  endTimeStr: hour + 1 === 24 ? '00:00:00' : `${(hour + 1).toString().padStart(2, '0')}:00:00`,
                                  status: 'Booked',
                                  notes: '', bookedBy: '', email: '', phone: '', paymentStatus: BookingStatus.Paid, amountPaid: '', internalCoachProfileId: null, promoId: null, paddleRentalQuantity: 0
                                });
                              }
                            }}
                          >
                            {slot ? (() => {
                              const timedStatus = getTimedStatus(slot);
                              return (
                              <div className={cn(
                                "w-full h-full rounded-xl border p-2.5 flex flex-col items-center justify-center overflow-hidden relative group/booked text-center gap-1",
                                STATUS_COLORS[slot.status],
                                "shadow-sm",
                                timedStatus.phase === 'ongoing' && "ring-2 ring-emerald-500 ring-offset-1",
                                timedStatus.phase === 'completed' && "brightness-75 saturate-50"
                              )}>
                                <span className="font-bold text-[11px] uppercase tracking-wider leading-tight w-full">{timedStatus.label}</span>
                                {slot.status === ScheduleStatus.Training ? (
                                  <span className="text-[11px] opacity-90 font-medium w-full flex flex-col gap-0.5 overflow-hidden">
                                    <span className="truncate">{slot.bookedBy || 'No Trainee'}</span>
                                    {slot.internalCoachProfileId && internalCoaches && (() => {
                                      const coach = internalCoaches.find((c: any) => c.id === slot.internalCoachProfileId);
                                      return coach ? <span className="text-[9px] opacity-75 truncate">w/ {coach.name}</span> : null;
                                    })()}
                                  </span>
                                ) : slot.status === ScheduleStatus.Internal ? (
                                  <span className="text-[11px] truncate opacity-90 font-medium w-full">
                                    {internalCoaches.find(profile => profile.id === slot.internalCoachProfileId)?.name || 'No internal assigned'}
                                  </span>
                                ) : (
                                  (slot.bookedBy || slot.notes) && <span className="text-[11px] truncate opacity-90 font-medium w-full">{slot.bookedBy || slot.notes}</span>
                                )}
                                {/* Hover View Details Overlay */}
                                <div 
                                  className="absolute inset-0 bg-black/60 opacity-0 group-hover/booked:opacity-100 flex items-center justify-center transition-opacity rounded-xl cursor-pointer backdrop-blur-[1px]"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setViewModalData(slot);
                                  }}
                                >
                                  <span className="text-white text-[11px] font-bold tracking-wide">View Details</span>
                                </div>
                              </div>
                              );
                            })() : isPastStart ? (
                              <div className="flex h-full w-full items-center justify-center text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Past</div>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-opacity">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary shadow-sm border border-primary/20">
                                  <Plus className="h-4 w-4" />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

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
                      {format(new Date(bookingModalData.dateStr + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}
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
                      
                      <div className={cn("space-y-1.5", bookingModalData.status === 'Training' ? "" : "sm:col-span-2")}>
                        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider dark:text-slate-200">{bookingModalData.status === 'Training' ? 'Trainee *' : 'Booked By *'}</label>
                        <Input aria-invalid={!!scheduleErrors.bookedBy} value={bookingModalData.bookedBy} onChange={e => { setBookingModalData({...bookingModalData, bookedBy: e.target.value}); setScheduleErrors(v => ({...v, bookedBy: ''})); }} className={cn("h-10 text-[13px] bg-white", scheduleErrors.bookedBy && "field-invalid")} placeholder={bookingModalData.status === 'Training' ? "Trainee name" : "Customer name"} />
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

                      <div className="space-y-1.5"><label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider dark:text-slate-200">Email (optional)</label><Input aria-invalid={!!scheduleErrors.email} type="email" value={bookingModalData.email} onChange={e => { setBookingModalData({...bookingModalData, email: e.target.value}); setScheduleErrors(v => ({...v, email: ''})); }} className={cn("h-10 text-[13px] bg-white", scheduleErrors.email && "field-invalid")} placeholder="name@example.com" />{scheduleErrors.email && <p className="field-error" role="alert">{scheduleErrors.email}</p>}</div>
                      <div className="space-y-1.5"><label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider dark:text-slate-200">Phone</label><Input value={bookingModalData.phone} onChange={e => setBookingModalData({...bookingModalData, phone: e.target.value})} className="h-10 text-[13px] bg-white" placeholder="Optional phone number" /></div>
                      {!bookingModalData.id && (
                        <div className="space-y-1.5"><label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider dark:text-slate-200">Promo Code (Optional)</label><Select value={bookingModalData.promoId?.toString() || 'none'} onValueChange={value => setBookingModalData({...bookingModalData, promoId: value !== 'none' ? Number(value) : null})}><SelectTrigger className="h-10 bg-white"><SelectValue placeholder="Select promo" /></SelectTrigger><SelectContent><SelectItem value="none">None</SelectItem>{promos.filter((p) => isPromoAvailable(p, modalRateType)).map((p) => (<SelectItem key={p.id} value={p.id.toString()}>{p.code} - {p.type === 'Percentage' ? `${p.value}%` : `₱${p.value}`} off</SelectItem>))}</SelectContent></Select></div>
                      )}
                      <div className="space-y-1.5"><label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider dark:text-slate-200">Payment *</label><Select value={bookingModalData.paymentStatus} onValueChange={(value: BookingStatus) => setBookingModalData({...bookingModalData, paymentStatus: value, amountPaid: value === BookingStatus.Paid ? '' : bookingModalData.amountPaid})}><SelectTrigger className="h-10 bg-white"><SelectValue placeholder="Select payment status" /></SelectTrigger><SelectContent><SelectItem value={BookingStatus.Paid}>Paid</SelectItem><SelectItem value={BookingStatus.Reserved}>Reservation</SelectItem></SelectContent></Select></div>
                      {bookingModalData.paymentStatus === BookingStatus.Reserved && <div className="space-y-1.5"><label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider dark:text-slate-200">Reservation Amount</label><Input aria-invalid={!!scheduleErrors.amountPaid} type="number" min="0" max={modalGrandTotal} step="0.01" value={bookingModalData.amountPaid} onChange={e => { setBookingModalData({...bookingModalData, amountPaid: e.target.value === '' ? '' : Number(e.target.value)}); setScheduleErrors(v => ({...v, amountPaid: ''})); }} className={cn("h-10 text-[13px] bg-white", scheduleErrors.amountPaid && "field-invalid")} placeholder="0" />{scheduleErrors.amountPaid && <p className="field-error" role="alert">{scheduleErrors.amountPaid}</p>}</div>}
                      {!bookingModalData.id && <div className="sm:col-span-2"><label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider dark:text-slate-200">Paddle Rental</label><div className="mt-1.5 flex items-center justify-between rounded-xl border bg-white p-3 dark:bg-[#3a3a3c]"><div><p className="text-sm font-semibold">Selkirk Paddle · ₱100 each</p><p className="text-xs text-muted-foreground">Charged once for the complete session.</p></div><div className="flex items-center rounded-lg border p-1"><button type="button" className="grid h-8 w-8 place-items-center rounded-md transition-colors hover:bg-accent disabled:opacity-40" disabled={bookingModalData.paddleRentalQuantity === 0} onClick={() => setBookingModalData({...bookingModalData, paddleRentalQuantity: Math.max(0, bookingModalData.paddleRentalQuantity - 1)})}><Minus className="h-4 w-4" /></button><span className="w-9 text-center text-sm font-bold">{bookingModalData.paddleRentalQuantity}</span><button type="button" className="grid h-8 w-8 place-items-center rounded-md transition-colors hover:bg-accent disabled:opacity-40" disabled={bookingModalData.paddleRentalQuantity === 50} onClick={() => setBookingModalData({...bookingModalData, paddleRentalQuantity: Math.min(50, bookingModalData.paddleRentalQuantity + 1)})}><Plus className="h-4 w-4" /></button></div></div>{bookingModalData.paddleRentalQuantity > 0 && <p className="mt-2 text-right text-sm font-semibold text-primary">Paddle rental: ₱{modalPaddleRentalFee.toLocaleString()}</p>}</div>}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="p-4 sm:px-7 bg-slate-50 dark:bg-[#252527] border-t border-slate-100 dark:border-white/10 flex items-center justify-end gap-3 shrink-0 rounded-b-2xl">
            {bookingModalData?.id && user?.role === 'Admin' && <button type="button" className="mr-auto flex h-9 items-center gap-2 rounded-lg border border-red-200 bg-white px-4 text-[13px] font-semibold text-red-600 shadow-sm transition-colors hover:bg-red-50 dark:border-red-900/70 dark:bg-[#3a3a3c] dark:hover:bg-red-950/40" onClick={openDeleteConfirmation} disabled={savingBatch || bulkUpdateMutation.isPending || updateMutation.isPending}><Trash className="h-4 w-4" />Delete</button>}
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
        <DialogContent className="sm:max-w-md p-0 bg-white dark:bg-[#252527] rounded-2xl border-slate-200 dark:border-white/10 shadow-2xl gap-0 overflow-hidden">
          <div className="px-6 pt-6 pb-2">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Delete schedule permanently?</DialogTitle>
              <DialogDescription className="text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                {deleteTarget ? <span className="font-medium text-slate-700 dark:text-slate-300 block mb-1">{format(new Date(`${deleteTarget.date}T00:00:00`), 'MMMM d, yyyy')} · {format(new Date(`2000-01-01T${deleteTarget.startTime}`), 'h:mm a')}–{format(new Date(`2000-01-01T${deleteTarget.endTime}`), 'h:mm a')}.</span> : ''}
                Confirm with the email and password of the administrator currently signed in. This cannot be undone.
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
          <div className="p-4 sm:px-6 bg-slate-50 dark:bg-[#252527] border-t border-slate-100 dark:border-white/10 flex items-center justify-end gap-3 rounded-b-2xl">
            <button type="button" className="h-9 px-4 rounded-lg text-[13px] font-semibold border border-slate-200 dark:border-white/15 bg-white dark:bg-[#3a3a3c] text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-[#444446] transition-colors shadow-sm" onClick={() => setDeleteTarget(null)} disabled={deleteMutation.isPending}>Cancel</button>
            <button type="button" className="flex h-9 items-center gap-2 rounded-lg bg-red-600 px-4 text-[13px] font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-60" onClick={handleDeleteSchedule} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <LoadingIndicator label="Deleting schedule" />}Permanently delete
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Details Modal */}
      <Dialog open={!!viewModalData} onOpenChange={(open) => !open && setViewModalData(null)}>
        <DialogContent className="sm:max-w-[425px] p-0 bg-white rounded-xl border-slate-200 shadow-xl gap-0 flex flex-col max-h-[90vh] overflow-hidden">
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
                      {format(new Date(viewModalData.date + 'T00:00:00'), 'EEEE, MMMM d, yyyy')} <br/>
                      <span className="text-slate-500 font-medium">
                        {format(new Date(`2000-01-01T${viewModalData.startTime}`), 'h:mm a')} - {format(new Date(`2000-01-01T${viewModalData.endTime}`), 'h:mm a')}
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
                  {(viewModalData.status === ScheduleStatus.Booked || viewModalData.status === ScheduleStatus.Training) && <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment</label><div className="mt-1 flex items-center gap-2"><span className={cn("rounded-md px-2.5 py-1 text-xs font-bold shadow-sm", viewModalData.paymentStatus === BookingStatus.Paid ? "bg-emerald-600 text-white" : "bg-amber-500 text-white")}>{viewModalData.paymentStatus === BookingStatus.Paid ? 'Paid' : 'Reservation'}</span>{viewModalData.paymentStatus !== BookingStatus.Paid && <span className="text-xs font-medium text-slate-600">₱{(viewModalData.amountPaid || 0).toLocaleString()} paid</span>}</div></div>}
                  
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
          
          <div className="p-4 sm:px-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
            {viewModalData && getTimedStatus(viewModalData).phase === 'scheduled' && <button className="h-9 px-6 rounded-lg text-[13px] font-semibold bg-primary text-white" onClick={() => { setBookingModalData({ id: viewModalData.id, dateStr: viewModalData.date, startTimeStr: viewModalData.startTime, endTimeStr: viewModalData.endTime, status: viewModalData.status, notes: viewModalData.notes || '', bookedBy: viewModalData.bookedBy || '', email: viewModalData.email || '', phone: viewModalData.phone || '', paymentStatus: viewModalData.paymentStatus === BookingStatus.Paid ? BookingStatus.Paid : BookingStatus.Reserved, amountPaid: viewModalData.amountPaid || '', internalCoachProfileId: viewModalData.internalCoachProfileId || null, promoId: null, paddleRentalQuantity: 0 }); setViewModalData(null); }}>Edit Details</button>}
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





