import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface AdminPageSkeletonProps {
  className?: string;
  label?: string;
}

/** Shared initial-loading state for every admin page. */
export function AdminPageSkeleton({ className, label = 'Loading page' }: AdminPageSkeletonProps) {
  return (
    <div
      className={cn('mx-auto w-full max-w-[1600px] space-y-6 px-4 pb-12 sm:px-6', className)}
      role="status"
      aria-label={label}
      aria-live="polite"
    >
      <div className="space-y-3">
        <Skeleton className="h-9 w-56 max-w-[70%] rounded-lg" />
        <Skeleton className="h-4 w-[32rem] max-w-full rounded-md" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-2xl" />
        ))}
      </div>

      <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
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
