import { useMemo, useState, useEffect } from 'react';
import { useStaff } from '@/hooks/useStaff';
import { addDays, endOfDay, endOfMonth, endOfWeek, format, isWithinInterval, startOfDay, startOfMonth, startOfWeek } from 'date-fns';
import { BellIcon as Bell, CalendarDaysIcon as CalendarDays, BanknotesIcon as CircleDollarSign, ClockIcon as Clock3, RectangleGroupIcon as Dumbbell, ChevronRightIcon as ChevronRight, TicketIcon as Ticket } from '@heroicons/react/24/solid';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { toast } from 'sonner';
import { useBookings } from '@/hooks/useBookings';
import { useCourts } from '@/hooks/useCourts';
import { Booking, RateType } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminDatePicker } from '@/components/admin/AdminFormControls';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

function LiveCourtCard({ court, bookings, staff }: { court: any, bookings: Booking[], staff: any[] }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = format(now, 'yyyy-MM-dd');
  const timeStr = now.toTimeString().slice(0, 5);

  const activeBooking = bookings.find(b => 
    b.courtId === court.id && 
    b.bookingDate === todayStr && 
    b.startTime <= timeStr && 
    b.endTime > timeStr && 
    b.status !== 'Cancelled'
  );

  const formatHour = (hStr: string) => {
    const [h, m] = hStr.split(':');
    let hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return {hour}:{m} {ampm}";
  };

  const getRemainingTime = (end: string) => {
    const [eh, em] = end.split(':');
    const endT = new Date(now);
    endT.setHours(parseInt(eh), parseInt(em), 0, 0);
    const diff = endT.getTime() - now.getTime();
    if (diff <= 0) return 'Ending soon';
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) return {hrs}h {mins % 60}m left";
    return {mins} min left";
  };

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm relative overflow-hidden transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-lg">{court.name}</h3>
          {activeBooking ? (
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Currently in use</span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">Available</span>
          )}
        </div>
        {activeBooking && (
          <div className="text-right">
            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 animate-pulse">{getRemainingTime(activeBooking.endTime)}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{formatHour(activeBooking.startTime)} - {formatHour(activeBooking.endTime)}</div>
          </div>
        )}
      </div>

      {activeBooking ? (
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 space-y-2 border border-slate-100 dark:border-white/5">
          {activeBooking.bookingType === RateType.Training ? (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Trainee:</span>
                <span className="font-semibold">{activeBooking.customerName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Trainer:</span>
                <span className="font-semibold">{staff.find(s => s.id === activeBooking.staffProfileId)?.name || 'N/A'}</span>
              </div>
            </>
          ) : activeBooking.bookingType === RateType.Internal ? (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Internal:</span>
                <span className="font-semibold">{staff.find(s => s.id === activeBooking.staffProfileId)?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Reference:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{activeBooking.customerName}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Player:</span>
              <span className="font-semibold">{activeBooking.customerName}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-100 dark:border-white/5 text-center text-sm text-muted-foreground">
          {(() => {
            const nextBooking = bookings.find(b => b.courtId === court.id && b.bookingDate === todayStr && b.startTime > timeStr && b.status !== 'Cancelled');
            if (nextBooking) return Next booking at {formatHour(nextBooking.startTime)}";
            return 'No upcoming bookings today';
          })()}
        </div>
      )}
    </div>
  );
}



type Range = 'day'|'week'|'month';
export default function DashboardPage() {
  const { user } = useAuth();
  const [range, setRange] = useState<Range>('month'); const [anchor, setAnchor] = useState(format(new Date(), 'yyyy-MM-dd'));
  const { data: bookingResponse, isLoading } = useBookings(); const { data: courtResponse } = useCourts(); const { staff } = useStaff();
  const bookings = bookingResponse?.data || []; const courts = courtResponse?.data || [];
  const anchorDate = new Date(`${anchor}T00:00:00`);
  const interval = range === 'day' ? { start: startOfDay(anchorDate), end: endOfDay(anchorDate) } : range === 'week' ? { start: startOfWeek(anchorDate), end: endOfWeek(anchorDate) } : { start: startOfMonth(anchorDate), end: endOfMonth(anchorDate) };
  const filtered = bookings.filter(b => b.status !== 'Cancelled' && isWithinInterval(new Date(`${b.bookingDate}T00:00:00`), interval));
  const today = format(new Date(), 'yyyy-MM-dd');
  const upcoming = bookings.filter(b => b.status !== 'Cancelled' && `${b.bookingDate}T${b.startTime}` > new Date().toISOString().slice(0,19)).sort((a,b) => `${a.bookingDate}${a.startTime}`.localeCompare(`${b.bookingDate}${b.startTime}`));
  const revenue = filtered.reduce((sum, b) => sum + b.amountPaid, 0);
  const points = useMemo(() => {
    const isBooked = (b: Booking) => b.bookingType !== RateType.Training && b.status !== 'Cancelled';
    const isTraining = (b: Booking) => b.bookingType === RateType.Training && b.status !== 'Cancelled';

    if (range === 'day') {
      return Array.from({ length: 7 }, (_, i) => {
        const d = addDays(anchorDate, i - 6);
        const dayB = bookings.filter(b => b.bookingDate === format(d, 'yyyy-MM-dd'));
        const bookedCount = dayB.filter(isBooked).length;
        const trainingCount = dayB.filter(isTraining).length;
        const value = bookedCount + trainingCount;
        return { id: d.toISOString(), label: format(d, 'EEE'), subLabel: format(d, 'd'), value, bookedCount, trainingCount, tooltipSub: format(d, 'MMM d, yyyy') };
      });
    }
    if (range === 'week') {
      const monthStart = startOfMonth(anchorDate);
      const monthEnd = endOfMonth(anchorDate);
      const wks = [];
      let current = startOfWeek(monthStart);
      let weekNum = 1;
      while (current <= monthEnd) {
        const wEnd = endOfWeek(current);
        const weekB = bookings.filter(b => isWithinInterval(new Date(`${b.bookingDate}T00:00:00`), { start: current, end: wEnd }));
        const bookedCount = weekB.filter(isBooked).length;
        const trainingCount = weekB.filter(isTraining).length;
        const value = bookedCount + trainingCount;
        wks.push({ id: `week-${weekNum}`, label: `W${weekNum}`, subLabel: format(current, 'MMM d'), value, bookedCount, trainingCount, tooltipSub: `${format(current, 'MMM d')} - ${format(wEnd, 'MMM d')}` });
        current = addDays(current, 7);
        weekNum++;
      }
      return wks;
    }
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(anchorDate.getFullYear(), i, 1);
      const prefix = format(d, 'yyyy-MM');
      const monthB = bookings.filter(b => b.bookingDate.startsWith(prefix));
      const bookedCount = monthB.filter(isBooked).length;
      const trainingCount = monthB.filter(isTraining).length;
      const value = bookedCount + trainingCount;
      return { id: d.toISOString(), label: format(d, 'MMM'), subLabel: format(d, 'yyyy'), value, bookedCount, trainingCount, tooltipSub: format(d, 'MMMM yyyy') };
    });
  }, [range, anchorDate, bookings]);

  const max = Math.max(1, ...points.map(p => p.value));

  const pathD = points.map((p, i) => {
    const x = ((i + 0.5) / points.length) * 100;
    const y = 100 - (max === 0 ? 0 : (p.value / max) * 100);
    if (i === 0) return `M ${x},${y}`;
    const prevX = (((i - 1) + 0.5) / points.length) * 100;
    const prevY = 100 - (max === 0 ? 0 : (points[i - 1].value / max) * 100);
    const cpX = (x + prevX) / 2;
    return `C ${cpX},${prevY} ${cpX},${y} ${x},${y}`;
  }).join(' ');
  const areaD = `${pathD} L ${((points.length - 1 + 0.5) / points.length) * 100},100 L ${((0 + 0.5) / points.length) * 100},100 Z`;

  return <div className="space-y-6 max-w-[1600px] w-full mx-auto px-4 sm:px-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="mt-1 text-muted-foreground">{user?.role === 'Staff' ? 'Today’s bookings and court schedule at a glance.' : 'Revenue and court operations from live booking data.'}</p>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-2 rounded-xl border bg-card p-1.5 shadow-sm">
        <div className="w-full sm:w-[250px]">
          <AdminDatePicker value={anchor} onChange={setAnchor} displayRange={range} />
        </div>
        <div className="mac-segmented flex w-full sm:w-auto rounded-lg p-0.5">
          {(['day','week','month'] as Range[]).map(x => 
            <Button key={x} type="button" variant="ghost" onClick={() => setRange(x)} className={`flex-1 sm:flex-none h-8 rounded-md px-3 text-xs capitalize shadow-none ${range === x ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : 'text-muted-foreground'}`}>
              {x}
            </Button>
          )}
        </div>
      </div>
    </div>
    {isLoading ? (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1,2,3,4].map(x => <Skeleton key={x} className="h-36 rounded-2xl" />)}
      </div>
    ) : (
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {user?.role === 'Admin' ? <Stat icon={CircleDollarSign} label={`${range} revenue`} value={`₱${revenue.toLocaleString()}`} note={`${format(interval.start, 'MMM d')} – ${format(interval.end, 'MMM d')}`} /> : <Stat icon={Ticket} label="Reservations" value={filtered.filter(b => b.status === 'Reserved').length.toString()} note="Needs payment follow-up" />}
        {user?.role === 'Admin' ? <Stat icon={Dumbbell} label="Active courts" value={courts.filter(c => c.isActive).length.toString()} note={`${courts.length} configured`} /> : <Stat icon={CircleDollarSign} label="Paid bookings" value={filtered.filter(b => b.status === 'Paid').length.toString()} note={`${format(interval.start, 'MMM d')} – ${format(interval.end, 'MMM d')}`} />}
        <Stat icon={CalendarDays} label="Today’s bookings" value={bookings.filter(b => b.bookingDate === today && b.status !== 'Cancelled').length.toString()} note={format(new Date(), 'MMMM d, yyyy')} />
        <Stat icon={Clock3} label="Upcoming" value={upcoming.length.toString()} note={upcoming[0] ? `${upcoming[0].courtName} · ${upcoming[0].customerName}` : 'No'} />
      </div>
    )}
    <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div>
          <h2 className="font-bold">Booked Schedule - {range === 'day' ? '7-Day Comparison' : range === 'week' ? 'Monthly Comparison' : 'Yearly Comparison'}</h2>
          <p className="mt-1 text-sm text-slate-500">Select any date above to compare its {range} trends.</p>
        </div>
        <div className="mt-8 relative h-64 w-full flex items-end justify-between">
          <svg className="absolute top-0 left-0 h-[calc(100%-2.5rem)] w-full overflow-visible pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.2" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={areaD} fill="url(#chartGradient)" vectorEffect="non-scaling-stroke" />
            <path d={pathD} fill="none" stroke="var(--primary)" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {points.map((pt) => {
            const heightPercent = max === 0 ? 0 : (pt.value / max) * 100;
            return (
              <div key={pt.id} className="relative flex h-full w-full flex-col items-center justify-end group">
                <div className="absolute top-0 bottom-[2.5rem] flex w-full flex-col items-center justify-end pointer-events-none">
                  <button 
                    onClick={() => toast.custom(() => (
                      <div className="flex w-full items-center gap-3 rounded-xl border border-border bg-white dark:bg-[#2c2c2e] p-4 shadow-lg">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <CalendarDays className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <p className="text-[14px] font-bold text-foreground">
                            {pt.value} Total Bookings
                          </p>
                          <p className="text-[12px] font-medium text-muted-foreground">
                            <span className="text-primary font-bold">{pt.bookedCount} Booked</span> · {pt.trainingCount} Training
                          </p>
                          <p className="text-[11px] text-muted-foreground/70">{pt.tooltipSub}</p>
                        </div>
                      </div>
                    ))}
                    className="z-10 h-4 w-4 rounded-full border-2 border-white bg-primary shadow-sm transition-transform hover:scale-150 pointer-events-auto cursor-pointer focus:outline-none dark:border-[#2c2c2e]"
                    style={{ marginBottom: `calc(${heightPercent}% - 8px)` }}
                  />
                  <div className="absolute bottom-0 w-px border-l-2 border-dashed border-primary/40 transition-all opacity-0 group-hover:opacity-100" style={{ height: `calc(${heightPercent}% - 8px)` }} />
                  <div 
                    className="absolute z-20 flex flex-col items-center justify-center whitespace-nowrap bg-primary text-primary-foreground px-3 py-1.5 rounded-xl pointer-events-none shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:-translate-y-4" 
                    style={{ bottom: `calc(${heightPercent}% + 8px)` }}
                  >
                    <span className="text-sm font-bold leading-tight">{pt.value} Total</span>
                    <span className="text-[10px] font-medium opacity-90 leading-tight mt-0.5">{pt.bookedCount} Booked · {pt.trainingCount} Training</span>
                    <span className="text-[9px] font-medium opacity-70 leading-tight mt-0.5">{pt.tooltipSub}</span>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rotate-45 rounded-sm" />
                  </div>
                </div>
                <span className="mt-auto text-center text-[11px] font-medium text-slate-500">
                  {pt.label}
                  <br />
                  <span className="text-slate-300">{pt.subLabel}</span>
                </span>
              </div>
            );
          })}
        </div>
      </section>
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <h2 className="font-bold">Upcoming Schedule</h2>
          </div>
          <Link 
            to={ROUTES.ADMIN.SCHEDULE} 
            className="flex items-center gap-1.5 text-[12px] font-semibold text-primary px-3 py-1.5 rounded-full hover:bg-primary/10 transition-all active:scale-95 focus:outline-none group"
          >
            See all 
            <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <div className="mt-5 space-y-3">
          {upcoming.slice(0, 4).map(b => <Upcoming key={b.id} booking={b} />)}
          {!upcoming.length && <p className="rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500">No upcoming schedules.</p>}
        </div>
      </section>
    </div>
  </div>;
}
function Stat({ icon: Icon, label, value, note }: any) { 
  return (
    <div className="rounded-xl sm:rounded-2xl border bg-card p-4 sm:p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/20 group">
      <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-primary/10 border border-primary/20 group-hover:scale-105 transition-transform">
        <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
      </div>
      <p className="mt-3 sm:mt-4 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground line-clamp-1">{label}</p>
      <p className="mt-1 sm:mt-1.5 text-xl sm:text-3xl font-bold tracking-tight text-foreground truncate">{value}</p>
      <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-[12px] font-medium text-muted-foreground/70 truncate">{note}</p>
    </div>
  ); 
}
function Upcoming({ booking: b }: { booking: Booking }) { 
  return (
    <div className="rounded-xl border bg-card p-3 shadow-sm hover:border-primary/40 transition-colors">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-[13px] text-foreground truncate">{b.customerName}</p>
        <span className="text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground px-2 py-0.5 rounded-md whitespace-nowrap shadow-sm">{b.courtName}</span>
      </div>
      <p className="mt-1 text-[11px] font-medium text-muted-foreground">
        {format(new Date(`${b.bookingDate}T00:00:00`), 'MMM d, yyyy')} • {format(new Date(`2000-01-01T${b.startTime}`), 'h:mm a')}
      </p>
    </div>
  ); 
}





