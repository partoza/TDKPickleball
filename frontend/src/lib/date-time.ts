import { RateValidityUnit } from '@/types';

const MANILA_TIME_ZONE = 'Asia/Manila';
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const TIME_ONLY = /^\d{2}:\d{2}(?::\d{2})?$/;

function dateValue(value: string | Date) {
  if (value instanceof Date) return value;
  if (DATE_ONLY.test(value)) return new Date(`${value}T12:00:00+08:00`);
  if (TIME_ONLY.test(value)) return new Date(`2000-01-01T${value}+08:00`);
  return new Date(value);
}

export function formatAppDate(value?: string | Date | null) {
  if (!value) return '—';
  const date = dateValue(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: MANILA_TIME_ZONE }).format(date);
}

export function formatAppTime(value?: string | Date | null) {
  if (!value) return '—';
  const date = dateValue(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: MANILA_TIME_ZONE }).format(date);
}

export function formatAppTimeWithSeconds(value?: string | Date | null) {
  if (!value) return '—';
  const date = dateValue(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true, timeZone: MANILA_TIME_ZONE }).format(date);
}

export function formatAppDateTime(value?: string | Date | null) {
  if (!value) return '—';
  const date = dateValue(value);
  if (Number.isNaN(date.getTime())) return '—';
  return `${formatAppDate(date)}, ${formatAppTime(date)}`;
}

export function manilaTodayIso() {
  const parts = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: MANILA_TIME_ZONE }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function calculateValidThrough(validFrom: string, duration: number, unit: RateValidityUnit) {
  const [year, month, day] = validFrom.split('-').map(Number);
  let date = new Date(Date.UTC(year, month - 1, day));
  if (unit === RateValidityUnit.Day) date.setUTCDate(date.getUTCDate() + duration);
  else {
    const targetMonth = unit === RateValidityUnit.Month ? month - 1 + duration : month - 1;
    const targetYear = unit === RateValidityUnit.Year ? year + duration : year + Math.floor(targetMonth / 12);
    const normalizedMonth = ((targetMonth % 12) + 12) % 12;
    const daysInTargetMonth = new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate();
    date = new Date(Date.UTC(targetYear, normalizedMonth, Math.min(day, daysInTargetMonth)));
  }
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

export function isDateInCurrentManilaPeriod(from?: string, through?: string) {
  const today = manilaTodayIso();
  return !!from && !!through && from <= today && through >= today;
}
