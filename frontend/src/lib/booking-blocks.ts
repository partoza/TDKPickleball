import { RateType } from '@/types';
import { calculateRateQuote } from '@/lib/rate-calculation';
import { isValidTimeRange } from '@/lib/time-range';
import { getManilaDate, isPastManilaStart } from '@/lib/manila-time';

export type BookingBlockValue = {
  id: string;
  courtId: string;
  date: string;
  startTime: string;
  endTime: string;
};

export type BookingBlockErrors = Partial<Record<'courtId' | 'date' | 'startTime' | 'endTime' | 'rate', string>>;

export const createBookingBlock = (overrides: Partial<BookingBlockValue> = {}): BookingBlockValue => ({
  id: crypto.randomUUID(),
  courtId: '',
  date: getManilaDate(),
  startTime: '',
  endTime: '',
  ...overrides,
});

const minutes = (value: string, midnightAsEnd = false) => {
  const [hour, minute] = value.slice(0, 5).split(':').map(Number);
  return midnightAsEnd && hour === 0 ? 24 * 60 + minute : hour * 60 + minute;
};

export function validateBookingBlocks(
  blocks: BookingBlockValue[],
  rates: any[],
  rateType: RateType,
  options: { requireRate?: boolean } = {},
) {
  const requireRate = options.requireRate ?? true;
  const errors: BookingBlockErrors[] = blocks.map(() => ({}));
  const manilaToday = getManilaDate();

  blocks.forEach((block, index) => {
    const error = errors[index];
    if (!block.courtId) error.courtId = 'Select a court.';
    if (!block.date) error.date = 'Date is required.';
    else if (block.date < manilaToday) error.date = 'Booking date cannot be in the past.';
    if (!block.startTime) error.startTime = 'Select a start time.';
    else if (isPastManilaStart(block.date, block.startTime)) error.startTime = 'Start time has already passed in Manila.';
    if (!block.endTime) error.endTime = 'Select an end time.';
    else if (block.startTime && !isValidTimeRange(block.startTime, block.endTime)) error.endTime = 'End time must be at least 1 hour after start time.';

    const quote = calculateRateQuote(rates, block.startTime, block.endTime, rateType);
    if (requireRate && block.startTime && block.endTime && !quote.covered) error.rate = 'No active rate covers the complete selected time.';
  });

  const conflicts = getBookingBlockConflictErrors(blocks);
  conflicts.forEach((conflict, index) => Object.assign(errors[index], conflict));

  return errors;
}

export function getBookingBlockConflictErrors(blocks: BookingBlockValue[]) {
  const errors: BookingBlockErrors[] = blocks.map(() => ({}));
  blocks.forEach((block, index) => {
    if (!block.courtId || !block.date || !block.startTime || !block.endTime) return;
    for (let otherIndex = 0; otherIndex < index; otherIndex += 1) {
      const other = blocks[otherIndex];
      if (block.courtId !== other.courtId || block.date !== other.date || !other.startTime || !other.endTime) continue;
      const overlaps = minutes(block.startTime) < minutes(other.endTime, true)
        && minutes(other.startTime) < minutes(block.endTime, true);
      if (overlaps) {
        errors[index].endTime = `Conflicts with Booking Block ${otherIndex + 1}. Choose a different court or time.`;
        errors[otherIndex].endTime = `Conflicts with Booking Block ${index + 1}. Choose a different court or time.`;
      }
    }
  });
  return errors;
}

export const hasBookingBlockErrors = (errors: BookingBlockErrors[]) => errors.some(error => Object.values(error).some(Boolean));

export const bookingBlockTotals = (blocks: BookingBlockValue[], rates: any[], rateType: RateType) =>
  blocks.map(block => {
    const quote = calculateRateQuote(rates, block.startTime, block.endTime, rateType);
    return quote.covered ? quote.total : 0;
  });

export const bookingBlocksTotal = (blocks: BookingBlockValue[], rates: any[], rateType: RateType) =>
  bookingBlockTotals(blocks, rates, rateType).reduce((sum, total) => sum + total, 0);

// The API stores payment on each booking. Apply one batch reservation amount to
// blocks in display order without allowing any individual booking to overpay.
export function allocateBatchPayment(blocks: BookingBlockValue[], rates: any[], rateType: RateType, amountPaid: number) {
  let remainingCents = Math.max(0, Math.round(amountPaid * 100));
  return bookingBlockTotals(blocks, rates, rateType).map(total => {
    const paidCents = Math.min(remainingCents, Math.round(total * 100));
    remainingCents -= paidCents;
    return paidCents / 100;
  });
}
