import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ShieldCheckIcon } from '@heroicons/react/24/solid';
import { customerService } from '@/services/customers';
import type { CustomerCard } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CustomerBookingCard } from '@/components/customer/CustomerBookingCard';
import NotFoundPage from '@/pages/public/NotFoundPage';
import { formatAppDate } from '@/lib/date-time';

export default function CustomerCardPage() {
  const { username = '', token = '' } = useParams();
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
    if (!username || !token) { setFailed(true); return; }
    let active = true;
    customerService.card(username, token).then(value => active && setProfile(value)).catch(() => active && setFailed(true));
    return () => { active = false; };
  }, [username, token]);

  if (failed) return <NotFoundPage />;
  if (!profile) return <CardLoading />;

  const groups = [{ key: 'upcoming', label: 'Upcoming', data: profile.upcoming }, { key: 'pending', label: 'Pending', data: profile.pending }, { key: 'past', label: 'Past', data: profile.past }, { key: 'cancelled', label: 'Cancelled', data: profile.cancelled }] as const;
  return <main className="min-h-screen bg-slate-50 px-3 py-5 dark:bg-slate-950 sm:px-4 sm:py-8"><div className="mx-auto max-w-4xl space-y-5 sm:space-y-6">
    <Card className="overflow-hidden border-primary/20 shadow-sm"><div className="h-2 bg-primary" /><CardHeader className="p-5 sm:p-6"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start"><div className="flex min-w-0 items-center gap-4"><Avatar className="h-16 w-16 border-2 border-background shadow-md sm:h-20 sm:w-20"><AvatarImage src={profile.profilePictureUrl} alt={profile.fullName} className="object-cover" /><AvatarFallback className="bg-primary/10 text-lg font-bold text-primary">{initials(profile.fullName)}</AvatarFallback></Avatar><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[.22em] text-primary sm:text-xs">The Dirty Kitchen</p><CardTitle className="mt-1 truncate text-2xl sm:text-3xl">{profile.fullName}</CardTitle><p className="mt-1 truncate text-sm text-muted-foreground">@{profile.username} · {profile.customerNumber}</p></div></div><Badge className="w-fit gap-1.5 rounded-full px-3 py-1.5"><ShieldCheckIcon className="h-4 w-4" />Active Customer Card</Badge></div></CardHeader><CardContent className="border-t bg-muted/10 p-5 sm:p-6"><div className="grid gap-3 text-sm sm:grid-cols-3">{[['Member since', profile.memberSince], ['Valid from', profile.cardValidFrom], ['Valid through', profile.cardValidThrough]].map(([label, value]) => <div key={label} className="rounded-xl border bg-background p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-1 font-semibold">{formatAppDate(value)}</p></div>)}</div></CardContent></Card>
    {!!profile.eligiblePromos.length && <Card><CardHeader><CardTitle className="text-lg">Customer Card Promos</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">{profile.eligiblePromos.map(promo => { const exhausted = promo.remainingUsesThisMonth === 0; return <div key={promo.code} className={exhausted ? 'rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50' : 'rounded-xl border border-primary/20 bg-primary/5 p-4'}><div className="flex items-start justify-between gap-3"><strong>{promo.code}</strong><Badge variant={exhausted ? 'secondary' : 'default'}>{promo.monthlyUsageLimitPerCustomer == null ? 'Unlimited' : `${promo.remainingUsesThisMonth ?? promo.monthlyUsageLimitPerCustomer} / ${promo.monthlyUsageLimitPerCustomer} left`}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{promo.description} · {promo.discountType === 'Percentage' ? `${promo.value}%` : `₱${promo.value}`} off</p><p className={exhausted ? 'mt-3 text-xs font-semibold text-muted-foreground' : 'mt-3 text-xs font-semibold text-primary'}>{promo.monthlyUsageLimitPerCustomer == null ? 'Unlimited uses' : `${promo.remainingUsesThisMonth ?? promo.monthlyUsageLimitPerCustomer} of ${promo.monthlyUsageLimitPerCustomer} uses remaining this month`}{promo.resetsOn ? ` · Resets on ${formatAppDate(promo.resetsOn)}` : ''}</p></div>; })}</CardContent></Card>}
    <Tabs defaultValue="upcoming"><TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl bg-muted/70 p-1 sm:grid-cols-4">{groups.map(group => <TabsTrigger className="min-h-10 rounded-lg text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm sm:text-sm" key={group.key} value={group.key}>{group.label} ({group.data.length})</TabsTrigger>)}</TabsList>{groups.map(group => <TabsContent className="mt-4" key={group.key} value={group.key}><div className="grid gap-4 md:grid-cols-2">{group.data.map(booking => <CustomerBookingCard booking={booking} key={booking.id} />)}{!group.data.length && <Card className="md:col-span-2"><CardContent className="p-10 text-center text-sm text-muted-foreground">No {group.label.toLowerCase()} bookings.</CardContent></Card>}</div></TabsContent>)}</Tabs>
  </div></main>;
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'CU';
}

function CardLoading() { return <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950"><div className="mx-auto max-w-4xl space-y-4"><Skeleton className="h-56 w-full" /><Skeleton className="h-20 w-full" /><div className="grid gap-3 sm:grid-cols-2"><Skeleton className="h-64" /><Skeleton className="h-64" /></div></div></main>; }
