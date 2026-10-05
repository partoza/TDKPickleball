export enum ScheduleStatus {
  Available = 'Available',
  Training = 'Training',
  Booked = 'Booked',
  Unavailable = 'Unavailable',
  Internal = 'Internal',
  Requested = 'Requested'
}

export enum BookingStatus {
  Reserved = 'Reserved',
  Paid = 'Paid',
  Cancelled = 'Cancelled',
  Completed = 'Completed',
  Requested = 'Requested'
}

export enum RateType {
  Booking = 'Booking',
  Training = 'Training',
  Internal = 'Internal',
  CustomerCard = 'CustomerCard'
}

export enum RateValidityUnit {
  Day = 'Day',
  Month = 'Month',
  Year = 'Year'
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
  customerId?: number;
}

export interface Booking {
  id: number;
  bookingReference: string;
  requestReference?: string;
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
  listedByName?: string;
  voidedPaddleRentalQuantity: number;
  voidedPaddleRentalFee: number;
  paddleRentalVoidedAt?: string;
  paddleRentalVoidedByName?: string;
  totalAmount: number;
  amountPaid: number;
  remainingBalance: number;
  status: BookingStatus;
  bookingType: RateType;
  notes?: string;
  createdAt: string;
  rescheduledAt?: string;
  rescheduledByName?: string;
  cancelledAt?: string;
  cancelledByName?: string;
  confirmedAt?: string;
  confirmedByName?: string;
  receiptAvailable?: boolean;
  internalCoachProfileId?: number;
  promoId?: number;
  customerId?: number;
}

export interface Customer {
  id: number;
  customerNumber: string;
  fullName: string;
  username: string;
  email: string;
  phone?: string;
  isActive: boolean;
  hasNfcCard: boolean;
  nfcIssuedAt?: string;
  nfcLastTappedAt?: string;
  cardValidFrom?: string;
  cardValidThrough?: string;
  createdAt: string;
  updatedAt: string;
  adminNotes?: string;
}

export interface CustomerDetails {
  customer: Customer;
  upcoming: Booking[];
  pending: Booking[];
  past: Booking[];
  cancelled: Booking[];
}

export interface CustomerCard {
  fullName: string;
  username: string;
  customerNumber: string;
  memberSince: string;
  cardValidFrom?: string;
  cardValidThrough?: string;
  upcoming: Booking[];
  pending: Booking[];
  past: Booking[];
  cancelled: Booking[];
  eligiblePromos: { code: string; description: string; discountType: string; value: number; remainingUsesThisMonth?: number; resetsOn?: string }[];
}

export enum PromoAudience {
  Everyone = 'Everyone',
  NfcCustomersOnly = 'NfcCustomersOnly'
}

export interface PublicBookingRequestStatusSchedule {
  bookingReference: string;
  courtName: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  amount: number;
  status: BookingStatus;
}

export interface PublicBookingRequestStatus {
  requestReference: string;
  status: string;
  submittedAt: string;
  totalAmount: number;
  schedules: PublicBookingRequestStatusSchedule[];
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
  monthlyUsageLimitPerCustomer?: number;
  currentUses: number;
  appliesTo?: RateType;
  audience: PromoAudience;
  isActive: boolean;
  remainingUsesThisMonth?: number;
}

export interface PublicPromo {
  code: string;
  description: string;
  type: DiscountType;
  value: number;
  monthlyUsageLimitPerCustomer?: number;
  remainingUsesThisMonth?: number;
  resetsOn?: string;
}

export interface PublicNfcPromoAvailability {
  isNfcCustomer: boolean;
  promos: PublicPromo[];
}

export interface CustomerAvailablePromo {
  id: number;
  code: string;
  description: string;
  type: DiscountType;
  value: number;
  audience: PromoAudience;
  monthlyUsageLimitPerCustomer?: number;
  remainingUsesThisMonth?: number;
}

export interface Rate {
  id: number;
  startTime: string;
  endTime: string;
  pricePerHour: number;
  rateType: RateType;
  isActive: boolean;
  validityDuration?: number;
  validityUnit?: RateValidityUnit;
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

export interface PublicBookingWindow {
  bookingThroughDate?: string | null;
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
  allocatedMegabytes: number;
  limitMegabytes: number;
  warningThresholdMegabytes: number;
  usedPercent: number;
  isHealthy: boolean;
  storageMeasurementAvailable: boolean;
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
  customerCardSales: number;
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
  customerCardSales: number;
  promoDiscounts: number;
  promosAppliedCount: number;
  paddleRentalCount: number;
  customerCardTransactionCount: number;
  transactionCount: number;
  paidCount: number;
  reservedCount: number;
  completedCount: number;
  daily: RevenueDaily[];
}
