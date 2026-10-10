import { useMemo, useState, useEffect } from 'react';
import { useInternalCoaches } from '@/hooks/useInternalCoaches';
import { addDays, endOfDay, endOfMonth, endOfWeek, format, isWithinInterval, startOfDay, startOfMonth, startOfWeek } from 'date-fns';
import { BellIcon as Bell, CalendarDaysIcon as CalendarDays, BanknotesIcon as CircleDollarSign, ClockIcon as Clock3, RectangleGroupIcon as Dumbbell, ChevronRightIcon as ChevronRight, TicketIcon as Ticket, ComputerDesktopIcon as ComputerDesktop } from '@heroicons/react/24/solid';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { toast } from 'sonner';
import { useBookings } from '@/hooks/useBookings';
import { useCourts } from '@/hooks/useCourts';
import { Booking, BookingStatus, InternalCoachProfile, RateType } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminDatePicker } from '@/components/admin/AdminFormControls';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { STATUS_COLORS, STATUS_LABELS } from '@/lib/constants';
import { ScheduleStatus } from '@/types';
import { cn } from '@/lib/utils';
import { PaddleIcon } from '@/components/ui/paddle-icon';
import { AdminPageSkeleton } from '@/components/admin/AdminPageSkeleton';
import { formatAppDate, formatAppTime } from '@/lib/date-time';
import { useRevenue } from '@/hooks/useRevenue';
import { getManilaNow, isActiveManilaTimeRange, secondsFromManilaTime } from '@/lib/manila-time';

function LiveCourtCard({ court, bookings, internalCoaches, now }: { court: any, bookings: Booking[], internalCoaches: InternalCoachProfile[], now: ReturnType<typeof getManilaNow> }) {
  const todayStr = now.date;
  const timeStr = `${String(Math.floor(now.seconds / 3600)).padStart(2, '0')}:${String(Math.floor((now.seconds % 3600) / 60)).padStart(2, '0')}:${String(now.seconds % 60).padStart(2, '0')}`;
  const courtBookings = bookings
    .filter(b => b.courtId === court.id && b.bookingDate === todayStr && b.status !== BookingStatus.Cancelled)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const activeBooking = courtBookings.find(b => isActiveManilaTimeRange(b.startTime, b.endTime, now.seconds));
  const nextBooking = courtBookings.find(b => secondsFromManilaTime(b.startTime) > now.seconds);
  const nextIsTraining = nextBooking?.bookingType === RateType.Training;

  const formatHour = (hStr: string) => formatAppTime(hStr);

  const getRemainingTime = (end: string) => {
    const diff = (secondsFromManilaTime(end, true) - now.seconds) * 1000;
    if (diff <= 0) return 'Ending soon';
    const totalSeconds = Math.floor(diff / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds].map(value => String(value).padStart(2, '0')).join(':');
  };

  let activeStatus = ScheduleStatus.Available;
  let mainName = '';
  let mainLabel = '';
  let mainProfilePictureUrl: string | undefined;
  let subName = '';
  let subLabel = '';
  let subProfilePictureUrl: string | undefined;
  if (activeBooking) {
    if (activeBooking.status === BookingStatus.Requested) {
      activeStatus = ScheduleStatus.Requested;
      mainName = activeBooking.customerName;
      mainLabel = 'Requested by';
    } else if (activeBooking.bookingType === RateType.Training) {
      activeStatus = ScheduleStatus.Training;
      const coach = internalCoaches.find(profile => profile.id === activeBooking.internalCoachProfileId);
      mainName = activeBooking.customerName;
      mainLabel = 'Trainee';
      subName = coach?.name || 'Coach not assigned';
      subLabel = 'Coach';
      subProfilePictureUrl = coach?.profilePictureUrl;
    } else if (activeBooking.bookingType === RateType.Internal) {
      activeStatus = ScheduleStatus.Internal;
      const internal = internalCoaches.find(profile => profile.id === activeBooking.internalCoachProfileId);
      mainName = internal?.name || 'Internal';
      mainLabel = 'Internal';
      mainProfilePictureUrl = internal?.profilePictureUrl;
      subName = activeBooking.customerName;
      subLabel = 'Reference';
    } else {
      activeStatus = ScheduleStatus.Booked;
      mainName = activeBooking.customerName;
      mainLabel = 'Player';
    }
  }

  const getAvatarInitials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <div className={cn('relative flex h-full min-h-[190px] flex-col overflow-hidden rounded-3xl border bg-card p-5 shadow-sm transition-all group hover:-translate-y-0.5 hover:shadow-lg', activeBooking ? 'border-primary/35 ring-1 ring-primary/10' : 'hover:border-primary/25')}>
      <div className={cn('pointer-events-none absolute -right-12 -top-16 h-36 w-36 rounded-full blur-3xl', activeBooking ? 'bg-primary/15' : 'bg-emerald-500/10')} />
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg leading-none m-0">{court.name}</h3>
        {timeStr < '08:00:00' ? (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">Closed</span>
        ) : activeBooking ? (
          <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold border", STATUS_COLORS[activeStatus])}>
             Ongoing {STATUS_LABELS[activeStatus]}
          </span>
        ) : nextBooking ? (
          <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold', nextIsTraining ? 'border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-300' : 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-300')}>
            {nextIsTraining ? 'Upcoming training' : 'Upcoming booking'}
          </span>
        ) : (
          <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold border", STATUS_COLORS[ScheduleStatus.Available])}>
             Available
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {activeBooking ? (
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-100 dark:border-white/5 flex flex-col gap-3 transition-colors group-hover:border-primary/20">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <Avatar className="h-10 w-10 border border-border shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                      {mainProfilePictureUrl && <AvatarImage src={mainProfilePictureUrl} alt={mainName} className="object-cover" />}
                      <AvatarFallback className="bg-primary/5 text-primary text-[11px] font-bold">{getAvatarInitials(mainName)}</AvatarFallback>
                   </Avatar>
                   <div className="flex flex-col">
                      <span className="text-[13px] font-bold text-foreground leading-tight">{mainName}</span>
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">{mainLabel}</span>
                   </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className="tabular-nums text-base font-extrabold tracking-tight text-primary">{getRemainingTime(activeBooking.endTime)}</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">remaining</span>
                  <span className="text-[10px] font-medium text-muted-foreground mt-0.5">{formatHour(activeBooking.startTime)} - {formatHour(activeBooking.endTime)}</span>
                </div>
             </div>
             
             {(subName || activeBooking.paddleRentalQuantity > 0) && (
               <div className="pt-3 mt-1 border-t border-slate-200/80 dark:border-white/10 flex flex-col gap-1.5">
                 {subName && (
                   activeBooking.bookingType === RateType.Training ? (
                     <div className="flex items-center gap-2.5 text-[12px]">
                       <Avatar className="h-8 w-8 border border-border shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                         {subProfilePictureUrl && <AvatarImage src={subProfilePictureUrl} alt={subName} className="object-cover" />}
                         <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-bold">{getAvatarInitials(subName)}</AvatarFallback>
                       </Avatar>
                       <div className="flex min-w-0 flex-col">
                         <span className="truncate font-semibold text-slate-700 dark:text-slate-300">{subName}</span>
                         <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{subLabel}</span>
                       </div>
                     </div>
                   ) : (
                     <div className="flex justify-between items-center text-[12px]">
                       <span className="text-slate-500 font-medium">{subLabel}:</span>
                       <span className="font-semibold text-slate-700 dark:text-slate-300">{subName}</span>
                     </div>
                   )
                 )}
                 {activeBooking.paddleRentalQuantity > 0 && (
                   <div className="flex justify-between items-center text-[12px]">
                     <span className="text-slate-500 font-medium flex items-center gap-1.5"><PaddleIcon className="w-3.5 h-3.5" /> Paddles Rented:</span>
                     <span className="font-semibold text-slate-700 dark:text-slate-300 bg-primary/10 text-primary px-1.5 py-0.5 rounded-md">{activeBooking.paddleRentalQuantity}</span>
                   </div>
                 )}
               </div>
             )}
          </div>
        ) : (
          <div className="flex h-full min-h-[104px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/25 p-4 text-center">
            <span className={cn('grid h-10 w-10 place-items-center rounded-full', nextBooking ? nextIsTraining ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400')}><Clock3 className="h-5 w-5" /></span>
            {nextBooking ? <><p className={cn('mt-3 text-xs font-extrabold uppercase tracking-[0.14em]', nextIsTraining ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-blue-400')}>{nextIsTraining ? 'Next training' : 'Next booking'}</p><p className="mt-1 text-lg font-bold text-foreground">{formatHour(nextBooking.startTime)}</p><p className="mt-1 text-xs text-muted-foreground">{nextBooking.customerName}</p></> : <><p className="mt-3 text-sm font-semibold text-foreground">Court is available</p><p className="mt-1 text-xs text-muted-foreground">No more bookings today</p></>}
          </div>
        )}
      </div>
    </div>
  );
}



type Range = 'day'|'week'|'month';
export default function DashboardPage() {
  const { user } = useAuth();
  const [clock, setClock] = useState(Date.now());
  useEffect(() => { const timer = window.setInterval(() => setClock(Date.now()), 1_000); return () => window.clearInterval(timer); }, []);
  const now = getManilaNow(new Date(clock));
  const [range, setRange] = useState<Range>('month'); const [anchor, setAnchor] = useState(() => getManilaNow().date);
  const { data: bookingResponse, isLoading } = useBookings(); const { data: courtResponse } = useCourts(); const { internalCoaches } = useInternalCoaches();
  const bookings = bookingResponse?.data || []; const courts = courtResponse?.data || [];
  const anchorDate = new Date(`${anchor}T00:00:00`);
  const interval = range === 'day' ? { start: startOfDay(anchorDate), end: endOfDay(anchorDate) } : range === 'week' ? { start: startOfWeek(anchorDate), end: endOfWeek(anchorDate) } : { start: startOfMonth(anchorDate), end: endOfMonth(anchorDate) };
  const revenueReport = useRevenue(format(interval.start, 'yyyy-MM-dd'), format(interval.end, 'yyyy-MM-dd'), user?.role === 'Admin');
  const filtered = bookings.filter(b => b.status !== 'Cancelled' && isWithinInterval(new Date(`${b.bookingDate}T00:00:00`), interval));
  const today = now.date;
  const upcoming = bookings.filter(b => b.status !== BookingStatus.Cancelled && (b.bookingDate > now.date || (b.bookingDate === now.date && secondsFromManilaTime(b.startTime) > now.seconds))).sort((a,b) => `${a.bookingDate}${a.startTime}`.localeCompare(`${b.bookingDate}${b.startTime}`));
  const revenue = revenueReport.data?.data.collectedRevenue ?? filtered.reduce((sum, b) => sum + b.amountPaid, 0);
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
        return { id: d.toISOString(), label: format(d, 'EEE'), subLabel: format(d, 'd'), value, bookedCount, trainingCount, tooltipSub: formatAppDate(d) };
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
        wks.push({ id: `week-${weekNum}`, label: `W${weekNum}`, subLabel: format(current, 'MMM d'), value, bookedCount, trainingCount, tooltipSub: `${formatAppDate(current)} - ${formatAppDate(wEnd)}` });
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

  if (isLoading) return <AdminPageSkeleton layout="dashboard" label="Loading overview" />;

  return <div className="space-y-6 max-w-[1600px] w-full mx-auto px-4 sm:px-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="mt-1 text-muted-foreground">{user?.role === 'Staff' ? 'Today’s bookings and court schedule at a glance.' : 'Revenue and court operations from live booking data.'}</p>
        <Button variant="outline" size="sm" className="mt-3 dark:border-white/20 dark:bg-[#3a3a3c] dark:text-white dark:hover:bg-[#48484a]" asChild><Link to={ROUTES.ADMIN.WIDGET}><ComputerDesktop className="h-4 w-4" />Schedule Widgets</Link></Button>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-2 rounded-xl border bg-card p-1.5 shadow-sm">
        <div className="w-full sm:w-[250px]">
          <AdminDatePicker value={anchor} onChange={setAnchor} displayRange={range} />
        </div>
        <div className="mac-segmented flex w-full sm:w-auto rounded-lg p-0.5">
          {(['day','week','month'] as Range[]).map(x => 
            <Button key={x} type="button" variant="ghost" onClick={() => setRange(x)} className={`flex-1 sm:flex-none h-8 rounded-md px-3 text-xs capitalize shadow-none ${range === x ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90' : 'text-muted-foreground'}`}>
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
        {user?.role === 'Admin' ? <Stat icon={CircleDollarSign} label={`${range} revenue`} value={`₱${revenue.toLocaleString()}`} note={`${formatAppDate(interval.start)} – ${formatAppDate(interval.end)}`} /> : <Stat icon={Ticket} label="Reservations" value={filtered.filter(b => b.status === 'Reserved').length.toString()} note="Needs payment follow-up" />}
        {user?.role === 'Admin' ? <Stat icon={Dumbbell} label="Active courts" value={courts.filter(c => c.isActive).length.toString()} note={`${courts.length} configured`} /> : <Stat icon={CircleDollarSign} label="Paid bookings" value={filtered.filter(b => b.status === 'Paid').length.toString()} note={`${formatAppDate(interval.start)} – ${formatAppDate(interval.end)}`} />}
        <Stat icon={CalendarDays} label="Today’s bookings" value={bookings.filter(b => b.bookingDate === today && b.status !== BookingStatus.Cancelled).length.toString()} note={formatAppDate(now.instant)} />
        <Stat icon={Clock3} label="Upcoming" value={upcoming.length.toString()} note={upcoming[0] ? `${upcoming[0].courtName} · ${upcoming[0].customerName}` : 'No'} />
      </div>
    )}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 mb-6">
      {courts.filter(c => c.isActive).map(court => (
        <LiveCourtCard key={court.id} court={court} bookings={bookings} internalCoaches={internalCoaches} now={now} />
      ))}
    </div>
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
          {upcoming.slice(0, 4).map(b => <Upcoming key={b.id} booking={b} coach={internalCoaches.find(profile => profile.id === b.internalCoachProfileId)} />)}
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
function Upcoming({ booking: b, coach }: { booking: Booking; coach?: InternalCoachProfile }) {
  return (
    <div className="rounded-xl border bg-card p-3 shadow-sm hover:border-primary/40 transition-colors">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-[13px] text-foreground truncate">{b.customerName}</p>
        <span className="text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground px-2 py-0.5 rounded-md whitespace-nowrap shadow-sm">{b.courtName}</span>
      </div>
      <p className="mt-1 text-[11px] font-medium text-muted-foreground">
        {formatAppDate(b.bookingDate)} • {formatAppTime(b.startTime)}
      </p>
      {b.bookingType === RateType.Training && (
        <div className="mt-2 flex items-center gap-2 border-t pt-2">
          <Avatar className="h-7 w-7 border shadow-sm">
            {coach?.profilePictureUrl && <AvatarImage src={coach.profilePictureUrl} alt={coach.name} className="object-cover" />}
            <AvatarFallback className="bg-orange-500/10 text-[9px] font-bold text-orange-600">{coach ? coach.name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase() : '?'}</AvatarFallback>
          </Avatar>
          <div className="min-w-0"><p className="truncate text-[11px] font-semibold text-foreground">{coach?.name || 'Coach not assigned'}</p><p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Coach</p></div>
        </div>
      )}
    </div>
  ); 
}






