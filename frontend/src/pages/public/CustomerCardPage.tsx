import { useEffect, useState } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { ShieldCheckIcon } from '@heroicons/react/24/solid';
import { customerService } from '@/services/customers';
import type { Booking, CustomerCard } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ROUTES } from '@/lib/constants';

const unavailable = 'This loyalty card is currently unavailable. Please contact The Dirty Kitchen for assistance.';

export default function CustomerCardPage() {
  const { username = '', token = '' } = useParams();
  const location = useLocation();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [profile, setProfile] = useState<CustomerCard | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    document.title = 'Customer Card · The Dirty Kitchen';
    let robots = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (!robots) { robots = document.createElement('meta'); robots.name = 'robots'; document.head.appendChild(robots); }
    robots.content = 'noindex,nofollow,noarchive';
    let referrer = document.querySelector('meta[name="referrer"]') as HTMLMetaElement | null;
    if (!referrer) { referrer = document.createElement('meta'); referrer.name = 'referrer'; document.head.appendChild(referrer); }
    referrer.content = 'no-referrer';
  }, []);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'Customer' || !username || !token) return;
    let active = true;
    customerService.card(username, token).then(value => active && setProfile(value)).catch(() => active && setFailed(true));
    return () => { active = false; };
  }, [isAuthenticated, user?.role, username, token]);

  if (isLoading) return <CardLoading />;
  if (!isAuthenticated || user?.role !== 'Customer') return <Navigate to={`${ROUTES.LOGIN}?returnTo=${encodeURIComponent(location.pathname)}`} replace />;
  if (failed) return <Unavailable />;
  if (!profile) return <CardLoading />;

  const groups = [{ key: 'upcoming', label: 'Upcoming', data: profile.upcoming }, { key: 'pending', label: 'Pending', data: profile.pending }, { key: 'past', label: 'Past', data: profile.past }, { key: 'cancelled', label: 'Cancelled', data: profile.cancelled }] as const;
  return <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950"><div className="mx-auto max-w-4xl space-y-6"><Card className="overflow-hidden border-primary/20"><div className="h-2 bg-primary" /><CardHeader><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-primary">The Dirty Kitchen</p><CardTitle className="mt-2 text-3xl">{profile.fullName}</CardTitle><p className="mt-1 text-muted-foreground">@{profile.username} · {profile.customerNumber}</p></div><Badge className="w-fit gap-1"><ShieldCheckIcon className="h-4 w-4" />Active NFC Customer</Badge></div></CardHeader><CardContent><p className="text-sm text-muted-foreground">Member since {new Date(profile.memberSince).toLocaleDateString()}</p></CardContent></Card>
    {!!profile.eligiblePromos.length && <Card><CardHeader><CardTitle className="text-lg">NFC customer promos</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">{profile.eligiblePromos.map(promo => <div key={promo.code} className="rounded-lg border border-primary/20 bg-primary/5 p-3"><strong>{promo.code}</strong><p className="text-sm text-muted-foreground">{promo.description} · {promo.discountType === 'Percentage' ? `${promo.value}%` : `₱${promo.value}`} off</p></div>)}</CardContent></Card>}
    <Tabs defaultValue="upcoming"><TabsList className="grid h-auto grid-cols-2 sm:grid-cols-4">{groups.map(group => <TabsTrigger key={group.key} value={group.key}>{group.label} ({group.data.length})</TabsTrigger>)}</TabsList>{groups.map(group => <TabsContent key={group.key} value={group.key}><div className="grid gap-3 sm:grid-cols-2">{group.data.map(booking => <BookingCard booking={booking} key={booking.id} />)}{!group.data.length && <Card className="sm:col-span-2"><CardContent className="p-8 text-center text-muted-foreground">No {group.label.toLowerCase()} bookings.</CardContent></Card>}</div></TabsContent>)}</Tabs>
  </div></main>;
}

function BookingCard({ booking }: { booking: Booking }) {
  return <Card><CardHeader className="pb-2"><div className="flex justify-between gap-3"><CardTitle className="text-base">{booking.bookingReference}</CardTitle><Badge variant="secondary">{booking.status}</Badge></div></CardHeader><CardContent className="space-y-1 text-sm text-muted-foreground"><p>{booking.courtName} · {booking.bookingDate}</p><p>{booking.startTime.slice(0,5)}–{booking.endTime.slice(0,5)} · {booking.bookingType}</p><p>{booking.paddleRentalQuantity} paddle rental(s)</p><p>Total ₱{booking.totalAmount.toFixed(2)} · Discount ₱{booking.discountAmount.toFixed(2)} · Paid ₱{booking.amountPaid.toFixed(2)}</p></CardContent></Card>;
}

function CardLoading() { return <main className="min-h-screen bg-slate-50 px-4 py-8"><div className="mx-auto max-w-4xl space-y-4"><Skeleton className="h-48 w-full" /><Skeleton className="h-12 w-full" /><div className="grid gap-3 sm:grid-cols-2"><Skeleton className="h-40" /><Skeleton className="h-40" /></div></div></main>; }
function Unavailable() { return <main className="grid min-h-screen place-items-center bg-slate-50 px-4"><Card className="max-w-lg"><CardContent className="p-10 text-center"><ShieldCheckIcon className="mx-auto mb-4 h-10 w-10 text-muted-foreground" /><h1 className="text-xl font-semibold">Loyalty card unavailable</h1><p className="mt-3 text-muted-foreground">{unavailable}</p></CardContent></Card></main>; }
