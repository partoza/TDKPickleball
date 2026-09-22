import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, ClockIcon, ExclamationCircleIcon as AlertCircle, LightBulbIcon as Lightbulb, ChevronRightIcon as ChevronRight } from '@heroicons/react/24/solid';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useScheduleBoard } from '@/hooks/useSchedule';
import { ScheduleStatus } from '@/types';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { isValidTimeRange } from '@/lib/time-range';
import { startOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, endOfWeek } from 'date-fns';

const MiniCalendar = ({ currentDate, onSelect }: { currentDate: Date, onSelect: (d: Date) => void }) => {
  const [viewDate, setViewDate] = useState(currentDate);
  const start = startOfWeek(startOfMonth(viewDate), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(viewDate), { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start, end });

  return (
    <div className="w-[240px] p-1 bg-white">
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
          const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
          const todayStart = new Date(); todayStart.setHours(0,0,0,0);
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

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';

export default function AvailabilityChecker() {
  const [date, setDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState<string>('07:00:00');
  const [endTime, setEndTime] = useState<string>('08:00:00');
  const [hasChecked, setHasChecked] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState<string | null>(null);

  // We fetch the board for the selected date
  const dateStr = format(date, 'yyyy-MM-dd');
  const { data: response, isLoading, isFetching } = useScheduleBoard(dateStr);
  const board = response?.data;

  const handleCheck = () => {
    if (!isValidTimeRange(startTime, endTime)) return;
    setSelectedCourt(null);
    setHasChecked(true);
  };

  const fallbackTimeSlots = Array.from({ length: 17 }).map((_, i) => {
    const startHour = i + 7;
    const startStr = startHour === 24 ? '00:00:00' : `${startHour.toString().padStart(2, '0')}:00:00`;
    const endHour = startHour + 1;
    const endStr = endHour === 24 ? '00:00:00' : `${endHour.toString().padStart(2, '0')}:00:00`;
    return { startTime: startStr, endTime: endStr };
  });

  const slots = board?.timeSlots?.length ? board.timeSlots : fallbackTimeSlots;

  // Logic to find availability
  let availableCourts: string[] = [];
  let recommendation: { startTime: string, endTime: string, courts: string[] } | null = null;

  if (hasChecked && board && !isFetching) {
    const startIndex = board.timeSlots.findIndex(t => t.startTime === startTime);
    const endIndex = board.timeSlots.findIndex(t => t.endTime === endTime);

    if (startIndex !== -1 && endIndex !== -1 && startIndex <= endIndex) {
      board.courts.forEach(c => {
        let isAvailable = true;
        for (let i = startIndex; i <= endIndex; i++) {
          const tStr = board.timeSlots[i].startTime;
          const schedule = c.schedules.find(s => s.startTime === tStr);
          if (schedule && schedule.status !== ScheduleStatus.Available) {
            isAvailable = false;
            break;
          }
        }
        if (isAvailable) {
          availableCourts.push(c.court.name);
        }
      });
    }

    if (availableCourts.length === 0 && startIndex !== -1 && endIndex !== -1 && startIndex <= endIndex) {
      const duration = endIndex - startIndex;
      let offset = 1;
      while (offset < board.timeSlots.length) {
        // Check forward
        if (startIndex + offset + duration < board.timeSlots.length) {
          const potentialCourts = board.courts.filter(c => {
            let isAvail = true;
            for (let i = 0; i <= duration; i++) {
              const tStr = board.timeSlots[startIndex + offset + i].startTime;
              const schedule = c.schedules.find(s => s.startTime === tStr);
              if (schedule && schedule.status !== ScheduleStatus.Available) {
                isAvail = false;
                break;
              }
            }
            return isAvail;
          });
          if (potentialCourts.length > 0) {
            recommendation = {
              startTime: board.timeSlots[startIndex + offset].startTime,
              endTime: board.timeSlots[startIndex + offset + duration].endTime,
              courts: potentialCourts.map(c => c.court.name)
            };
            break;
          }
        }
        // Check backward
        if (startIndex - offset >= 0) {
          const potentialCourts = board.courts.filter(c => {
            let isAvail = true;
            for (let i = 0; i <= duration; i++) {
              const tStr = board.timeSlots[startIndex - offset + i].startTime;
              const schedule = c.schedules.find(s => s.startTime === tStr);
              if (schedule && schedule.status !== ScheduleStatus.Available) {
                isAvail = false;
                break;
              }
            }
            return isAvail;
          });
          if (potentialCourts.length > 0) {
            recommendation = {
              startTime: board.timeSlots[startIndex - offset].startTime,
              endTime: board.timeSlots[startIndex - offset + duration].endTime,
              courts: potentialCourts.map(c => c.court.name)
            };
            break;
          }
        }
        offset++;
      }
    }
  }

  const formatTimeLabel = (tStr: string) => {
    const d = new Date(`2000-01-01T${tStr}`);
    return format(d, 'h:mm a');
  };

  // Filter end time slots to only those AFTER the selected start time
  const startIndex = slots.findIndex(s => s.startTime === startTime);
  const endSlots = (startIndex !== -1 ? slots.slice(startIndex) : slots)
    .filter(slot => isValidTimeRange(startTime, slot.endTime));

  // Auto-adjust end time if it is before start time
  useEffect(() => {
    const sIndex = slots.findIndex(s => s.startTime === startTime);
    if (sIndex !== -1 && !isValidTimeRange(startTime, endTime)) {
      setEndTime(slots[sIndex].endTime);
    }
  }, [startTime, endTime, slots]);

  const bookingStateFor = (courtName: string, slotStart = startTime, slotEnd = endTime) => {
    const courtId = board?.courts.find(item => item.court.name === courtName)?.court.id;
    return {
      pickedSlots: [{
        key: `${dateStr}-${slotStart}`,
        courtId: courtId ? String(courtId) : '',
        date: dateStr,
        startTime: slotStart,
        endTime: slotEnd,
      }],
    };
  };

  return (
    <div className="flex flex-col gap-1.5 w-full sm:w-auto">
      <label className="text-[10px] font-extrabold text-primary uppercase tracking-widest pl-0.5 block">Check Availability</label>
      <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) setHasChecked(false); }}>
        <DialogTrigger asChild>
          <button className="h-10 sm:h-9 px-5 rounded-lg bg-primary hover:bg-primary/90 text-white text-[13px] font-bold shadow-sm transition-all flex items-center justify-center whitespace-nowrap">
            Check Now
          </button>
        </DialogTrigger>
      
      <DialogContent className="schedule-form-modal sm:max-w-[500px] p-0 bg-white text-slate-900 rounded-2xl border-slate-200 shadow-2xl gap-0 flex flex-col max-h-[90vh] overflow-hidden">
        <div className="px-6 pt-6 pb-2 sm:px-7 sm:pt-7 sm:pb-2 shrink-0">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              Check Availability
            </DialogTitle>
            <DialogDescription className="text-[13px] text-slate-500 mt-1">
              Instantly find open slots for your next game.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 sm:px-7 pb-6 overflow-y-auto custom-scrollbar flex-1">
          <div className="mt-4 space-y-5">
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-semibold h-11 border-slate-200 text-slate-700 rounded-xl shadow-sm">
                    <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                    {format(date, 'MMM d, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                  <MiniCalendar
                    currentDate={date}
                    onSelect={(d) => { if (d) { setDate(d); setHasChecked(false); } }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Start Time</label>
                <Select value={startTime} onValueChange={(t) => { setStartTime(t); setHasChecked(false); }}>
                  <SelectTrigger className="w-full h-11 rounded-xl border-slate-200 shadow-sm font-semibold text-slate-700">
                    <div className="flex items-center">
                      <ClockIcon className="mr-2 h-4 w-4 text-slate-400" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-lg max-h-[200px]">
                    {slots.map(s => (
                      <SelectItem key={s.startTime} value={s.startTime} className="text-[13px] font-medium rounded-lg py-2">
                        {formatTimeLabel(s.startTime)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">End Time</label>
                <Select value={endTime} onValueChange={(t) => { setEndTime(t); setHasChecked(false); }}>
                  <SelectTrigger className="w-full h-11 rounded-xl border-slate-200 shadow-sm font-semibold text-slate-700">
                    <div className="flex items-center">
                      <ClockIcon className="mr-2 h-4 w-4 text-slate-400" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-lg max-h-[200px]">
                    {endSlots.map(s => (
                      <SelectItem key={s.endTime} value={s.endTime} className="text-[13px] font-medium rounded-lg py-2">
                        {formatTimeLabel(s.endTime)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {hasChecked && !isFetching && board && (
              <div className="pt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                {availableCourts.length > 0 ? (
                  <div className="bg-white border border-emerald-100/80 rounded-xl p-4 shadow-sm flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* Header */}
                    <div className="flex items-center gap-2 px-1">
                      <p className="text-[10.5px] font-bold text-slate-400 uppercase tracking-widest">Available Slots</p>
                      <span className="ml-auto text-[11px] font-semibold text-slate-400">
                        {format(date, 'MMM d')} · {formatTimeLabel(startTime)}–{formatTimeLabel(endTime)}
                      </span>
                    </div>

                    {/* Selectable court rows */}
                    {availableCourts.map((court, idx) => {
                      const isSelected = selectedCourt === court;
                      return (
                        <button
                          key={idx}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          aria-label={`Select ${court}`}
                          onClick={() => setSelectedCourt(court)}
                          className={cn(
                            "group flex min-h-12 w-full items-center gap-3 rounded-xl border px-4 py-3 text-left outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2",
                            isSelected
                              ? "border-emerald-500 bg-emerald-50 shadow-[0_5px_16px_rgba(16,185,129,0.12)]"
                              : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50/40 hover:shadow-sm"
                          )}
                        >
                          <span className={cn(
                            "flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 bg-white transition-all duration-200",
                            isSelected
                              ? "border-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]"
                              : "border-slate-300 group-hover:border-emerald-400"
                          )}>
                            <span className={cn("h-2.5 w-2.5 rounded-full bg-emerald-500 transition-all duration-200", isSelected ? "scale-100 opacity-100" : "scale-0 opacity-0")} />
                          </span>
                          <span className={cn(
                            "text-[13.5px] font-semibold flex-1",
                            isSelected ? "text-emerald-800" : "text-slate-700"
                          )}>{court}</span>
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-wider",
                            isSelected ? "rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-700" : "text-slate-400"
                          )}>
                            {isSelected ? "Selected" : "Available"}
                          </span>
                        </button>
                      );
                    })}

                    {/* Book Now */}
                    <div className="w-full mt-1.5 flex flex-col items-center gap-2">
                      <Link to="/booking" state={selectedCourt ? bookingStateFor(selectedCourt) : undefined} className="w-full" onClick={(e) => { if (!selectedCourt) e.preventDefault(); }}>
                        <Button
                          disabled={!selectedCourt}
                          className={cn(
                            "w-full font-bold h-[38px] rounded-[10px] text-[13.5px] flex items-center justify-center gap-1.5 transition-all shadow-sm",
                            selectedCourt
                              ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                              : "bg-slate-50 text-slate-300 border border-slate-100"
                          )}
                        >
                          Book Now
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      {!selectedCourt && (
                        <span className="text-[11px] text-slate-400/80">Select a court above to continue</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="flex gap-3 bg-rose-50/50 border border-rose-200/60 rounded-xl p-4 shadow-sm relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500"></div>
                      <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-rose-900 font-bold">Fully Booked</p>
                        <p className="text-[13px] text-rose-700/90 mt-1 font-medium leading-relaxed">
                          We're completely full on <strong className="font-bold">{format(date, 'MMM d')}</strong> from <strong className="font-bold">{formatTimeLabel(startTime)}</strong> to <strong className="font-bold">{formatTimeLabel(endTime)}</strong>.
                        </p>
                      </div>
                    </div>

                    {recommendation && (
                      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 shadow-sm relative overflow-hidden flex flex-col gap-3">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                        <div className="flex gap-3">
                          <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[10px] font-extrabold text-primary uppercase tracking-widest mb-1.5">Recommendation</p>
                            <p className="text-[13px] text-slate-800 font-medium leading-relaxed">
                              How about <strong className="text-primary font-bold">{formatTimeLabel(recommendation.startTime)} - {formatTimeLabel(recommendation.endTime)}</strong> instead?
                            </p>
                            <p className="text-[12px] text-slate-600 mt-0.5">
                              {recommendation.courts.join(', ')} {recommendation.courts.length === 1 ? 'is' : 'are'} available.
                            </p>
                          </div>
                        </div>
                        <Link to="/booking" state={bookingStateFor(recommendation.courts[0], recommendation.startTime, recommendation.endTime)} className="block w-full mt-1">
                          <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-10 rounded-lg shadow-sm">
                            Book Recommended Slot
                          </Button>
                        </Link>
                      </div>
                    )}
                    
                    {!recommendation && (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm text-center">
                        <p className="text-[13px] text-slate-500 font-medium">
                          Unfortunately, we couldn't find any alternative slots for this exact duration today. Please try checking another date.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 sm:px-7 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0 rounded-b-2xl">
          <button 
            className="h-10 px-4 rounded-xl text-[13px] font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-sm" 
            onClick={() => setIsOpen(false)}
          >
            Close
          </button>
          <button 
            onClick={handleCheck}
            disabled={isLoading || isFetching || !isValidTimeRange(startTime, endTime)}
            className="h-10 px-6 rounded-xl text-[13px] font-bold bg-primary hover:bg-primary/90 text-white shadow-sm transition-colors flex items-center gap-2"
          >
            {isLoading || (hasChecked && isFetching) ? 'Checking...' : 'Check'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
    </div>
  );
}
