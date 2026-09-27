import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface AdminPageSkeletonProps {
  className?: string;
  label?: string;
  layout?: 'dashboard' | 'table' | 'schedule' | 'generic';
}

/** Shared initial-loading state for every admin page. */
export function AdminPageSkeleton({ className, label = 'Loading page', layout = 'generic' }: AdminPageSkeletonProps) {
  return (
    <div
      className={cn('mx-auto w-full max-w-[1600px] space-y-6 px-4 pb-12 sm:px-6', className)}
      role="status"
      aria-label={label}
      aria-live="polite"
    >
      {/* Universal Header Skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-9 w-56 max-w-[70%] rounded-lg" />
        <Skeleton className="h-4 w-[32rem] max-w-full rounded-md" />
      </div>

      {layout === 'dashboard' && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 mt-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-28 rounded-2xl" />
            ))}
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
             <div className="col-span-2 rounded-2xl border bg-card p-4 sm:p-5 h-[360px] flex flex-col space-y-4">
               <Skeleton className="h-6 w-40 rounded-md" />
               <Skeleton className="flex-1 w-full rounded-xl" />
             </div>
             <div className="col-span-1 rounded-2xl border bg-card p-4 sm:p-5 h-[360px] flex flex-col space-y-4">
               <Skeleton className="h-6 w-40 rounded-md" />
               <Skeleton className="flex-1 w-full rounded-xl" />
             </div>
          </div>
        </>
      )}

      {layout === 'table' && (
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between gap-4">
            <Skeleton className="h-10 w-64 max-w-full rounded-xl" />
            <Skeleton className="h-10 w-32 rounded-xl hidden sm:block" />
          </div>
          <div className="rounded-2xl border bg-card p-0 shadow-sm overflow-hidden">
            <div className="border-b bg-muted/30 p-4">
               <Skeleton className="h-5 w-full rounded-md opacity-70" />
            </div>
            <div className="divide-y p-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full rounded-xl my-2" />
              ))}
            </div>
          </div>
        </div>
      )}

      {layout === 'schedule' && (
        <div className="mt-8">
          <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Skeleton className="h-12 w-full sm:w-64 rounded-xl" />
            <Skeleton className="h-10 w-full sm:w-48 rounded-xl" />
          </div>
          <div className="flex gap-4">
             <div className="hidden sm:block w-16 space-y-8 pt-16">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-4 w-12 rounded opacity-60" />)}
             </div>
             <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="space-y-4">
                     <Skeleton className="h-12 w-full rounded-xl" />
                     <Skeleton className="h-56 w-full rounded-2xl" />
                     <Skeleton className="h-32 w-full rounded-2xl" />
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}

      {layout === 'generic' && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 mt-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-28 rounded-2xl" />
            ))}
          </div>
          <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5 mt-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="space-y-2">
                <Skeleton className="h-5 w-40 rounded-md" />
                <Skeleton className="h-3.5 w-64 max-w-[55vw] rounded-md" />
              </div>
              <Skeleton className="h-9 w-24 rounded-lg" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          </div>
        </>
      )}

      <span className="sr-only">{label}</span>
    </div>
  );
}

/** Full-screen loader used only before the surrounding application shell is ready. */
export function AdminIconLoader({ className, label = 'Loading admin' }: AdminPageSkeletonProps) {
  return (
    <div
      className={cn('grid min-h-screen w-full place-items-center bg-background', className)}
      role="status"
      aria-label={label}
      aria-live="polite"
    >
      <img src="/assets/images/loading.png" alt="" className="page-loading-mascot" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  );
}