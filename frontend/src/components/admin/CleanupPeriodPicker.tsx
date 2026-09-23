import { useState } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  isSameDay,
  isSameWeek,
  parseISO,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns';
import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { getManilaDateAsLocalDate } from '@/lib/manila-time';

export type CleanupGranularity = 'day' | 'week' | 'month' | 'year';

export function cleanupPeriodBounds(mode: CleanupGranularity, anchor: string) {
  const day = parseISO(anchor);
  const start = mode === 'week' ? startOfWeek(day) : mode === 'month' ? startOfMonth(day) : mode === 'year' ? startOfYear(day) : day;
  const periodEnd = mode === 'week' ? endOfWeek(day) : mode === 'month' ? endOfMonth(day) : mode === 'year' ? endOfYear(day) : day;
  const today = getManilaDateAsLocalDate();
  const end = periodEnd > today ? today : periodEnd;
  return { start: format(start, 'yyyy-MM-dd'), end: format(end, 'yyyy-MM-dd') };
}

export function CleanupPeriodPicker({ mode, value, onChange }: { mode: CleanupGranularity; value: string; onChange: (date: string) => void }) {
  const selected = parseISO(value);
  const today = getManilaDateAsLocalDate();
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(startOfMonth(selected));
  const [viewYear, setViewYear] = useState(selected.getFullYear());
  const bounds = cleanupPeriodBounds(mode, value);
  const label = mode === 'day' ? format(selected, 'MMM d, yyyy')
    : mode === 'week' ? `${format(parseISO(bounds.start), 'MMM d')} – ${format(parseISO(bounds.end), 'MMM d, yyyy')}`
    : mode === 'month' ? format(selected, 'MMMM yyyy')
    : format(selected, 'yyyy');

  const choose = (date: Date) => {
    onChange(format(date, 'yyyy-MM-dd'));
    setOpen(false);
  };

  const calendarStart = startOfWeek(startOfMonth(viewMonth));
  const calendarEnd = endOfWeek(endOfMonth(viewMonth));
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const yearBlockStart = Math.floor(viewYear / 12) * 12;

  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild>
      <Button type="button" variant="outline" className="h-10 w-full justify-start gap-2 bg-transparent border border-input dark:border-white/10 px-3 font-normal shadow-sm hover:bg-transparent hover:text-accent-foreground">
        <CalendarDaysIcon className="h-4 w-4 shrink-0 text-primary" />
        <span className="truncate">{label}</span>
      </Button>
    </PopoverTrigger>
    <PopoverContent align="start" className="w-[292px] rounded-xl border-border p-3 shadow-xl">
      <div className="mb-3 flex items-center justify-between">
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => mode === 'year' ? setViewYear(yearBlockStart - 12) : setViewMonth(addMonths(viewMonth, mode === 'month' ? -12 : -1))}><ChevronLeftIcon className="h-4 w-4" /></Button>
        <p className="text-[13px] font-semibold">{mode === 'year' ? `${yearBlockStart}–${yearBlockStart + 11}` : mode === 'month' ? format(viewMonth, 'yyyy') : format(viewMonth, 'MMMM yyyy')}</p>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => mode === 'year' ? setViewYear(yearBlockStart + 12) : setViewMonth(addMonths(viewMonth, mode === 'month' ? 12 : 1))}><ChevronRightIcon className="h-4 w-4" /></Button>
      </div>
      {mode === 'month' ? <div className="grid grid-cols-3 gap-1.5">
        {Array.from({ length: 12 }, (_, month) => {
          const date = new Date(viewMonth.getFullYear(), month, 1);
          const active = selected.getFullYear() === date.getFullYear() && selected.getMonth() === month;
          return <button key={month} type="button" disabled={date > today} onClick={() => choose(date)} className={cn('rounded-lg px-2 py-2.5 text-xs font-medium transition-colors hover:bg-primary/10 hover:text-primary disabled:pointer-events-none disabled:opacity-25', active && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground')}>{format(date, 'MMM')}</button>;
        })}
      </div> : mode === 'year' ? <div className="grid grid-cols-3 gap-1.5">
        {Array.from({ length: 12 }, (_, offset) => {
          const year = yearBlockStart + offset;
          const date = new Date(year, 0, 1);
          return <button key={year} type="button" disabled={date > today} onClick={() => choose(date)} className={cn('rounded-lg px-2 py-2.5 text-xs font-medium transition-colors hover:bg-primary/10 hover:text-primary disabled:pointer-events-none disabled:opacity-25', selected.getFullYear() === year && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground')}>{year}</button>;
        })}
      </div> : <>
        <div className="grid grid-cols-7 text-center text-[10px] font-semibold uppercase text-muted-foreground">{['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => <span key={day} className="py-1">{day}</span>)}</div>
        <div className="grid grid-cols-7 gap-1">{days.map(day => {
          const active = mode === 'week' ? isSameWeek(day, selected) : isSameDay(day, selected);
          const disabled = day > today;
          return <button key={day.toISOString()} type="button" disabled={disabled} onClick={() => choose(day)} className={cn('grid h-8 w-8 place-items-center rounded-md text-xs transition-colors hover:bg-primary/10 hover:text-primary disabled:pointer-events-none disabled:opacity-25', day.getMonth() !== viewMonth.getMonth() && 'text-muted-foreground/45', active && 'bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground')}>{format(day, 'd')}</button>;
        })}</div>
      </>}
    </PopoverContent>
  </Popover>;
}
