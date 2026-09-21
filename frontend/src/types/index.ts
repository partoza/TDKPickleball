export enum ScheduleStatus {
  Available = 'Available',
  Training = 'Training',
  Booked = 'Booked',
  Unavailable = 'Unavailable',
  FreePlay = 'FreePlay'
}

export enum BookingStatus {
  Reserved = 'Reserved',
  Paid = 'Paid',
  Cancelled = 'Cancelled',
  Completed = 'Completed'
}

export enum RateType {
  Booking = 'Booking',
  Training = 'Training',
  FreePlay = 'FreePlay'
}

export interface Court {
  id: number;
  name: string;
  displayName: string;
  isActive: boolean;
  sortOrder: number;
  openTime: string;
  closeTime: string;
}

export interface TimeSlot {
  time: string; // HH:mm:ss
  status: ScheduleStatus;
  scheduleId?: string;
  price?: number;
}

export interface Schedule {
  id: string;
  courtId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: ScheduleStatus;
  notes?: string;
  bookingId?: number;
  bookingReference?: string;
  bookedBy?: string;
  email?: string;
  phone?: string;
  paymentStatus?: BookingStatus;
  amountPaid?: number;
  totalAmount?: number;
}

export interface Booking {
  id: number;
  bookingReference: string;
  customerName: string;
  email: string;
  phone?: string;
  courtId: number;
  courtName: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  totalAmount: number;
  amountPaid: number;
  remainingBalance: number;
  status: BookingStatus;
  bookingType: RateType;
  notes?: string;
  createdAt: string;
  receiptAvailable?: boolean;
}

export interface Rate {
  id: number;
  startTime: string;
  endTime: string;
  pricePerHour: number;
  rateType: RateType;
  isActive: boolean;
}

export interface TimeSlotDto {
  id: number;
  startTime: string;
  endTime: string;
  displayName: string;
}

export interface CourtDto {
  id: number;
  name: string;
  displayName: string;
  isActive: boolean;
  sortOrder: number;
}

export interface CourtScheduleDto {
  court: CourtDto;
  schedules: Schedule[];
}

export interface ScheduleBoardResponse {
  courts: CourtScheduleDto[];
  timeSlots: TimeSlotDto[];
  rates: Rate[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface AuthResponse {
  accessToken: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  mustChangePassword: boolean;
}

export interface SystemUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'Admin' | 'Staff';
  isActive: boolean;
  mustChangePassword: boolean;
}
