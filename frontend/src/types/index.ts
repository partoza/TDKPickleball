export enum ScheduleStatus {
  Available = 'Available',
  Training = 'Training',
  Booked = 'Booked',
  Unavailable = 'Unavailable',
  Internal = 'Internal'
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
  Internal = 'Internal'
}

export enum InternalCoachType {
  Internal = 'Internal',
  Coach = 'Coach'
}

export interface InternalCoachProfile {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  type: InternalCoachType;
  isActive: boolean;
  profilePictureUrl?: string;
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
  internalCoachProfileId?: number;
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
  subtotal: number;
  discountAmount: number;
  paddleRentalQuantity: number;
  paddleRentalFee: number;
  totalAmount: number;
  amountPaid: number;
  remainingBalance: number;
  status: BookingStatus;
  bookingType: RateType;
  notes?: string;
  createdAt: string;
  rescheduledAt?: string;
  receiptAvailable?: boolean;
  internalCoachProfileId?: number;
  promoId?: number;
}

export enum DiscountType {
  Percentage = 'Percentage',
  FixedAmount = 'FixedAmount'
}

export interface Promo {
  id: number;
  code: string;
  description: string;
  type: DiscountType;
  value: number;
  startDate?: string;
  endDate?: string;
  maxUses?: number;
  currentUses: number;
  appliesTo?: RateType;
  isActive: boolean;
}

export interface PublicPromo {
  code: string;
  description: string;
  type: DiscountType;
  value: number;
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

export interface AdminNotification {
  id: number;
  bookingId?: number;
  title: string;
  message: string;
  createdAtUtc: string;
}

export interface AuthResponse {
  accessToken: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  mustChangePassword: boolean;
  profileImageUrl?: string;
}

export interface SystemUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'Admin' | 'Staff';
  isActive: boolean;
  mustChangePassword: boolean;
  profileImageUrl?: string;
}

export interface StorageStatus {
  usedMegabytes: number;
  limitMegabytes: number;
  warningThresholdMegabytes: number;
  usedPercent: number;
  isHealthy: boolean;
  cleanupEligibleRecordCount: number;
  checkedAtUtc: string;
}

export interface BookingCleanupPreview {
  fromDate: string;
  throughDate: string;
  eligibleScheduleCount: number;
  eligibleBookingCount: number;
  receiptCount: number;
  oldestRecordDate?: string;
}

export interface BookingCleanupHistory {
  id: number;
  selectedFromDate?: string;
  deletedThroughDate: string;
  oldestBookingDate?: string;
  deletedBookingCount: number;
  deletedScheduleCount: number;
  deletedReceiptCount: number;
  deletedByName: string;
  deletedByEmail: string;
  deletedAtUtc: string;
}

export interface RevenueDaily {
  date: string;
  bookingSales: number;
  trainingSales: number;
  paddleRentalSales: number;
  promoDiscounts: number;
  promosAppliedCount: number;
  grossSales: number;
  collectedRevenue: number;
  outstandingBalance: number;
  transactionCount: number;
}

export interface RevenueSummary {
  fromDate: string;
  throughDate: string;
  collectedRevenue: number;
  grossSales: number;
  outstandingBalance: number;
  bookingSales: number;
  trainingSales: number;
  paddleRentalSales: number;
  promoDiscounts: number;
  promosAppliedCount: number;
  paddleRentalCount: number;
  transactionCount: number;
  paidCount: number;
  reservedCount: number;
  completedCount: number;
  daily: RevenueDaily[];
}
