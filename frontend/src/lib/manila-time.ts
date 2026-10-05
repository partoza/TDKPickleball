import { formatAppDateTime } from './date-time';

const MANILA_TIME_ZONE = 'Asia/Manila';

const manilaParts = (instant: Date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: MANILA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant);
  return Object.fromEntries(parts.map(part => [part.type, part.value]));
};

export const getManilaNow = (instant: Date = new Date()) => {
  const parts = manilaParts(instant);
  return {
    instant,
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
    seconds: Number(parts.hour) * 3600 + Number(parts.minute) * 60 + Number(parts.second),
  };
};

export const secondsFromManilaTime = (value: string, midnightAsEnd = false) => {
  const [hour = 0, minute = 0, second = 0] = value.slice(0, 8).split(':').map(Number);
  const total = hour * 3600 + minute * 60 + second;
  return midnightAsEnd && total === 0 ? 24 * 3600 : total;
};

export const isActiveManilaTimeRange = (startTime: string, endTime: string, nowSeconds: number) =>
  secondsFromManilaTime(startTime) <= nowSeconds && secondsFromManilaTime(endTime, true) > nowSeconds;

export const getManilaDate = (instant: Date = new Date()) => getManilaNow(instant).date;

export const getManilaDateAsLocalDate = (instant: Date = new Date()) =>
  new Date(`${getManilaDate(instant)}T00:00:00`);

export const isPastManilaStart = (date: string, startTime: string, instant: Date = new Date()) => {
  if (!date || !startTime) return false;
  const now = getManilaNow(instant);
  if (date < now.date) return true;
  if (date > now.date) return false;
  const [hour, minute] = startTime.slice(0, 5).split(':').map(Number);
  return hour * 60 + minute <= now.minutes;
};

export const formatManilaDatabaseTime = (value?: string) => {
  if (!value) return '—';
  const includesOffset = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
  // Booking audit timestamps are stored as Manila wall-clock values in MySQL.
  // Attach the Manila offset when the API returns a timezone-less DateTime so
  // the browser's own timezone cannot shift the displayed date or time.
  const instant = new Date(includesOffset ? value : `${value}+08:00`);
  if (Number.isNaN(instant.getTime())) return '—';

  return formatAppDateTime(instant);
};
