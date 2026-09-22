export const MINIMUM_TIME_RANGE_MINUTES = 60;

export function timeToMinutes(value: string, midnightAsEnd = false) {
  const [rawHour = '0', rawMinute = '0'] = value.slice(0, 5).split(':');
  const hour = Number(rawHour);
  const minute = Number(rawMinute);
  if (midnightAsEnd && hour === 0 && minute === 0) return 24 * 60;
  return hour * 60 + minute;
}

export function isValidTimeRange(startTime: string, endTime: string, minimumMinutes = MINIMUM_TIME_RANGE_MINUTES) {
  if (!startTime || !endTime) return false;
  if (startTime.slice(0, 5) === endTime.slice(0, 5)) return false;
  return timeToMinutes(endTime, true) - timeToMinutes(startTime) >= minimumMinutes;
}

export function minimumEndTime(startTime: string, minimumMinutes = MINIMUM_TIME_RANGE_MINUTES) {
  const totalMinutes = timeToMinutes(startTime) + minimumMinutes;
  if (totalMinutes > 24 * 60) return '';
  if (totalMinutes === 24 * 60) return '00:00';
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function withSeconds(value: string) {
  return value ? `${value.slice(0, 5)}:00` : '';
}
