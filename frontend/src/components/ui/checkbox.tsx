import * as React from 'react';
import { CheckIcon } from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';

export interface CheckboxProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ checked = false, onCheckedChange, className, disabled, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      role="checkbox"
      aria-checked={checked}
      data-state={checked ? 'checked' : 'unchecked'}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        'peer grid h-4 w-4 shrink-0 place-items-center rounded-[4px] border border-input bg-background text-primary-foreground shadow-sm transition-colors',
        'hover:border-primary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:cursor-not-allowed disabled:opacity-50',
        checked && 'border-primary bg-primary hover:border-primary hover:bg-primary/90',
        className,
      )}
      {...props}
    >
      <CheckIcon className={cn('h-3 w-3 stroke-[3] transition-all', checked ? 'scale-100 opacity-100' : 'scale-75 opacity-0')} />
    </button>
  ),
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };
