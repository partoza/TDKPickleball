import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatAppDate, formatAppTime } from "./date-time"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, _formatStr: string = "PPP") {
  return formatAppDate(date)
}

export function formatTime(time: string) {
  // Assuming time is HH:mm:ss or HH:mm
  return formatAppTime(time);
}
