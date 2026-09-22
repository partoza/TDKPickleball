import { useState, useEffect } from 'react';
import { format, addDays, startOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, endOfWeek } from 'date-fns';
import { usePublicWeeklySchedules } from '@/hooks/useSchedule';
import { useCourts } from '@/hooks/useCourts';
import { ChevronLeftIcon as ChevronLeft, ChevronRightIcon as ChevronRight, CalendarDaysIcon as CalendarIcon, XMarkIcon as XIcon, CheckIcon } from '@heroicons/react/24/solid';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { STATUS_COLORS, STATUS_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Schedule, ScheduleStatus } from '@/types';
import AvailabilityChecker from '@/components/public/AvailabilityChecker';
import { Link } from 'react-router-dom';
import { getManilaDate, isPastManilaStart } from '@/lib/manila-time';

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
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const thisMonthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);

  return (
    <div className="w-[240px] p-1">
      <div className="flex justify-between items-center mb-4 gap-1">
         <Select
           value={String(viewDate.getMonth())}
           onValueChange={(value) => {
             const newDate = new Date(viewDate);
             newDate.setMonth(parseInt(value));
             // Don't allow going to past months
             const newMonthStart = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
             if (newMonthStart >= thisMonthStart) setViewDate(newDate);
           }}
         >
           <SelectTrigger className="h-8 w-[126px] border-0 bg-transparent px-2 text-xs font-semibold shadow-none"><SelectValue /></SelectTrigger>
           <SelectContent>{Array.from({length: 12}).map((_, i) => {
             const monthDate = new Date(viewDate.getFullYear(), i, 1);
             const isPastMonth = monthDate < thisMonthStart;
             return <SelectItem key={i} value={String(i)} disabled={isPastMonth}>{format(new Date(2000, i, 1), 'MMMM')}</SelectItem>;
           })}</SelectContent>
         </Select>
         
         <Select
           value={String(viewDate.getFullYear())}
           onValueChange={(value) => {
             const newDate = new Date(viewDate);
             newDate.setFullYear(parseInt(value));
             const newMonthStart = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
             if (newMonthStart >= thisMonthStart) setViewDate(newDate);
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
          const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
          const isPast = day < todayStart;
          
          return (
            <button
              key={day.toISOString()}
              onClick={() => !isPast && onSelect(day)}
              disabled={isPast}
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-[12px] font-medium transition-colors",
                isPast && "text-slate-200 cursor-not-allowed",
                !isPast && !isCurrentMonth && "text-slate-300",
                !isPast && isCurrentMonth && !isSelected && !isToday && "text-slate-700 hover:bg-slate-100",
                !isPast && isToday && !isSelected && "bg-slate-100 text-primary font-bold",
                isSelected && !isPast && "bg-primary text-primary-foreground font-bold shadow-sm"
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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [clock, setClock] = useState(Date.now());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const { data: courtsRes, isLoading: courtsLoading, isError: courtsError } = useCourts();
  const courts = courtsRes?.data || [];
  
  const [selectedCourt, setSelectedCourt] = useState<string>('');

  // Inline slot selection (no modal)
  type SelectedSlot = { key: string; courtId: string; date: string; startTime: string; endTime: string };
  const [pickedSlots, setPickedSlots] = useState<SelectedSlot[]>([]);
  const RATE_PER_HOUR = 320;
  const MAX_SLOTS = 6;

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setPickedSlots(current => current.filter(slot => !isPastManilaStart(slot.date, slot.startTime, new Date(clock))));
  }, [clock]);

  useEffect(() => {
    if (courts.length > 0 && !selectedCourt) {
      setSelectedCourt(courts[0].id.toString());
    }
  }, [courts, selectedCourt]);

  const activeCourtId = selectedCourt;
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });

  // Reset picks when court or week changes
  useEffect(() => { setPickedSlots([]); }, [activeCourtId, weekStart.getTime()]);

  const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  const isCurrentWeek = weekStart <= thisWeekStart;

  const prevWeek = () => { if (!isCurrentWeek) setCurrentDate(addDays(currentDate, -7)); };
  const nextWeek = () => setCurrentDate(addDays(currentDate, 7));
  const today = () => setCurrentDate(new Date());

  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
  const weekDaysStrs = weekDays.map(d => format(d, 'yyyy-MM-dd'));

  const { data: weeklyBoardData } = usePublicWeeklySchedules(weekDaysStrs);

  const weekSchedules: Schedule[] = [];
  if (weeklyBoardData) {
    weeklyBoardData.forEach(dayBoard => {
      if (dayBoard && dayBoard.courts) {
        const courtData = dayBoard.courts.find(c => c.court.id.toString() === activeCourtId);
        if (courtData && courtData.schedules) {
          weekSchedules.push(...courtData.schedules);
        }
      }
    });
  }

  const toggleSlot = (date: string, startTime: string, endTime: string) => {
    const key = `${date}-${startTime}`;
    setPickedSlots(prev =>
      prev.find(s => s.key === key)
        ? prev.filter(s => s.key !== key)
        : prev.length < MAX_SLOTS
          ? [...prev, { key, courtId: activeCourtId, date, startTime, endTime }]
          : prev
    );
  };

  const totalAmount = pickedSlots.length * RATE_PER_HOUR;

  return (
    <div className="space-y-6 max-w-[1600px] w-full mx-auto px-4 sm:px-6 pt-12 md:pt-16 pb-12">
      
      {/* Header */}
      <div className="mb-6 pl-1">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Live availability</p>
        <h1 className="text-[28px] font-bold tracking-tight text-slate-900 mt-2">Court Schedule</h1>
        <p className="text-[14px] text-slate-500 mt-2 leading-relaxed max-w-[600px]">
          A clear, real-time view of every court and session for the entire week.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-6">
        
        {/* Navigation & Filters Toolbar */}
        <div className="grid gap-5 border-b border-slate-100 pb-5 mb-6 md:mb-8 md:pb-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
          
          <div className="flex flex-col sm:flex-row flex-wrap items-end gap-4 md:gap-5 w-full">
            
            <div className="flex flex-row items-end gap-3 sm:gap-4 md:gap-5 w-full sm:w-auto overflow-hidden">
              {/* Quick Jump */}
              <div className="flex min-w-0 flex-col gap-1.5 shrink-0">
                <label className="text-[10px] font-extrabold text-primary uppercase tracking-widest pl-0.5 block">Quick Jump</label>
                <button 
                  onClick={today} 
                  className="h-10 sm:h-9 px-4 sm:px-5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[13px] font-bold text-slate-700 shadow-sm transition-all"
                >
                  Today
                </button>
              </div>

              {/* Date Navigation */}
              <div className="flex min-w-0 flex-col gap-1.5 flex-1 sm:flex-none sm:shrink-0">
                <label className="text-[10px] font-extrabold text-primary uppercase tracking-widest pl-0.5 block">Week View</label>
                <div className="flex w-full items-center gap-1.5 sm:gap-2 sm:justify-start">
                  <button 
                    onClick={prevWeek} 
                    disabled={isCurrentWeek}
                    title="Previous week" 
                    className={cn(
                      "h-10 w-10 sm:h-9 sm:w-9 flex items-center justify-center shrink-0 rounded-lg border border-slate-200 bg-white shadow-sm transition-colors",
                      isCurrentWeek
                        ? "text-slate-200 cursor-not-allowed"
                        : "hover:bg-slate-50 text-slate-500"
                    )}
                  >
                    <ChevronLeft className="h-4 w-4 sm:h-4 sm:w-4" />
                  </button>

                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <button className="flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 sm:gap-2 rounded-lg border border-slate-200 bg-white px-2 shadow-sm transition-colors hover:bg-slate-50 sm:h-9 sm:flex-none sm:px-4">
                        <CalendarIcon className="h-4 w-4 shrink-0 text-slate-400 hidden sm:block" />
                        <span className="truncate text-[12px] sm:text-[13px] font-bold text-slate-700">
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
                    className="h-10 w-10 sm:h-9 sm:w-9 flex items-center justify-center shrink-0 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 shadow-sm transition-colors"
                  >
                    <ChevronRight className="h-4 w-4 sm:h-4 sm:w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Court Selection Tabs */}
            <div className="flex min-w-0 flex-col gap-1.5 w-full sm:w-auto sm:shrink-0 max-w-full">
              <label className="text-[10px] font-extrabold text-primary uppercase tracking-widest pl-0.5 block">Court</label>
              {courtsLoading ? (
                <div className="flex h-10 w-full sm:w-[200px] items-center gap-2 rounded-lg border border-slate-200 bg-slate-100/80 p-1 sm:h-9" aria-label="Loading courts">
                  <span className="h-7 flex-1 animate-pulse rounded-md bg-white/80" />
                  <span className="h-7 flex-1 animate-pulse rounded-md bg-white/60" />
                </div>
              ) : courts.length > 0 ? (
                <div className="flex w-full sm:inline-flex sm:w-auto h-10 max-w-full items-center gap-1 overflow-x-auto overflow-y-hidden rounded-lg border border-slate-200 bg-slate-100/80 p-1 custom-scrollbar sm:h-9">
                  {courts.map(c => (
                    <button 
                      key={c.id} 
                      type="button"
                      onClick={() => setSelectedCourt(c.id.toString())}
                      className={cn(
                        "h-8 flex-1 sm:flex-none sm:min-w-[88px] whitespace-nowrap rounded-md px-2 sm:px-4 text-[13px] font-bold transition-all sm:h-7",
                        selectedCourt === c.id.toString() 
                          ? "bg-white text-primary shadow-sm ring-1 ring-black/5" 
                          : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                      )}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex h-10 items-center rounded-lg border border-amber-200 bg-amber-50 px-3 text-xs font-semibold text-amber-700 sm:h-9">
                  {courtsError ? 'Courts are temporarily unavailable' : 'No active courts available'}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex w-full items-end sm:w-auto xl:justify-end">
            <AvailabilityChecker />
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
          <div className="min-w-full md:min-w-[950px] border border-slate-300 rounded-xl overflow-hidden bg-white">
            
            {/* Header Row */}
            <div className="grid grid-cols-[120px_1fr] md:grid-cols-[140px_repeat(7,1fr)] border-b border-slate-300 bg-slate-50/50">
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
                      "flex-col items-center py-4 border-l border-slate-300 relative transition-colors",
                      isToday ? "bg-primary/5" : "",
                      isSelectedDay ? "flex" : "hidden md:flex"
                    )}
                  >
                    {isToday && <div className="absolute top-0 left-0 right-0 h-1 bg-primary rounded-t-sm" />}
                    <span className={cn("text-[11px] font-bold uppercase tracking-widest mb-1", isToday ? "text-primary/70" : "text-slate-500")}>
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
                    <div key={timeStr} className="grid grid-cols-[120px_1fr] md:grid-cols-[140px_repeat(7,1fr)] group/row border-b border-slate-300 last:border-b-0">
                      
                      {/* Time Label */}
                      <div className="flex items-center justify-center border-r border-slate-300 bg-white p-1 px-2">
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
                              "border-l border-slate-300 p-1.5 h-[90px] relative transition-colors",
                              isToday && "bg-slate-50/40 dark:bg-white/[0.02]",
                              !slot && !isPastStart && "hover:bg-slate-50 dark:hover:bg-white/[0.04]",
                              !slot && isPastStart && "bg-slate-100/70 dark:bg-white/[0.03]",
                              isSelectedDay ? "block" : "hidden md:block"
                            )}
                          >
                            {slot ? (() => {
                              const timedStatus = getTimedStatus(slot);
                              return (
                              <div className={cn(
                                "w-full h-full rounded-xl border p-2.5 flex flex-col items-center justify-center overflow-hidden relative text-center gap-1",
                                STATUS_COLORS[slot.status],
                                "shadow-sm",
                                timedStatus.phase === 'ongoing' && "ring-2 ring-emerald-500 ring-offset-1",
                                timedStatus.phase === 'completed' && "brightness-75 saturate-50"
                              )}>
                                <span className="font-bold text-[11px] uppercase tracking-wider leading-tight w-full">{timedStatus.label}</span>
                              </div>
                              );
                            })() : (() => {
                              const key = `${dStr}-${timeStr}`;
                              const isSelected = !!pickedSlots.find(s => s.key === key);
                              const isMaxed = pickedSlots.length >= MAX_SLOTS && !isSelected;
                              // Calculate endTime directly (1 hour duration)
                              const startHour = parseInt(timeStr.split(':')[0], 10);
                              const endTime = startHour + 1 === 24 ? '00:00:00' : `${(startHour + 1).toString().padStart(2, '0')}:00:00`;
                              return (
                                <button
                                  disabled={isMaxed || isPastStart}
                                  onClick={() => !isMaxed && !isPastStart && toggleSlot(dStr, timeStr, endTime)}
                                  className={cn(
                                    "w-full h-full flex flex-col items-center justify-center rounded-xl border transition-all",
                                    isPastStart
                                      ? "cursor-not-allowed border-slate-200 border-dashed bg-slate-100/80 text-slate-400"
                                      : isSelected
                                      ? "bg-[#e8fbf4] border-[#00c881] shadow-sm"
                                      : isMaxed
                                        ? "border-slate-200 border-dashed opacity-40 cursor-not-allowed"
                                        : "border-dashed border-slate-200 hover:border-[#00c881]/50 hover:bg-[#e8fbf4]/40 group/cell"
                                  )}
                                >
                                  {isPastStart ? (
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Past</span>
                                  ) : isSelected ? (
                                    <div className="h-8 w-8 rounded-full bg-[#00c881] flex items-center justify-center shadow-sm">
                                      <CheckIcon className="h-4 w-4 text-white stroke-[2.5]" />
                                    </div>
                                  ) : (
                                    <span className="text-[10px] font-bold text-slate-300 group-hover/cell:text-[#00c881] uppercase tracking-widest text-center select-none transition-colors">
                                      Available
                                    </span>
                                  )}
                                </button>
                              );
                            })()}
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

      {/* ── Floating Selected Slots Bar ── */}
      {pickedSlots.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4 animate-in slide-in-from-bottom-3 duration-300">
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 px-7 py-6 flex items-center justify-between gap-4 relative">
            <button
              onClick={() => setPickedSlots([])}
              className="absolute right-4 top-4 cursor-pointer rounded-lg p-1.5 text-muted-foreground opacity-70 ring-offset-background transition-all duration-200 hover:opacity-100 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 active:scale-95 focus:outline-none"
            >
              <XIcon className="h-4 w-4 stroke-[2]" />
            </button>
            
            <div className="flex flex-col gap-1">
              <p className="text-[10.5px] font-bold text-slate-400/90 uppercase tracking-[0.1em] mb-0.5">Selected Slots</p>
              <div className="flex items-baseline mb-1">
                <span className="text-[26px] font-bold text-[#111827] leading-none tracking-tight">{pickedSlots.length}</span>
                <span className="text-[13px] text-[#8a99a8] font-medium ml-1.5">slots &nbsp;/ 6 max</span>
              </div>
              <p className="text-[13.5px] font-semibold text-[#111827]">
                Total: ₱{totalAmount.toLocaleString()}
              </p>
            </div>
            
            <div className="flex items-center shrink-0 pr-1 md:pr-2 mt-2">
              <Link to="/booking" state={{ pickedSlots }}>
                <button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-[38px] px-5 rounded-[8px] text-[13.5px] flex items-center gap-1.5 whitespace-nowrap transition-colors shadow-sm">
                  Proceed to Pay
                  <ChevronRight className="h-3.5 w-3.5 stroke-[2.5]" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
