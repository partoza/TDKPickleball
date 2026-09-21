import { useState } from 'react';
import { addMonths, eachDayOfInterval, endOfWeek, format, isBefore, isSameDay, parseISO, startOfMonth, startOfWeek } from 'date-fns';
import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export type TimeOption = { value: string; label: string; disabled?: boolean; meta?: string };

export function formatTimeLabel(value: string) {
  const [rawHour, minute = '00'] = value.slice(0, 5).split(':');
  const hour = Number(rawHour);
  const suffix = hour >= 12 && hour < 24 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute} ${suffix}`;
}

export function hourlyOptions(start = 7, end = 24): TimeOption[] {
  return Array.from({ length: Math.max(0, end - start + 1) }, (_, index) => {
    const hour = start + index;
    const value = `${String(hour % 24).padStart(2, '0')}:00`;
    return { value, label: formatTimeLabel(value) };
  });
}

export function AdminTimeSelect({ value, onChange, options, placeholder = 'Select time', invalid, disabled }: { value: string; onChange: (value: string) => void; options: TimeOption[]; placeholder?: string; invalid?: boolean; disabled?: boolean }) {
  const selectedOption = options.find(option => option.value === value);
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger aria-invalid={invalid} className={cn('h-10 w-full', invalid && 'field-invalid')}>
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
          <ClockIcon className="h-4 w-4 shrink-0 text-primary" />
          <span className={cn('min-w-0 flex-1 truncate text-left', !selectedOption && 'text-muted-foreground')}>{selectedOption?.label || placeholder}</span>
          {selectedOption?.meta && <span className={cn('shrink-0 text-[9px] font-bold uppercase tracking-wide', selectedOption.disabled ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400')}>{selectedOption.meta}</span>}
        </div>
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {options.map(option => (
          <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
            <span className="flex w-full items-center justify-between gap-5">
              <span>{option.label}</span>
              {option.meta && <span className={cn('text-[10px] font-semibold uppercase tracking-wide', option.disabled ? 'text-destructive/70' : 'text-emerald-600')}>{option.meta}</span>}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function AdminDatePicker({ value, onChange, minDate, invalid, displayRange, placeholder = 'Select date' }: { value: string; onChange: (value: string) => void; minDate?: Date; invalid?: boolean; displayRange?: 'day' | 'week' | 'month'; placeholder?: string }) {
  const selected = value ? parseISO(value) : new Date();
  const [month, setMonth] = useState(startOfMonth(selected));
  const [open, setOpen] = useState(false);
  const gridStart = startOfWeek(startOfMonth(month));
  const gridEnd = endOfWeek(new Date(month.getFullYear(), month.getMonth() + 1, 0));
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  let label = placeholder;
  if (value) {
    if (displayRange === 'week') {
      label = `${format(startOfWeek(selected), 'MMM d')} - ${format(endOfWeek(selected), 'MMM d, yyyy')}`;
    } else if (displayRange === 'month') {
      label = format(selected, 'MMMM yyyy');
    } else {
      label = format(selected, 'MMM d, yyyy');
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className={cn('h-10 w-full justify-start gap-2 bg-transparent px-3 font-normal shadow-sm', invalid && 'field-invalid')}>
          <CalendarDaysIcon className="h-4 w-4 shrink-0 text-primary" />
          <span>{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[292px] rounded-xl border-border p-3 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMonth(addMonths(month, -1))}><ChevronLeftIcon className="h-4 w-4" /></Button>
          <p className="text-[13px] font-semibold">{format(month, 'MMMM yyyy')}</p>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMonth(addMonths(month, 1))}><ChevronRightIcon className="h-4 w-4" /></Button>
        </div>
        <div className="grid grid-cols-7 text-center text-[10px] font-semibold uppercase text-muted-foreground">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => <span key={day} className="py-1">{day}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map(day => {
            const disabled = !!minDate && isBefore(day, new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate()));
            const active = isSameDay(day, selected);
            return <button key={day.toISOString()} type="button" disabled={disabled} onClick={() => { onChange(format(day, 'yyyy-MM-dd')); setOpen(false); }} className={cn('grid h-8 w-8 place-items-center rounded-md text-[12px] transition-colors hover:bg-primary/10 hover:text-primary disabled:pointer-events-none disabled:opacity-25', day.getMonth() !== month.getMonth() && 'text-muted-foreground/45', active && 'bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground')}>{format(day, 'd')}</button>;
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
