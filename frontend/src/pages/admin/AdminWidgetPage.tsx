import { useEffect, useMemo, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowPathIcon, ClockIcon, RectangleGroupIcon, ArrowLeftIcon } from '@heroicons/react/24/solid';
import { useAuth } from '@/hooks/useAuth';
import { useBookings } from '@/hooks/useBookings';
import { useCourts } from '@/hooks/useCourts';
import { ROUTES } from '@/lib/constants';
import { getManilaNow } from '@/lib/manila-time';
import { Booking, Court } from '@/types';
import { useInternalCoaches } from '@/hooks/useInternalCoaches';
import { RateType, ScheduleStatus } from '@/types';
import { STATUS_COLORS, STATUS_LABELS } from '@/lib/constants';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { LoadingIndicator } from '@/components/ui/loading-indicator';

const minutesFromTime = (value: string) => {
  const [hours, minutes] = value.slice(0, 5).split(':').map(Number);
  return hours * 60 + minutes;
};

const secondsFromTime = (value: string) => {
  const [hours, minutes, seconds = 0] = value.slice(0, 8).split(':').map(Number);
  return hours * 3600 + minutes * 60 + seconds;
};

const displayCountdown = (totalSeconds: number) => {
  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  return [hours, minutes, seconds].map(value => String(value).padStart(2, '0')).join(':');
};

const displayTime = (value: string) => format(new Date(`2000-01-01T${value}`), 'h:mm a');

function CourtWidget({ court, bookings, internalCoaches, now }: { court: Court; bookings: Booking[]; internalCoaches: any[]; now: ReturnType<typeof getManilaNow> }) {
  const todaysBookings = bookings.filter(booking => booking.courtId === court.id && booking.bookingDate === now.date && booking.status !== 'Cancelled');
  const active = todaysBookings.find(booking => secondsFromTime(booking.startTime) <= now.seconds && secondsFromTime(booking.endTime) > now.seconds);
  const next = todaysBookings.find(booking => secondsFromTime(booking.startTime) > now.seconds);
  const remainingSeconds = active ? secondsFromTime(active.endTime) - now.seconds : 0;
  const sessionSeconds = active ? secondsFromTime(active.endTime) - secondsFromTime(active.startTime) : 0;
  const remainingPercent = active && sessionSeconds > 0 ? Math.min(100, Math.max(0, remainingSeconds / sessionSeconds * 100)) : 0;

  let activeStatus = ScheduleStatus.Available;
  let mainName = '';
  let mainLabel = '';
  let subName = '';
  let subLabel = '';
  if (active) {
    if (active.bookingType === RateType.Training) {
      activeStatus = ScheduleStatus.Training;
      mainName = internalCoaches.find(profile => profile.id === active.internalCoachProfileId)?.name || 'Coach';
      mainLabel = 'Coach';
      subName = active.customerName;
      subLabel = 'Trainee';
    } else if (active.bookingType === RateType.Internal) {
      activeStatus = ScheduleStatus.Internal;
      mainName = internalCoaches.find(profile => profile.id === active.internalCoachProfileId)?.name || 'Internal';
      mainLabel = 'Internal';
      subName = active.customerName;
      subLabel = 'Reference';
    } else {
      activeStatus = ScheduleStatus.Booked;
      mainName = active.customerName;
      mainLabel = 'Player';
    }
  }

  const getAvatarInitials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  return <section className="relative flex min-h-[330px] flex-col overflow-hidden rounded-[34px] border border-white/40 bg-white/70 p-6 text-[#1c1c1e] shadow-[0_30px_60px_-20px_rgba(0,0,0,.3)] backdrop-blur-2xl sm:p-8">
    <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#88cc22] opacity-[0.15] blur-[50px]" />
    <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-[#851923] opacity-[0.12] blur-[50px]" />
    <div className="relative z-10 flex items-start justify-between gap-3">
      <div><p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8e8e93]">Live court</p><h2 className="mt-1 text-[28px] font-bold tracking-[-0.045em] text-[#1c1c1e] sm:text-[34px]">{court.displayName || court.name}</h2></div>
      {now.seconds < 8 * 3600 ? (
        <span className="rounded-full bg-white/60 text-slate-500 shadow-sm border border-white/40 px-3 py-1.5 text-[12px] font-semibold tracking-[-0.01em]">Closed</span>
      ) : active ? (
        <span className={cn("inline-flex items-center rounded-full px-3 py-1.5 text-[12px] font-bold border shadow-sm", STATUS_COLORS[activeStatus])}>
           {STATUS_LABELS[activeStatus]}
        </span>
      ) : (
        <span className={cn("inline-flex items-center rounded-full px-3 py-1.5 text-[12px] font-bold border shadow-sm", STATUS_COLORS[ScheduleStatus.Available])}>
           Available
        </span>
      )}
    </div>
    <div className="relative z-10 mt-7 flex flex-1 flex-col justify-center rounded-[26px] border border-white/60 bg-white/50 px-5 py-6 shadow-sm backdrop-blur-md sm:px-7">
      {now.seconds < 8 * 3600 ? <><p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#8e8e93]">Currently Closed</p><p className="mt-2 text-[36px] font-bold tracking-[-0.045em] text-[#1c1c1e] sm:text-[44px]">8:00 AM</p><p className="mt-2 text-[14px] text-[#6e6e73]">Court opens in the morning</p></> : active ? (
        <>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#851923]">Time remaining</p>
              <p className="mt-2 tabular-nums text-[48px] font-bold leading-none tracking-[-0.06em] text-[#1c1c1e] sm:text-[64px]">{displayCountdown(remainingSeconds)}</p>
            </div>
            <div className="flex flex-col items-start sm:items-end sm:text-right gap-1.5 shrink-0 min-w-[200px]">
              <div className="flex items-center gap-3 bg-white/60 px-3 py-2 rounded-2xl border border-white/50 shadow-sm w-full sm:w-auto">
                 <div className="flex flex-col flex-1 sm:flex-initial">
                    <span className="text-[15px] font-bold text-foreground leading-tight">{mainName}</span>
                    <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">{mainLabel}</span>
                 </div>
                 <Avatar className="h-10 w-10 border border-border shadow-sm ring-1 ring-black/5 dark:ring-white/10 shrink-0">
                    <AvatarFallback className="bg-[#72151d] text-white text-[13px] font-bold">{getAvatarInitials(mainName)}</AvatarFallback>
                 </Avatar>
              </div>
              {subName && (
                 <div className="text-[12px] font-semibold text-slate-700 bg-white/50 px-3 py-1.5 rounded-xl border border-white/60 shadow-sm w-full sm:w-auto">
                   <span className="text-slate-500 font-medium">{subLabel}:</span> {subName}
                 </div>
              )}
              {active.paddleRentalQuantity > 0 && (
                 <div className="text-[12px] font-bold text-[#851923] bg-[#851923]/10 px-3 py-1.5 rounded-xl border border-[#851923]/20 shadow-sm w-full sm:w-auto">
                   {active.paddleRentalQuantity} paddle{active.paddleRentalQuantity > 1 ? 's' : ''} rented
                 </div>
              )}
            </div>
          </div>
          
          <div className="mt-6 h-2.5 overflow-hidden rounded-full bg-black/[0.07]">
            <div className="h-full rounded-full bg-[#851923] transition-[width] duration-1000 ease-linear" style={{ width: `${remainingPercent}%` }} />
          </div>
          <p className="mt-3 text-[14px] font-medium text-[#6e6e73]">Session ends at {displayTime(active.endTime)}</p>
        </>
      ) : next ? <><p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#8e8e93]">Next session</p><p className="mt-2 text-[36px] font-bold tracking-[-0.045em] text-[#1c1c1e] sm:text-[44px]">{displayTime(next.startTime)}</p><p className="mt-2 text-[14px] text-[#6e6e73]">Court is available until then</p></> : <><p className="text-[24px] font-bold tracking-[-0.035em] text-[#1c1c1e]">Available</p><p className="mt-2 text-[14px] text-[#6e6e73]">Open until 12:00 AM</p></>}
    </div>
  </section>;
}

export default function AdminWidgetPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: bookingResponse, isLoading: bookingsLoading, isError, refetch, isFetching } = useBookings();
  const { data: courtResponse, isLoading: courtsLoading } = useCourts();
  const { internalCoaches } = useInternalCoaches();
  const [now, setNow] = useState(() => getManilaNow());

  useEffect(() => {
    const manifest = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    const previousManifest = manifest?.href;
    const previousTitle = document.title;
    if (manifest) manifest.href = '/widget-manifest.json';
    document.title = 'TDK Court Overview';
    const clockTimer = window.setInterval(() => setNow(getManilaNow()), 1_000);
    const refreshTimer = window.setInterval(() => refetch(), 60_000);
    return () => {
      window.clearInterval(clockTimer);
      window.clearInterval(refreshTimer);
      if (manifest && previousManifest) manifest.href = previousManifest;
      document.title = previousTitle;
    };
  }, [refetch]);

  const bookings = bookingResponse?.data || [];
  const courts = (courtResponse?.data || []).filter(court => court.isActive).slice(0, 2);
  const upcoming = useMemo(() => {
    const future = bookings.filter(booking => booking.status !== 'Cancelled' && (booking.bookingDate > now.date || (booking.bookingDate === now.date && minutesFromTime(booking.startTime) > now.minutes))).sort((a, b) => `${a.bookingDate}${a.startTime}`.localeCompare(`${b.bookingDate}${b.startTime}`));
    const court1Upcoming = courts[0] ? future.filter(b => b.courtId === courts[0].id).slice(0, 2) : [];
    const court2Upcoming = courts[1] ? future.filter(b => b.courtId === courts[1].id).slice(0, 2) : [];
    return [...court1Upcoming, ...court2Upcoming].sort((a, b) => `${a.bookingDate}${a.startTime}`.localeCompare(`${b.bookingDate}${b.startTime}`));
  }, [bookings, now, courts]);

  if (authLoading) return <main className="grid min-h-screen place-items-center bg-slate-50"><img src="/assets/images/loading.png" alt="Loading" className="page-loading-mascot" /></main>;
  if (!isAuthenticated || (user?.role !== 'Admin' && user?.role !== 'Staff')) return <Navigate to={`${ROUTES.ADMIN.LOGIN}?widget=1`} replace />;
  if (user.mustChangePassword) return <Navigate to={ROUTES.ADMIN.WELCOME} replace />;

  const loading = bookingsLoading || courtsLoading;
  return <main className="min-h-screen relative p-4 sm:p-6 lg:px-8 lg:py-10 text-white" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", sans-serif', backgroundImage: 'url("/assets/images/widget-bg.jpg")', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-0"></div>
    <div className="mx-auto max-w-[1320px] relative z-10">
      <header className="mb-7 flex flex-wrap items-center justify-between gap-4 sm:mb-8">
        <div className="flex items-center gap-3.5"><div className="grid h-[58px] w-[58px] place-items-center overflow-hidden rounded-[18px] border border-white/20 bg-white/20 shadow-[0_8px_32px_rgba(0,0,0,.2)] backdrop-blur-xl"><img src="/assets/images/tdk-icon.png" alt="TDK" className="h-[46px] w-[46px] object-contain drop-shadow-md" /></div><div><p className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/80" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>TDK Live</p><h1 className="mt-0.5 text-[28px] font-bold leading-none tracking-[-0.045em] text-white sm:text-[36px]" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>Court Schedule</h1></div></div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end justify-center text-right hidden sm:flex mr-2">
            <div className="text-[16px] font-bold tracking-[-0.015em] text-white tabular-nums leading-none mb-1" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
              {new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-white/90 leading-none" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
              {new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Manila', weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
          </div>
          <Link to={ROUTES.ADMIN.DASHBOARD} className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/20 text-white shadow-sm backdrop-blur-xl transition hover:bg-black/40 active:scale-95" aria-label="Back to Dashboard"><ArrowLeftIcon className="h-5 w-5 drop-shadow-md" /></Link>
          <button type="button" onClick={() => refetch()} className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/20 text-white shadow-sm backdrop-blur-xl transition hover:bg-black/40 active:scale-95" aria-label="Refresh court schedule">{isFetching ? <LoadingIndicator label="Refreshing court schedule" /> : <ArrowPathIcon className="h-5 w-5 drop-shadow-md" />}</button>
        </div>
      </header>

      {isError ? <div className="rounded-[28px] border border-[#ff3b30]/20 bg-[#ff3b30]/8 p-6 text-center text-[#c9342c]"><p className="font-semibold tracking-[-0.02em]">Live overview is unavailable.</p><button className="mt-2 text-[13px] font-medium underline" onClick={() => refetch()}>Try again</button></div> : loading ? <div className="grid min-h-[420px] place-items-center"><img src="/assets/images/loading.png" alt="Loading overview" className="page-loading-mascot" /></div> : <>
        <div className="grid gap-5 md:grid-cols-2">{courts.map(court => <CourtWidget key={court.id} court={court} bookings={bookings} internalCoaches={internalCoaches} now={now} />)}{!courts.length && <div className="rounded-3xl border bg-white p-6 text-slate-500">No active courts configured.</div>}</div>

        <section className="relative mt-4 overflow-hidden rounded-[28px] border border-white/40 bg-white/70 p-5 text-[#1c1c1e] shadow-[0_12px_35px_-24px_rgba(0,0,0,.38)] backdrop-blur-2xl sm:p-6">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#88cc22] opacity-[0.15] blur-[50px]" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-[#851923] opacity-[0.12] blur-[50px]" />
          <div className="relative z-10 flex items-center gap-2"><ClockIcon className="h-[18px] w-[18px] text-[#851923]" /><h2 className="text-[17px] font-semibold tracking-[-0.025em]">Upcoming Court Schedule</h2></div>
          <div className="relative z-10 mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{upcoming.map(booking => <UpcomingBookingWidget key={booking.id} booking={booking} internalCoaches={internalCoaches} />)}{!upcoming.length && <p className="rounded-[24px] border border-white/60 bg-white/50 p-6 text-[14px] font-medium tracking-[-0.01em] text-[#6e6e73] shadow-sm backdrop-blur-md sm:col-span-2 lg:col-span-4">No upcoming schedules.</p>}</div></section></>}<footer className="mt-6 flex items-center justify-center gap-2 pb-2 text-[11px] font-medium tracking-[-0.01em] text-white/80" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}><RectangleGroupIcon className="h-3.5 w-3.5" />Live countdown · Schedule refreshes every minute · Manila time</footer></div></main>;}
        </section>
      </>}
      <footer className="mt-6 flex items-center justify-center gap-2 pb-2 text-[11px] font-medium tracking-[-0.01em] text-white/80" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}><RectangleGroupIcon className="h-3.5 w-3.5" />Live countdown Â· Schedule refreshes every minute Â· Manila time</footer>
    </div>
  </main>;
}




function UpcomingBookingWidget({ booking, internalCoaches }: { booking: Booking; internalCoaches: any[] }) {
  let activeStatus = ScheduleStatus.Booked;
  let mainName = '';
  let mainLabel = '';
  let subName = '';
  let subLabel = '';
  if (booking) {
    if (booking.bookingType === RateType.Training) {
      activeStatus = ScheduleStatus.Training;
      mainName = internalCoaches.find(profile => profile.id === booking.internalCoachProfileId)?.name || 'Coach';
      mainLabel = 'Coach';
      subName = booking.customerName;
      subLabel = 'Trainee';
    } else if (booking.bookingType === RateType.Internal) {
      activeStatus = ScheduleStatus.Internal;
      mainName = internalCoaches.find(profile => profile.id === booking.internalCoachProfileId)?.name || 'Internal';
      mainLabel = 'Internal';
      subName = booking.customerName;
      subLabel = 'Reference';
    } else {
      activeStatus = ScheduleStatus.Booked;
      mainName = booking.customerName;
      mainLabel = 'Player';
    }
  }

  const getAvatarInitials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <article className="flex flex-col justify-between gap-3 rounded-[24px] border border-white/60 bg-white/50 p-5 shadow-sm backdrop-blur-md group hover:bg-white/60 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[14px] font-bold tracking-[-0.02em]">{format(new Date(${booking.bookingDate}T00:00:00), 'MMM d')} · {displayTime(booking.startTime)}–{displayTime(booking.endTime)}</p>
          <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border shadow-sm mt-1.5", STATUS_COLORS[activeStatus])}>
             {STATUS_LABELS[activeStatus]}
          </span>
        </div>
        <span className="shrink-0 rounded-full border border-[#851923]/20 bg-white/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#851923] shadow-sm">{booking.courtName}</span>
      </div>

      <div className="flex flex-col gap-1.5 mt-1 pt-3 border-t border-black/5">
        <div className="flex items-center gap-2.5">
           <Avatar className="h-8 w-8 border border-border shadow-sm ring-1 ring-black/5 shrink-0">
              <AvatarFallback className="bg-[#72151d] text-white text-[11px] font-bold">{getAvatarInitials(mainName)}</AvatarFallback>
           </Avatar>
           <div className="flex flex-col min-w-0">
              <span className="text-[13px] font-bold text-foreground leading-tight truncate">{mainName}</span>
              <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5 truncate">{mainLabel}</span>
           </div>
        </div>
        {subName && (
           <div className="flex justify-between items-center text-[11px] bg-white/40 px-2 py-1 rounded-md mt-0.5 border border-white/50">
             <span className="text-slate-500 font-medium">{subLabel}:</span>
             <span className="font-semibold text-slate-700 truncate ml-2 max-w-[100px]">{subName}</span>
           </div>
        )}
        {booking.paddleRentalQuantity > 0 && (
           <div className="flex justify-between items-center text-[11px] bg-[#851923]/5 px-2 py-1 rounded-md border border-[#851923]/10">
             <span className="text-slate-500 font-medium">Paddle:</span>
             <span className="font-semibold text-[#851923]">{booking.paddleRentalQuantity}x</span>
           </div>
        )}
      </div>
    </article>
  );
}
