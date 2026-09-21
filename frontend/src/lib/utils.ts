import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, formatStr: string = "PPP") {
  const d = typeof date === "string" ? parseISO(date) : date
  return format(d, formatStr)
}

export function formatTime(time: string) {
  // Assuming time is HH:mm:ss or HH:mm
  const [hours, minutes] = time.split(':');
  const d = new Date();
  d.setHours(parseInt(hours, 10));
  d.setMinutes(parseInt(minutes, 10));
  return format(d, 'h:mm a');
}
