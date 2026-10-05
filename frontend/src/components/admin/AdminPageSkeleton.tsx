import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type AdminSkeletonLayout = 'dashboard' | 'bookings' | 'management' | 'profile' | 'profiles' | 'promos' | 'revenue' | 'schedule' | 'social' | 'storage' | 'widget' | 'generic';

interface AdminPageSkeletonProps {
  className?: string;
  label?: string;
  layout?: AdminSkeletonLayout;
  showHeader?: boolean;
}

const blocks = (count: number, className: string) => Array.from({ length: count }).map((_, index) => <Skeleton key={index} className={className} />);

function PageHeaderSkeleton({ action = false }: { action?: boolean }) {
  return <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div className="w-full space-y-3"><Skeleton className="h-9 w-56 max-w-[70%] rounded-lg" /><Skeleton className="h-4 w-[34rem] max-w-full" /></div>{action && <Skeleton className="h-10 w-full shrink-0 rounded-lg sm:w-36" />}</div>;
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('rounded-2xl border bg-card shadow-sm', className)}>{children}</div>;
}

function CardHeader({ description = true }: { description?: boolean }) {
  return <div className="space-y-2 border-b p-5 sm:p-6"><Skeleton className="h-5 w-44" />{description && <Skeleton className="h-3.5 w-[28rem] max-w-full" />}</div>;
}

function Table({ rows = 5 }: { rows?: number }) {
  return <div className="space-y-3 p-4 sm:p-6"><Skeleton className="h-9 w-full rounded-lg opacity-70" />{blocks(rows, 'h-14 w-full rounded-xl')}</div>;
}

function Metrics({ count = 4, className }: { count?: number; className?: string }) {
  return <div className={cn('grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4', className)}>{blocks(count, 'h-28 rounded-2xl')}</div>;
}

function BookingsSkeleton() {
  return <><Card className="p-4 sm:p-5"><div className="mb-4 flex items-center gap-3"><Skeleton className="h-9 w-9 rounded-xl" /><div className="space-y-2"><Skeleton className="h-4 w-36" /><Skeleton className="h-3 w-64 max-w-[60vw]" /></div></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5"><Skeleton className="h-10 rounded-lg xl:col-span-2" />{blocks(3, 'h-10 rounded-lg')}<Skeleton className="h-10 rounded-lg md:col-span-2 xl:col-span-2" /></div></Card><div className="grid gap-4 sm:grid-cols-3">{blocks(3, 'h-24 rounded-2xl')}</div><Card><CardHeader description={false} /><Table /></Card></>;
}

function ProfilesSkeleton() {
  return <><Skeleton className="h-9 w-full rounded-lg lg:w-[400px]" /><Card className="p-4 sm:p-5"><div className="mb-4 flex items-center gap-3"><Skeleton className="h-9 w-9 rounded-xl" /><div className="space-y-2"><Skeleton className="h-4 w-36" /><Skeleton className="h-3 w-60" /></div></div><div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]"><Skeleton className="h-10 rounded-lg" /><Skeleton className="h-10 rounded-lg" /></div></Card><Card><Table /></Card></>;
}

function ProfileSkeleton() {
  return <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]"><div className="space-y-6"><Card><CardHeader /><div className="flex items-center gap-4 p-6 pt-0"><Skeleton className="h-20 w-20 rounded-full" /><div className="flex-1 space-y-3"><Skeleton className="h-6 w-40" /><Skeleton className="h-4 w-56 max-w-full" /><Skeleton className="h-6 w-20 rounded-full" /></div></div></Card><Card><CardHeader /><div className="p-6 pt-0"><Skeleton className="h-10 w-full rounded-lg" /></div></Card></div><Card><CardHeader /><div className="space-y-5 p-6 pt-0">{blocks(3, 'h-16 w-full rounded-lg')}<div className="flex justify-end gap-2"><Skeleton className="h-10 w-24 rounded-lg" /><Skeleton className="h-10 w-32 rounded-lg" /></div></div></Card></div>;
}

function RevenueSkeleton() {
  return <><Card className="space-y-4 p-4 sm:p-5"><div className="flex flex-wrap gap-2">{blocks(5, 'h-9 w-16 rounded-lg')}</div><div className="grid max-w-2xl gap-3 sm:grid-cols-2">{blocks(2, 'h-14 rounded-lg')}</div></Card><Metrics /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{blocks(3, 'h-28 rounded-2xl')}</div><Card><CardHeader /><div className="p-5"><Skeleton className="h-56 w-full rounded-xl" /></div></Card><Card><CardHeader description={false} /><Table rows={4} /></Card></>;
}

function ScheduleSkeleton() {
  return <><Card className="flex flex-col gap-4 border-primary/15 bg-primary/[0.035] p-4 md:p-5 lg:flex-row lg:items-end lg:justify-between"><div className="space-y-2"><Skeleton className="h-3 w-36" /><Skeleton className="h-6 w-72 max-w-full" /><Skeleton className="h-4 w-[34rem] max-w-full" /></div><div className="flex gap-2"><Skeleton className="h-10 w-52 rounded-lg" /><Skeleton className="h-10 w-28 rounded-lg" /></div></Card><Card className="p-4 md:p-6"><div className="mb-6 grid gap-4 border-b pb-6 lg:grid-cols-[1fr_auto]"><div className="flex flex-wrap gap-3"><Skeleton className="h-10 w-24 rounded-lg" /><Skeleton className="h-10 w-64 rounded-lg" /><Skeleton className="h-10 w-52 rounded-lg" /></div><Skeleton className="h-10 w-36 rounded-lg" /></div><div className="overflow-hidden rounded-xl border"><Skeleton className="h-20 w-full rounded-none" />{Array.from({ length: 6 }).map((_, row) => <div key={row} className="grid grid-cols-[120px_1fr] gap-px border-t"><Skeleton className="h-[74px] rounded-none" /><div className="grid grid-cols-3 gap-2 p-2 md:grid-cols-7">{blocks(7, 'h-14 rounded-lg')}</div></div>)}</div></Card></>;
}

function StorageSkeleton() {
  return <><Card><CardHeader /><div className="space-y-6 p-5 sm:p-6"><Metrics /><Skeleton className="h-4 w-full rounded-full" /><Skeleton className="h-20 w-full rounded-xl" /></div></Card><Card><CardHeader /><Table rows={4} /></Card></>;
}

function SocialSkeleton() {
  return <div className="grid items-start gap-5 xl:grid-cols-[390px_minmax(0,1fr)]"><Card><CardHeader /><div className="space-y-5 p-5"><Skeleton className="h-10 w-full rounded-lg" /><div className="space-y-2">{blocks(6, 'h-14 w-full rounded-xl')}</div><Skeleton className="h-11 w-full rounded-xl" /></div></Card><Card><CardHeader /><div className="grid min-h-[620px] place-items-center p-7"><Skeleton className="h-[500px] w-full max-w-[620px] rounded-xl" /></div></Card></div>;
}

function DashboardSkeleton() {
  return <><Metrics /><div className="grid gap-4 sm:grid-cols-2">{blocks(2, 'h-32 rounded-2xl')}</div><div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]"><Card><CardHeader /><div className="p-5"><Skeleton className="h-64 w-full rounded-xl" /></div></Card><Card><CardHeader /> <div className="space-y-3 p-5">{blocks(5, 'h-12 rounded-xl')}</div></Card></div></>;
}

function WidgetSkeleton() {
  return <><div className="grid gap-5 md:grid-cols-2">{blocks(4, 'h-72 rounded-[28px] bg-white/55')}</div><Skeleton className="mt-4 h-52 rounded-[28px] bg-white/55" /></>;
}

/** Initial loading state whose geometry mirrors the selected admin page. */
export function AdminPageSkeleton({ className, label = 'Loading page', layout = 'generic', showHeader = true }: AdminPageSkeletonProps) {
  const actionHeader = ['dashboard', 'bookings', 'management', 'profiles', 'promos', 'storage'].includes(layout);
  return <div className={cn('mx-auto w-full max-w-[1600px] space-y-6 px-4 pb-12 sm:px-6', className)} role="status" aria-label={label} aria-live="polite">
    {showHeader && <PageHeaderSkeleton action={actionHeader} />}
    {layout === 'dashboard' && <DashboardSkeleton />}
    {layout === 'bookings' && <BookingsSkeleton />}
    {layout === 'profile' && <ProfileSkeleton />}
    {layout === 'profiles' && <ProfilesSkeleton />}
    {layout === 'revenue' && <RevenueSkeleton />}
    {layout === 'schedule' && <ScheduleSkeleton />}
    {layout === 'storage' && <StorageSkeleton />}
    {layout === 'social' && <SocialSkeleton />}
    {layout === 'widget' && <WidgetSkeleton />}
    {(layout === 'management' || layout === 'promos' || layout === 'generic') && <Card><CardHeader /><Table rows={layout === 'promos' ? 6 : 5} /></Card>}
    <span className="sr-only">{label}</span>
  </div>;
}

/** Full-screen loader used only before the surrounding application shell is ready. */
export function AdminIconLoader({ className, label = 'Loading admin' }: AdminPageSkeletonProps) {
  return <div className={cn('grid min-h-screen w-full place-items-center bg-background', className)} role="status" aria-label={label} aria-live="polite"><img src="/assets/images/loading.png" alt="" className="page-loading-mascot" aria-hidden="true" /><span className="sr-only">{label}</span></div>;
}
