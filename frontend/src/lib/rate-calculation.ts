import { Rate, RateType } from '@/types';

export type RateQuoteLine = { rateId: number; pricingId: string; hours: number; pricePerHour: number; subtotal: number };
export type RateQuote = { total: number; hours: number; covered: boolean; lines: RateQuoteLine[] };

const minutes = (value: string, midnightAsEnd = false) => {
  const [hour, minute] = value.slice(0, 5).split(':').map(Number);
  return midnightAsEnd && hour === 0 && minute === 0 ? 1440 : hour * 60 + minute;
};

export function ratePricingId(rate: Rate, allRates: Rate[]) {
  const type = rate.rateType || RateType.Booking;
  const prefix = type === RateType.Booking ? 'BK' : type === RateType.Training ? 'TR' : 'FP';
  const siblings = allRates.filter(item => (item.rateType || RateType.Booking) === type).sort((a, b) => a.startTime.localeCompare(b.startTime) || a.id - b.id);
  return `${prefix}-${siblings.findIndex(item => item.id === rate.id) + 1}`;
}

export function calculateRateQuote(allRates: Rate[], startTime: string, endTime: string, rateType: RateType): RateQuote {
  const start = minutes(startTime);
  const end = minutes(endTime, true);
  if (!startTime || !endTime || start >= end) return { total: 0, hours: 0, covered: false, lines: [] };
  const rates = allRates.filter(rate => rate.isActive && (rate.rateType || RateType.Booking) === rateType).sort((a, b) => a.startTime.localeCompare(b.startTime));
  const lines: RateQuoteLine[] = [];
  let cursor = start;
  while (cursor < end) {
    const rate = rates.find(item => minutes(item.startTime) <= cursor && minutes(item.endTime, true) > cursor);
    if (!rate) return { total: 0, hours: (end - start) / 60, covered: false, lines: [] };
    const segmentEnd = Math.min(end, minutes(rate.endTime, true));
    const hours = (segmentEnd - cursor) / 60;
    const existing = lines.find(line => line.rateId === rate.id);
    if (existing) { existing.hours += hours; existing.subtotal += hours * rate.pricePerHour; }
    else lines.push({ rateId: rate.id, pricingId: ratePricingId(rate, allRates), hours, pricePerHour: rate.pricePerHour, subtotal: hours * rate.pricePerHour });
    cursor = segmentEnd;
  }
  return { total: lines.reduce((sum, line) => sum + line.subtotal, 0), hours: (end - start) / 60, covered: true, lines };
}
