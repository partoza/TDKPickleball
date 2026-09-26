import { cn } from '@/lib/utils';

export function PaddleIcon({ className, forceLight = false }: { className?: string, forceLight?: boolean }) {
  return (
    <div className={cn('relative inline-flex items-center justify-center shrink-0', className)}>
      <img src="/assets/images/paddle-light.png" alt="Paddle" className={cn('w-full h-full object-contain', !forceLight && 'dark:hidden')} />
      {!forceLight && <img src="/assets/images/paddle-dark.png" alt="Paddle" className="w-full h-full object-contain hidden dark:block" />}
    </div>
  );
}
