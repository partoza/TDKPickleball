const MANILA_TIME_ZONE = 'Asia/Manila';

const manilaParts = (instant: Date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: MANILA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant);
  return Object.fromEntries(parts.map(part => [part.type, part.value]));
};

export const getManilaNow = (instant: Date = new Date()) => {
  const parts = manilaParts(instant);
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
};

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
