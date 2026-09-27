import { cn } from '@/lib/utils';

interface AdminPageSkeletonProps {
  className?: string;
  label?: string;
}

/** Shared initial-loading state for every admin page. */
export function AdminPageSkeleton({ className, label = 'Loading page' }: AdminPageSkeletonProps) {
  return (
    <div
      className={cn('mx-auto grid min-h-[60vh] w-full max-w-[1600px] place-items-center px-4 py-12 sm:px-6', className)}
      role="status"
      aria-label={label}
      aria-live="polite"
    >
      <img src="/assets/images/loading.png" alt="" className="page-loading-mascot" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
