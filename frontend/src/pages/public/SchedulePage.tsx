import { useEffect, useState } from 'react';
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

function PickleballDecoration() {
  return (
    <svg viewBox="0 0 320 320" className="h-full w-full" aria-hidden="true">
      <circle cx="160" cy="160" r="154" fill="#d9f900" />
      {[
        [100, 58], [188, 38], [252, 92], [110, 142], [200, 130],
        [270, 190], [154, 228], [76, 238], [228, 266],
      ].map(([cx, cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="16" fill="#72151d" opacity=".12" />)}
    </svg>
  );
}

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

  const timeColumnWidth = 220;
  const gridTemplateColumns = `${timeColumnWidth}px repeat(${Math.max(displayCourts.length, 1)}, minmax(200px, 1fr))`;
  const gridMinWidth = timeColumnWidth + Math.max(displayCourts.length, 1) * 200;
  const totalAmount = pickedSlots.length * 320;

  return <div className="min-h-[calc(100vh-64px)] bg-[#f4efe5] text-[#241f1d]">
    <section className="relative overflow-hidden border-b border-[#72151d]/15">
      <div className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 opacity-[0.1] sm:-right-36 sm:-top-36 sm:h-[34rem] sm:w-[34rem]"><PickleballDecoration /></div>
      <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-5 py-14 sm:px-8 sm:py-20 lg:flex-row lg:items-end lg:justify-between lg:px-10">
        <div className="max-w-3xl">
          <p className="mb-5 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.26em] text-[#72151d]"><span className="h-px w-10 bg-[#72151d]" /> Live court availability</p>
          <h1 className="text-[clamp(3.4rem,7vw,6.75rem)] font-black uppercase leading-[0.84] tracking-[-0.065em] text-[#72151d]">Pick a court.<br />Pick a time.</h1>
          <p className="mt-7 max-w-2xl text-base leading-7 text-[#5e5651] sm:text-lg sm:leading-8">Compare every court for one date, select any open time, and build your booking in a few taps.</p>
        </div>
        <Link to={ROUTES.TRAINING} className="group inline-flex h-12 w-full shrink-0 items-center justify-center gap-2 bg-[#72151d] px-6 text-sm font-bold text-white transition hover:bg-[#5f1118] sm:w-auto"><PaddleIcon className="h-5 w-5" white /> Explore training <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></Link>
      </div>
    </section>

    <section className="mx-auto max-w-[1600px] px-3 py-10 sm:px-6 sm:py-14 lg:px-10">
      {bookingThroughDate && <div className="mb-5 border border-[#72151d]/20 bg-[#fffdf8] px-5 py-4 text-sm font-semibold text-[#72151d]">Online bookings are open through {formatAppDate(bookingThroughDate)}.</div>}

      <div className="overflow-hidden border border-[#72151d]/20 bg-[#fffdf8]" aria-label={`Court availability for ${formatAppDate(currentDate)}`}>
        <div className="flex flex-col gap-5 border-b border-[#72151d]/20 p-5 sm:p-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[#72151d]">Schedule date</span>
            <div className="flex min-w-0 items-center gap-2">
              <button type="button" onClick={() => canGoBack && setCurrentDate(addDays(currentDate, -1))} disabled={!canGoBack} aria-label="Previous date" className="grid h-12 w-12 shrink-0 place-items-center border border-[#72151d]/20 text-[#72151d] transition hover:bg-[#f4efe5] disabled:cursor-not-allowed disabled:opacity-25"><ChevronLeft className="h-5 w-5" /></button>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}><PopoverTrigger asChild><button type="button" className="flex h-12 min-w-0 flex-1 items-center justify-center gap-2 border border-[#72151d]/20 bg-white px-4 text-[15px] font-bold text-[#241f1d] transition hover:bg-[#f4efe5] sm:min-w-[290px] sm:flex-none"><CalendarIcon className="h-4 w-4 shrink-0 text-[#72151d]" /><span className="truncate">{format(currentDate, 'EEE, MMM d, yyyy')}</span>{isToday && <span className="bg-[#72151d] px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white">Today</span>}</button></PopoverTrigger><PopoverContent className="w-auto rounded-none border-[#72151d]/20 bg-[#fffdf8] p-4 shadow-xl" align="center" sideOffset={8}><MiniCalendar currentDate={currentDate} bookingThroughDate={bookingThroughDate} onSelect={date => { setCurrentDate(date); setIsCalendarOpen(false); }} /></PopoverContent></Popover>
              <button type="button" onClick={() => canGoForward && setCurrentDate(addDays(currentDate, 1))} disabled={!canGoForward} aria-label="Next date" className="grid h-12 w-12 shrink-0 place-items-center border border-[#72151d]/20 text-[#72151d] transition hover:bg-[#f4efe5] disabled:cursor-not-allowed disabled:opacity-25"><ChevronRight className="h-5 w-5" /></button>
              {!isToday && <button type="button" onClick={() => setCurrentDate(new Date())} className="hidden h-12 border border-[#72151d]/20 px-4 text-sm font-bold text-[#72151d] hover:bg-[#f4efe5] sm:block">Today</button>}
            </div>
          </div>
          <div className="w-full lg:w-auto"><AvailabilityChecker /></div>
        </div>

        {courtsError || (!isLoading && displayCourts.length === 0) ? <div className="grid min-h-64 place-items-center px-6 text-center"><div><p className="font-bold text-[#241f1d]">{courtsError ? 'Courts are temporarily unavailable' : 'No active courts available'}</p><p className="mt-1 text-sm text-[#6b625d]">Please check again shortly.</p></div></div> : <div className="relative">
          {isLoading && <div className="pointer-events-none absolute left-1/2 top-6 z-30 -translate-x-1/2"><div className="flex items-center gap-3 border border-[#72151d]/20 bg-[#fffdf8]/95 px-5 py-2.5 shadow-lg backdrop-blur"><LoadingIndicator size="sm" className="text-[#72151d]" /><span className="text-xs font-bold text-[#241f1d]">Loading schedule</span></div></div>}
          <div className="overflow-x-auto custom-scrollbar"><div style={{ minWidth: `${gridMinWidth}px` }}>
            <div className="sticky top-0 z-20 grid border-b border-white/15 bg-[#72151d] text-white" style={{ gridTemplateColumns }}>
              <div className="sticky left-0 z-30 flex min-h-20 items-center border-r border-white/15 bg-[#72151d] px-5 text-xs font-bold uppercase tracking-[0.18em] text-[#d9f900]">Time</div>
              {displayCourts.map(court => <div key={court.id} className="flex min-h-20 flex-col items-center justify-center border-r border-white/15 px-4 text-center last:border-r-0"><span className="text-base font-bold">{court.displayName || court.name}</span><span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">Indoor court</span></div>)}
            </div>
            <div className="max-h-[680px] overflow-y-auto custom-scrollbar">{Array.from({ length: 17 }, (_, index) => index + 7).map(hour => {
              const startTime = `${String(hour).padStart(2, '0')}:00:00`;
              const endTime = hour + 1 === 24 ? '00:00:00' : `${String(hour + 1).padStart(2, '0')}:00:00`;
              return <div key={startTime} className="grid border-b border-[#241f1d]/10 last:border-b-0" style={{ gridTemplateColumns }}>
                <div className="sticky left-0 z-10 flex min-h-[88px] items-center border-r border-[#241f1d]/10 bg-[#f4efe5] px-5"><span className="whitespace-nowrap text-[15px] font-bold tracking-tight text-[#241f1d]">{formatHourLabel(hour)} to {formatHourLabel(hour + 1)}</span></div>
                {displayCourts.map(court => {
                  const courtId = String(court.id);
                  const record = scheduleAtHour(schedulesByCourt.get(courtId) || [], selectedDate, startTime);
                  const slot = record?.status === ScheduleStatus.Available ? undefined : record;
                  const isPast = isPastManilaStart(selectedDate, startTime, new Date(clock));
                  const key = `${courtId}-${selectedDate}-${startTime}`;
                  const isSelected = pickedSlots.some(picked => picked.key === key);
                  return <div key={`${courtId}-${startTime}`} className={cn('min-h-[88px] border-r border-[#241f1d]/10 p-2 last:border-r-0', !slot && !isPast && !isAfterBookingWindow && 'bg-[#fffdf8]', (isPast || isAfterBookingWindow) && !slot && 'bg-[#f4efe5]/60')}>
                    {isLoading ? <Skeleton className="h-full min-h-[68px] w-full rounded-none" /> : slot ? (() => { const timed = getTimedStatus(slot); return <div className={cn('flex h-full min-h-[68px] flex-col items-center justify-center border px-3 text-center', STATUS_COLORS[slot.status], timed.phase === 'ongoing' && 'ring-2 ring-[#d9f900] ring-offset-1', timed.phase === 'completed' && 'brightness-75 saturate-50')}><span className="text-[11px] font-bold uppercase tracking-wider">{timed.label}</span></div>; })() : <button type="button" disabled={isPast || isAfterBookingWindow} onClick={() => toggleSlot(courtId, startTime, endTime)} className={cn('flex h-full min-h-[68px] w-full items-center justify-center border text-[11px] font-bold uppercase tracking-[0.14em] transition', isSelected ? 'border-[#72151d] bg-[#d9f900]/45 text-[#72151d]' : isPast || isAfterBookingWindow ? 'cursor-not-allowed border-dashed border-[#241f1d]/10 text-[#241f1d]/25' : 'border-dashed border-[#72151d]/20 text-[#72151d]/55 hover:border-[#72151d] hover:bg-[#d9f900]/15 hover:text-[#72151d]')}>{isSelected ? <span className="flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-full bg-[#72151d] text-white"><CheckIcon className="h-4 w-4" /></span> Selected</span> : isPast ? 'Past' : isAfterBookingWindow ? 'Booking closed' : 'Available'}</button>}
                  </div>;
                })}
              </div>;
            })}</div>
          </div></div>
          <div className="border-t border-[#72151d]/20 bg-[#f4efe5] px-4 py-3 text-xs font-medium text-[#6b625d] sm:hidden">Swipe sideways to compare all courts.</div>
        </div>}
      </div>
    </section>

    {pickedSlots.length > 0 && <div className="fixed bottom-3 left-1/2 z-50 w-full max-w-2xl -translate-x-1/2 animate-in px-3 duration-300 slide-in-from-bottom-3 sm:bottom-6 sm:px-4"><div className="relative flex items-center justify-between gap-3 border border-white/15 bg-[#241f1d] px-5 py-4 text-white shadow-[0_12px_40px_rgb(0,0,0,0.25)] sm:px-7 sm:py-6"><button type="button" onClick={() => setPickedSlots([])} className="absolute right-2 top-2 p-1.5 text-white/50 transition hover:text-[#d9f900] sm:right-4 sm:top-4" aria-label="Clear selected slots"><XIcon className="h-4 w-4" /></button><div><p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#d9f900]">Selected slots</p><div className="flex items-baseline gap-1.5"><span className="text-2xl font-bold leading-none">{pickedSlots.length}</span><span className="text-xs font-medium text-white/55">slots</span></div><p className="mt-2 text-sm font-semibold">Total: ₱{totalAmount.toLocaleString()}</p></div><Link to={ROUTES.BOOKING} state={{ pickedSlots }} className="mr-1 mt-3 inline-flex h-11 items-center gap-1 bg-[#d9f900] px-4 text-xs font-bold text-[#241f1d] transition hover:bg-[#e4ff3b] sm:px-5 sm:text-sm"><span className="sm:hidden">Continue</span><span className="hidden sm:inline">Proceed to pay</span><ChevronRight className="h-4 w-4" /></Link></div></div>}
  </div>;
}
