import { type CSSProperties, useEffect, useState } from 'react';
import { addDays, eachDayOfInterval, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from 'date-fns';
import { Link } from 'react-router-dom';
import { ArrowRightIcon, CalendarDaysIcon as CalendarIcon, CheckIcon, ChevronLeftIcon as ChevronLeft, ChevronRightIcon as ChevronRight, XMarkIcon as XIcon } from '@heroicons/react/24/solid';
import { usePublicBookingWindow, useScheduleBoard } from '@/hooks/useSchedule';
import { useCourts } from '@/hooks/useCourts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import AvailabilityChecker from '@/components/public/AvailabilityChecker';
import { PaddleIcon } from '@/components/ui/paddle-icon';
import { PickleballAccent } from '@/components/public/PickleballAccent';
import { ROUTES, STATUS_COLORS, STATUS_LABELS } from '@/lib/constants';
import { formatAppDate } from '@/lib/date-time';
import { getManilaDate, isPastManilaStart } from '@/lib/manila-time';
import { cn } from '@/lib/utils';
import { Schedule, ScheduleStatus } from '@/types';

type SelectedSlot = { key: string; courtId: string; date: string; startTime: string; endTime: string };

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

function scheduleAtHour(schedules: Schedule[], date: string, time: string) {
  const minute = toMinutes(time);
  return schedules.find(schedule => {
    if (schedule.date !== date) return false;
    const start = toMinutes(schedule.startTime);
    const rawEnd = toMinutes(schedule.endTime);
    const end = rawEnd <= start ? rawEnd + 1440 : rawEnd;
    return minute >= start && minute < end;
  });
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

const MiniCalendar = ({ currentDate, onSelect, bookingThroughDate }: { currentDate: Date; onSelect: (date: Date) => void; bookingThroughDate?: string | null }) => {
  const [viewDate, setViewDate] = useState(currentDate);
  const start = startOfWeek(startOfMonth(viewDate), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(viewDate), { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start, end });
  const todayStart = new Date(`${getManilaDate()}T00:00:00`);
  const thisMonthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);

  return <div className="w-[240px] p-1">
    <div className="mb-4 flex items-center justify-between gap-1">
      <Select value={String(viewDate.getMonth())} onValueChange={value => {
        const next = new Date(viewDate); next.setMonth(Number(value));
        if (new Date(next.getFullYear(), next.getMonth(), 1) >= thisMonthStart) setViewDate(next);
      }}>
        <SelectTrigger className="h-8 w-[126px] border-0 bg-transparent px-2 text-xs font-semibold shadow-none"><SelectValue /></SelectTrigger>
        <SelectContent>{Array.from({ length: 12 }, (_, month) => <SelectItem key={month} value={String(month)} disabled={new Date(viewDate.getFullYear(), month, 1) < thisMonthStart}>{format(new Date(2000, month, 1), 'MMMM')}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={String(viewDate.getFullYear())} onValueChange={value => {
        const next = new Date(viewDate); next.setFullYear(Number(value));
        if (new Date(next.getFullYear(), next.getMonth(), 1) >= thisMonthStart) setViewDate(next);
      }}>
        <SelectTrigger className="h-8 w-[84px] border-0 bg-transparent px-2 text-xs font-semibold shadow-none"><SelectValue /></SelectTrigger>
        <SelectContent>{Array.from({ length: 10 }, (_, index) => { const year = new Date().getFullYear() - 2 + index; return <SelectItem key={year} value={String(year)}>{year}</SelectItem>; })}</SelectContent>
      </Select>
    </div>
    <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">{['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => <div key={day}>{day}</div>)}</div>
    <div className="grid grid-cols-7 gap-1">{calendarDays.map(day => {
      const dayString = format(day, 'yyyy-MM-dd');
      const isSelected = dayString === format(currentDate, 'yyyy-MM-dd');
      const isToday = dayString === getManilaDate();
      const disabled = day < todayStart || (!!bookingThroughDate && dayString > bookingThroughDate);
      return <button key={day.toISOString()} type="button" disabled={disabled} onClick={() => !disabled && onSelect(day)} className={cn('flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors', disabled && 'cursor-not-allowed text-slate-200', !disabled && day.getMonth() !== viewDate.getMonth() && 'text-slate-300', !disabled && !isSelected && !isToday && 'text-slate-700 hover:bg-slate-100', !disabled && isToday && !isSelected && 'bg-slate-100 font-bold text-primary', isSelected && !disabled && 'bg-primary font-bold text-white shadow-sm')}>{format(day, 'd')}</button>;
    })}</div>
  </div>;
};

export default function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [clock, setClock] = useState(Date.now());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [pickedSlots, setPickedSlots] = useState<SelectedSlot[]>([]);
  const { data: courtsResponse, isLoading: courtsLoading, isError: courtsError } = useCourts();
  const courts = courtsResponse?.data || [];
  const { data: bookingWindowResponse } = usePublicBookingWindow();
  const bookingThroughDate = bookingWindowResponse?.data?.bookingThroughDate;
  const selectedDate = format(currentDate, 'yyyy-MM-dd');
  const { data: boardResponse, isLoading: scheduleLoading } = useScheduleBoard(selectedDate);
  const board = boardResponse?.data;
  const displayCourts = board?.courts.map(item => item.court) || courts;
  const schedulesByCourt = new Map((board?.courts || []).map(item => [String(item.court.id), item.schedules]));
  const isLoading = courtsLoading || scheduleLoading;
  const todayString = getManilaDate(new Date(clock));
  const isToday = selectedDate === todayString;
  const isAfterBookingWindow = !!bookingThroughDate && selectedDate > bookingThroughDate;
  const canGoBack = selectedDate > todayString;
  const canGoForward = !bookingThroughDate || selectedDate < bookingThroughDate;

  useEffect(() => { const timer = window.setInterval(() => setClock(Date.now()), 30_000); return () => window.clearInterval(timer); }, []);
  useEffect(() => { setPickedSlots(current => current.filter(slot => !isPastManilaStart(slot.date, slot.startTime, new Date(clock)))); }, [clock]);

  const toggleSlot = (courtId: string, startTime: string, endTime: string) => {
    if (isAfterBookingWindow) return;
    const key = `${courtId}-${selectedDate}-${startTime}`;
    setPickedSlots(current => current.some(slot => slot.key === key) ? current.filter(slot => slot.key !== key) : [...current, { key, courtId, date: selectedDate, startTime, endTime }]);
  };

  const courtColumnCount = Math.max(displayCourts.length, 1);
  const scheduleGridStyle = {
    '--schedule-mobile-columns': `82px repeat(${courtColumnCount}, minmax(0, 1fr))`,
    '--schedule-desktop-columns': `220px repeat(${courtColumnCount}, minmax(200px, 1fr))`,
    '--schedule-desktop-min-width': `${220 + courtColumnCount * 200}px`,
  } as CSSProperties;
  const totalAmount = pickedSlots.length * 320;

  return <div className="mx-auto w-full max-w-[1600px] space-y-5 overflow-x-hidden px-3 pb-16 pt-6 sm:px-6 sm:pt-12 md:pt-16">
    <div className="flex flex-col gap-4 px-1 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-4 sm:gap-5"><PickleballAccent className="mt-0.5 h-14 w-14 drop-shadow-[0_6px_14px_rgba(114,21,29,0.12)] sm:h-16 sm:w-16" /><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Live availability</p><h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">Court Schedule</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">Choose a date and compare every court at once. Tap any available slot to add it to your booking.</p></div></div>
      <Link to={ROUTES.TRAINING} className="group inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white shadow-md shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary/90 sm:w-auto"><PaddleIcon className="h-5 w-5" white /> Become a Trainee <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></Link>
    </div>
    {bookingThroughDate && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">Online bookings are open through {formatAppDate(bookingThroughDate)}.</div>}

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-label={`Court availability for ${formatAppDate(currentDate)}`}>
      <div className="flex flex-col gap-4 border-b border-slate-200 bg-white p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.14em] text-primary">Schedule date</span>
          <div className="flex min-w-0 items-center gap-2">
            <button type="button" onClick={() => canGoBack && setCurrentDate(addDays(currentDate, -1))} disabled={!canGoBack} aria-label="Previous date" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-200"><ChevronLeft className="h-5 w-5" /></button>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}><PopoverTrigger asChild><button type="button" className="flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[15px] font-bold text-slate-800 transition hover:bg-slate-50 sm:min-w-[280px] sm:flex-none"><CalendarIcon className="h-4 w-4 shrink-0 text-primary" /><span className="truncate">{format(currentDate, 'EEE, MMM d, yyyy')}</span>{isToday && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Today</span>}</button></PopoverTrigger><PopoverContent className="w-auto rounded-xl border-slate-200 bg-white p-4 shadow-xl" align="center" sideOffset={8}><MiniCalendar currentDate={currentDate} bookingThroughDate={bookingThroughDate} onSelect={date => { setCurrentDate(date); setIsCalendarOpen(false); }} /></PopoverContent></Popover>
            <button type="button" onClick={() => canGoForward && setCurrentDate(addDays(currentDate, 1))} disabled={!canGoForward} aria-label="Next date" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-200"><ChevronRight className="h-5 w-5" /></button>
            {!isToday && <button type="button" onClick={() => setCurrentDate(new Date())} className="hidden h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:block">Today</button>}
          </div>
        </div>
        <div className="w-full lg:w-auto"><AvailabilityChecker /></div>
      </div>

      {courtsError || (!isLoading && displayCourts.length === 0) ? <div className="grid min-h-64 place-items-center px-6 text-center"><div><p className="font-bold text-slate-800">{courtsError ? 'Courts are temporarily unavailable' : 'No active courts available'}</p><p className="mt-1 text-sm text-slate-500">Please check again shortly.</p></div></div> : <div className="relative">
        {isLoading && <div className="pointer-events-none absolute left-1/2 top-6 z-30 -translate-x-1/2"><div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white/95 px-5 py-2.5 shadow-lg backdrop-blur"><LoadingIndicator size="sm" className="text-primary" /><span className="text-xs font-bold text-slate-700">Loading schedule</span></div></div>}
        <div className="overflow-hidden sm:overflow-x-auto custom-scrollbar"><div className="min-w-0 sm:min-w-[var(--schedule-desktop-min-width)]" style={scheduleGridStyle}>
          <div className="sticky top-0 z-20 grid border-b border-slate-200 bg-slate-50 [grid-template-columns:var(--schedule-mobile-columns)] sm:[grid-template-columns:var(--schedule-desktop-columns)]">
            <div className="sticky left-0 z-30 flex min-h-14 items-center border-r border-slate-200 bg-slate-50 px-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 sm:min-h-20 sm:px-4 sm:text-xs sm:tracking-[0.16em]">Time</div>
            {displayCourts.map(court => <div key={court.id} className="flex min-h-14 min-w-0 flex-col items-center justify-center border-r border-slate-200 px-1 text-center last:border-r-0 sm:min-h-20 sm:px-4"><span className="w-full truncate text-xs font-bold text-slate-900 sm:text-base">{court.displayName || court.name}</span><span className="mt-0.5 text-[8px] font-semibold uppercase tracking-wide text-slate-400 sm:mt-1 sm:text-[11px] sm:tracking-wider">Indoor court</span></div>)}
          </div>
          <div className="max-h-[680px] overflow-y-auto custom-scrollbar">{Array.from({ length: 17 }, (_, index) => index + 7).map(hour => {
            const startTime = `${String(hour).padStart(2, '0')}:00:00`;
            const endTime = hour + 1 === 24 ? '00:00:00' : `${String(hour + 1).padStart(2, '0')}:00:00`;
            return <div key={startTime} className="grid border-b border-slate-200 last:border-b-0 [grid-template-columns:var(--schedule-mobile-columns)] sm:[grid-template-columns:var(--schedule-desktop-columns)]">
              <div className="sticky left-0 z-10 flex min-h-[68px] min-w-0 flex-col justify-center border-r border-slate-200 bg-white px-2 sm:min-h-[88px] sm:px-5"><span className="text-[10px] font-bold leading-tight tracking-tight text-slate-900 sm:hidden">{formatHourLabel(hour)}</span><span className="mt-0.5 text-[9px] font-semibold leading-tight text-slate-400 sm:hidden">to {formatHourLabel(hour + 1)}</span><span className="hidden whitespace-nowrap text-[15px] font-bold tracking-tight text-slate-900 sm:inline">{formatHourLabel(hour)} to {formatHourLabel(hour + 1)}</span></div>
              {displayCourts.map(court => {
                const courtId = String(court.id);
                const record = scheduleAtHour(schedulesByCourt.get(courtId) || [], selectedDate, startTime);
                const slot = record?.status === ScheduleStatus.Available ? undefined : record;
                const isPast = isPastManilaStart(selectedDate, startTime, new Date(clock));
                const key = `${courtId}-${selectedDate}-${startTime}`;
                const isSelected = pickedSlots.some(picked => picked.key === key);
                return <div key={`${courtId}-${startTime}`} className={cn('min-h-[68px] min-w-0 border-r border-slate-200 p-1 last:border-r-0 sm:min-h-[82px] sm:p-2', !slot && !isPast && !isAfterBookingWindow && 'bg-white hover:bg-emerald-50/40', (isPast || isAfterBookingWindow) && !slot && 'bg-slate-50')}>
                  {isLoading ? <Skeleton className="h-full min-h-[58px] w-full rounded-lg sm:min-h-[64px]" /> : slot ? (() => { const timed = getTimedStatus(slot); return <div className={cn('flex h-full min-h-[58px] flex-col items-center justify-center rounded-lg border px-1 text-center shadow-sm sm:min-h-[64px] sm:px-3', STATUS_COLORS[slot.status], timed.phase === 'ongoing' && 'ring-2 ring-emerald-500 ring-offset-1', timed.phase === 'completed' && 'brightness-75 saturate-50')}><span className="break-words text-[8px] font-bold uppercase leading-tight tracking-wide sm:text-[11px] sm:tracking-wider">{timed.label}</span></div>; })() : <button type="button" disabled={isPast || isAfterBookingWindow} onClick={() => toggleSlot(courtId, startTime, endTime)} className={cn('flex h-full min-h-[58px] w-full items-center justify-center rounded-lg border px-0.5 text-[8px] font-bold uppercase leading-tight tracking-wide transition sm:min-h-[64px] sm:text-[11px] sm:tracking-wider', isSelected ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' : isPast || isAfterBookingWindow ? 'cursor-not-allowed border-dashed border-slate-200 text-slate-300' : 'border-dashed border-slate-200 text-slate-400 hover:border-emerald-400 hover:text-emerald-600')}>{isSelected ? <span className="flex flex-col items-center gap-1 sm:flex-row sm:gap-2"><span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-500 text-white sm:h-6 sm:w-6"><CheckIcon className="h-3 w-3 sm:h-4 sm:w-4" /></span> Selected</span> : isPast ? 'Past' : isAfterBookingWindow ? 'Booking closed' : 'Available'}</button>}
                </div>;
              })}
            </div>;
          })}</div>
        </div></div>
      </div>}
    </section>

    {pickedSlots.length > 0 && <div className="fixed bottom-3 left-1/2 z-50 w-full max-w-2xl -translate-x-1/2 animate-in px-3 duration-300 slide-in-from-bottom-3 sm:bottom-6 sm:px-4"><div className="relative flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] sm:px-7 sm:py-6"><button type="button" onClick={() => setPickedSlots([])} className="absolute right-2 top-2 rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 sm:right-4 sm:top-4" aria-label="Clear selected slots"><XIcon className="h-4 w-4" /></button><div><p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Selected slots</p><div className="flex items-baseline gap-1.5"><span className="text-2xl font-bold leading-none text-slate-900">{pickedSlots.length}</span><span className="text-xs font-medium text-slate-500">slots</span></div><p className="mt-2 text-sm font-semibold text-slate-900">Total: ₱{totalAmount.toLocaleString()}</p></div><Link to={ROUTES.BOOKING} state={{ pickedSlots }} className="mr-1 mt-3 inline-flex h-10 items-center gap-1 rounded-lg bg-primary px-4 text-xs font-bold text-white shadow-sm transition hover:bg-primary/90 sm:px-5 sm:text-sm"><span className="sm:hidden">Continue</span><span className="hidden sm:inline">Proceed to Pay</span><ChevronRight className="h-4 w-4" /></Link></div></div>}
  </div>;
}
