import { cn } from '@/lib/utils';

type LoadingIndicatorProps = {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
};

const sizes = {
  xs: 'h-3.5 w-3.5',
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-10 w-10',
};

export function LoadingIndicator({ size = 'sm', className, label = 'Loading' }: LoadingIndicatorProps) {
  return (
    <span className={cn('loading-indicator shrink-0', sizes[size], className)} role="status" aria-label={label}>
      <span className="sr-only">{label}</span>
    </span>
  );
}
