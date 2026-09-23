import { PlusIcon, TrashIcon } from '@heroicons/react/24/solid';
import { useAvailability } from '@/hooks/useBookings';
import { calculateRateQuote } from '@/lib/rate-calculation';
import { isValidTimeRange } from '@/lib/time-range';
import { BookingBlockErrors, BookingBlockValue, bookingBlocksTotal, createBookingBlock, getBookingBlockConflictErrors } from '@/lib/booking-blocks';
import { RateType } from '@/types';
import { AdminDatePicker, AdminTimeSelect, formatTimeLabel, TimeOption } from '@/components/admin/AdminFormControls';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { getManilaDateAsLocalDate, isPastManilaStart } from '@/lib/manila-time';
import { useEffect, useState } from 'react';

type Props = {
  blocks: BookingBlockValue[];
  onChange: (blocks: BookingBlockValue[]) => void;
  courts: any[];
  rates: any[];
  rateType: RateType;
  errors?: BookingBlockErrors[];
  showQuote?: boolean;
  addLabel?: string;
  discount?: number;
};

function ErrorText({ children }: { children?: string }) {
  return children ? <p className="field-error" role="alert">{children}</p> : null;
}

const timeMinutes = (value: string, midnightAsEnd = false) => {
  const [hour, minute] = value.slice(0, 5).split(':').map(Number);
  return midnightAsEnd && hour === 0 ? 1440 + minute : hour * 60 + minute;
};

function BookingBlockCard({ block, blocks, index, count, update, remove, courts, rates, rateType, errors = {}, showQuote, now }: any) {
  const { data: availabilityResponse, isFetching } = useAvailability(block.date, block.courtId);
  const available = availabilityResponse?.data?.availableSlots || [];
  const occupied = availabilityResponse?.data?.occupiedSlots || [];
  const selectedByAnotherBlock = (slot: any) => blocks.some((candidate: BookingBlockValue, candidateIndex: number) =>
    candidateIndex !== index && candidate.courtId === block.courtId && candidate.date === block.date && candidate.startTime && candidate.endTime
    && timeMinutes(slot.startTime) < timeMinutes(candidate.endTime, true)
    && timeMinutes(candidate.startTime) < timeMinutes(slot.endTime, true));
  const slots = [...available.map((slot: any) => ({ ...slot, occupied: false })), ...occupied.map((slot: any) => ({ ...slot, occupied: true }))]
    .map((slot: any) => ({ ...slot, selectedByAnotherBlock: selectedByAnotherBlock(slot) }))
    .sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));
  const startOptions: TimeOption[] = slots.map((slot: any) => {
    const past = isPastManilaStart(block.date, slot.startTime, new Date(now));
    return {
      value: slot.startTime.slice(0, 5),
      label: formatTimeLabel(slot.startTime),
      disabled: past || slot.occupied || slot.selectedByAnotherBlock,
      meta: past ? 'Past' : slot.selectedByAnotherBlock ? 'Selected' : slot.occupied ? 'Occupied' : 'Available',
    };
  });
  const startIndex = slots.findIndex((slot: any) => slot.startTime.slice(0, 5) === block.startTime);
  const endOptions: TimeOption[] = startIndex < 0 ? [] : slots.slice(startIndex).map((slot: any, offset: number) => {
    const value = slot.endTime.slice(0, 5);
    const selected = slots.slice(startIndex, startIndex + offset + 1).some((candidate: any) => candidate.selectedByAnotherBlock);
    const occupiedRange = slots.slice(startIndex, startIndex + offset + 1).some((candidate: any) => candidate.occupied);
    const blocked = !isValidTimeRange(block.startTime, value) || occupiedRange || selected;
    return { value, label: formatTimeLabel(slot.endTime), disabled: blocked, meta: selected ? 'Selected' : blocked ? 'Occupied' : 'Available' };
  });
  const quote = calculateRateQuote(rates, block.startTime, block.endTime, rateType);
  const set = (changes: Partial<BookingBlockValue>) => update(index, changes);

  return <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 shadow-sm sm:p-5 dark:border-white/10 dark:bg-[#323234]">
    <div className="mb-4 flex items-center justify-between gap-3">
      <h4 className="text-sm font-bold">Booking Block {index + 1}</h4>
      {count > 1 && <Button type="button" variant="ghost" size="icon" aria-label={`Remove Booking Block ${index + 1}`} onClick={() => remove(index)} className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><TrashIcon className="h-4 w-4" /></Button>}
    </div>
    <div className="grid gap-4">
      <div><Label>Court *</Label><Select value={block.courtId} onValueChange={courtId => set({ courtId, startTime: '', endTime: '' })}><SelectTrigger aria-invalid={!!errors.courtId} className={cn(errors.courtId && 'field-invalid')}><SelectValue placeholder="Select court" /></SelectTrigger><SelectContent>{courts.filter((court: any) => court.isActive).map((court: any) => <SelectItem key={court.id} value={String(court.id)}>{court.name}</SelectItem>)}</SelectContent></Select><ErrorText>{errors.courtId}</ErrorText></div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div><Label>Date *</Label><AdminDatePicker value={block.date} minDate={getManilaDateAsLocalDate(new Date(now))} invalid={!!errors.date} onChange={date => set({ date, startTime: '', endTime: '' })} /><ErrorText>{errors.date}</ErrorText></div>
        <div><Label>Start *</Label><AdminTimeSelect value={block.startTime} invalid={!!errors.startTime} disabled={!block.courtId || !block.date || isFetching} placeholder={isFetching ? 'Checking…' : 'Select start'} options={startOptions} onChange={startTime => set({ startTime, endTime: '' })} /><ErrorText>{errors.startTime}</ErrorText></div>
        <div><Label>End *</Label><AdminTimeSelect value={block.endTime} invalid={!!errors.endTime} disabled={!block.startTime || isFetching} placeholder="Select end" options={endOptions} onChange={endTime => set({ endTime })} /><ErrorText>{errors.endTime}</ErrorText></div>
      </div>
      {block.courtId && block.date && !isFetching && !slots.length && <p className="rounded-lg bg-primary/5 px-3 py-2 text-xs font-medium text-primary">No configured time slots are available for this court and date.</p>}
      {showQuote && block.startTime && block.endTime && <div><div className={cn('rounded-xl border p-3.5', quote.covered ? 'border-primary/25 bg-primary/5' : 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/20')}><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Calculated total</p><p className="mt-1 text-xs text-muted-foreground">{quote.covered ? quote.lines.map(line => `${Number.isInteger(line.hours) ? line.hours : line.hours.toFixed(2)} hr × ₱${line.pricePerHour.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`).join(' + ') : `No ${rateType} rate covers the complete time range.`}</p></div><p className="shrink-0 text-base font-bold text-primary">{quote.covered ? `₱${quote.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}</p></div></div><ErrorText>{errors.rate}</ErrorText></div>}
    </div>
  </section>;
}

export function BookingBlocksEditor({ blocks, onChange, courts, rates, rateType, errors = [], showQuote = true, addLabel = 'Add Another Booking', discount = 0 }: Props) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const update = (index: number, changes: Partial<BookingBlockValue>) => onChange(blocks.map((block, blockIndex) => blockIndex === index ? { ...block, ...changes } : block));
  const remove = (index: number) => onChange(blocks.filter((_, blockIndex) => blockIndex !== index));
  const grandTotal = bookingBlocksTotal(blocks, rates, rateType);
  const finalTotal = Math.max(0, grandTotal - discount);
  const conflictErrors = getBookingBlockConflictErrors(blocks);
  return <div className="space-y-4">
    {blocks.map((block, index) => <BookingBlockCard key={block.id || index} block={block} blocks={blocks} index={index} count={blocks.length} update={update} remove={remove} courts={courts} rates={rates} rateType={rateType} errors={{ ...errors[index], ...conflictErrors[index] }} showQuote={showQuote} now={now} />)}
    <Button type="button" variant="default" className="w-full font-bold" onClick={() => onChange([...blocks, createBookingBlock({ courtId: blocks.at(-1)?.courtId || '' })])}><PlusIcon className="mr-2 h-4 w-4 stroke-[2]" />{addLabel}</Button>
    {showQuote && (
      <div className="flex items-end justify-between px-1 pt-2" aria-live="polite">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total amount</p>
          <p className="text-[13px] text-muted-foreground">Combined total for {blocks.length} {blocks.length === 1 ? 'booking block' : 'booking blocks'}</p>
        </div>
        <div className="text-right">
          {discount > 0 ? (
            <div className="flex flex-col items-end gap-0.5">
              <p className="text-xs text-muted-foreground line-through">₱{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-[11px] text-emerald-600 font-semibold">-₱{discount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} discount</p>
              <p className="text-xl font-bold text-primary">₱{finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          ) : (
            <p className="shrink-0 text-xl font-bold text-primary">₱{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          )}
        </div>
      </div>
    )}
  </div>;
}
