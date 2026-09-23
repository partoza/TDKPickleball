import { ScheduleStatus } from '@/types';

export const QUERY_KEYS = {
  COURTS: 'courts',
  SCHEDULES: 'schedules',
  BOOKINGS: 'bookings',
  RATES: 'rates',
  AVAILABILITY: 'availability',
  USER: 'user'
};

export const STATUS_COLORS: Record<ScheduleStatus, string> = {
  [ScheduleStatus.Available]: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700',
  [ScheduleStatus.Training]: 'bg-orange-500 text-white border-orange-600 dark:bg-orange-600 dark:text-white dark:border-orange-500',
  [ScheduleStatus.Booked]: 'bg-primary text-white border-primary dark:text-white',
  [ScheduleStatus.Unavailable]: 'bg-slate-600 text-white border-slate-700 dark:bg-slate-700 dark:text-white dark:border-slate-600',
  [ScheduleStatus.Internal]: 'bg-violet-600 text-white border-violet-700 dark:bg-violet-500 dark:text-white dark:border-violet-400',
};

export const STATUS_LABELS: Record<ScheduleStatus, string> = {
  [ScheduleStatus.Available]: 'Available',
  [ScheduleStatus.Training]: 'Training',
  [ScheduleStatus.Booked]: 'Booked',
  [ScheduleStatus.Unavailable]: 'Unavailable',
  [ScheduleStatus.Internal]: 'Internal',
};

export const ROUTES = {
  HOME: '/',
  SCHEDULE: '/schedule',
  BOOKING: '/booking',
  VERIFY: '/verify',
  CONTACT: '/contact',
  LOGIN: '/login',
  GOOGLE_CALLBACK: '/auth/google/callback',
  ADMIN: {
    LOGIN: '/tdkadmin',
    DASHBOARD: '/tdkadmin/dashboard',
    SCHEDULE: '/tdkadmin/schedule',
    BOOKINGS: '/tdkadmin/bookings',
    RATES: '/tdkadmin/rates',
    PROMOS: '/tdkadmin/promos',
    COURTS: '/tdkadmin/courts',
    ADMINS: '/tdkadmin/admins',
    STAFF: '/tdkadmin/staff',
    STORAGE: '/tdkadmin/storage',
    WELCOME: '/tdkadmin/welcome',
    PROFILE: '/tdkadmin/profile',
  }
};
