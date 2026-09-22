import { z } from 'zod';
import { ScheduleStatus } from '@/types';
import { isValidTimeRange } from '@/lib/time-range';

export const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export const bookingSchema = z.object({
  date: z.string(),
  courtId: z.string().min(1, "Court is required"),
  startTime: z.string(),
  endTime: z.string(),
  customerName: z.string().min(2, "Name is required"),
  customerEmail: z.string().refine(value => !value || z.string().email().safeParse(value).success, "Invalid email address").optional(),
  customerPhone: z.string().refine(v => !v || /^[+0-9 ()-]{7,20}$/.test(v), "Enter a valid phone number").optional(),
}).refine(x => isValidTimeRange(x.startTime, x.endTime), { path: ['endTime'], message: 'End time must be at least 1 hour after start time' });

export const scheduleUpdateSchema = z.object({
  status: z.nativeEnum(ScheduleStatus),
  notes: z.string().optional(),
});

export const bulkUpdateSchema = z.object({
  courtId: z.string().min(1, "Court is required"),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  status: z.nativeEnum(ScheduleStatus),
  notes: z.string().optional(),
  bookedBy: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
}).superRefine((value, ctx) => {
  if (!isValidTimeRange(value.startTime, value.endTime)) {
    ctx.addIssue({ code: 'custom', path: ['endTime'], message: 'End time must be at least 1 hour after start time' });
  }
  if (value.status === ScheduleStatus.Booked || value.status === ScheduleStatus.Training) {
    if (!value.bookedBy?.trim()) ctx.addIssue({ code: 'custom', path: ['bookedBy'], message: 'Booked by is required' });
    if (value.email?.trim() && !z.string().email().safeParse(value.email).success) ctx.addIssue({ code: 'custom', path: ['email'], message: 'Enter a valid email address' });
  }
});

export const courtSchema = z.object({
  name: z.string().min(2, "Name is required"),
  isActive: z.boolean().default(true),
});

export const rateSchema = z.object({
  startTime: z.string(),
  endTime: z.string(),
  pricePerHour: z.number().positive("Rate must be greater than zero"),
}).refine(x => isValidTimeRange(x.startTime, x.endTime), { path: ['endTime'], message: 'End time must be at least 1 hour after start time' });
