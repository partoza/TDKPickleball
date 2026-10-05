import { BanknotesIcon, CalendarDaysIcon, ClockIcon, RectangleGroupIcon } from '@heroicons/react/24/solid';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Booking, BookingStatus } from '@/types';
import { formatAppDate, formatAppTime } from '@/lib/date-time';
import { cn } from '@/lib/utils';

const statusLabel = (status: BookingStatus) => status === BookingStatus.Requested
  ? 'Booking Requested'
  : status === BookingStatus.Reserved ? 'Reservation' : status;

const statusClass = (status: BookingStatus) => status === BookingStatus.Requested
  ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-600'
  : status === BookingStatus.Paid
    ? 'border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-600'
    : status === BookingStatus.Reserved
      ? 'border-amber-500 bg-amber-500 text-white hover:bg-amber-500'
      : status === BookingStatus.Cancelled
        ? 'border-red-500 bg-red-500 text-white hover:bg-red-500'
        : 'border-slate-600 bg-slate-600 text-white hover:bg-slate-600';

const money = (value: number) => `₱${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function CustomerBookingCard({ booking }: { booking: Booking }) {
  return <Card className="group overflow-hidden border-border/80 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md">
    <CardHeader className="space-y-0 border-b bg-muted/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground">Booking reference</p><CardTitle className="mt-1 truncate font-mono text-base">{booking.bookingReference}</CardTitle></div>
        <Badge className={cn('shrink-0 border', statusClass(booking.status))}>{statusLabel(booking.status)}</Badge>
      </div>
    </CardHeader>
    <CardContent className="space-y-4 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex gap-2.5"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><CalendarDaysIcon className="h-4 w-4" /></span><div><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Schedule</p><p className="mt-0.5 text-sm font-semibold">{formatAppDate(booking.bookingDate)}</p></div></div>
        <div className="flex gap-2.5"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><ClockIcon className="h-4 w-4" /></span><div><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Time</p><p className="mt-0.5 text-sm font-semibold">{formatAppTime(booking.startTime)}–{formatAppTime(booking.endTime)}</p></div></div>
      </div>
      <div className="flex flex-wrap gap-2 text-xs"><span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 font-medium"><RectangleGroupIcon className="h-3.5 w-3.5 text-primary" />{booking.courtName}</span><span className="rounded-full border bg-background px-2.5 py-1 font-medium">{booking.bookingType}</span>{booking.paddleRentalQuantity > 0 && <span className="rounded-full border bg-background px-2.5 py-1 font-medium">{booking.paddleRentalQuantity} paddle{booking.paddleRentalQuantity === 1 ? '' : 's'}</span>}</div>
      <div className="grid grid-cols-3 gap-2 rounded-xl border bg-muted/20 p-3 text-center"><div><p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Total</p><p className="mt-1 text-xs font-bold sm:text-sm">{money(booking.totalAmount)}</p></div><div className="border-x"><p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Discount</p><p className="mt-1 text-xs font-bold text-emerald-600 sm:text-sm">{money(booking.discountAmount)}</p></div><div><p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Paid</p><p className="mt-1 inline-flex items-center gap-1 text-xs font-bold sm:text-sm"><BanknotesIcon className="hidden h-3.5 w-3.5 text-emerald-600 sm:block" />{money(booking.amountPaid)}</p></div></div>
    </CardContent>
  </Card>;
}
