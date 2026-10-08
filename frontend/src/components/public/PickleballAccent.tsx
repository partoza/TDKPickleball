import { cn } from '@/lib/utils';

type PickleballAccentProps = {
  className?: string;
  decorative?: boolean;
};

export function PickleballAccent({ className, decorative = true }: PickleballAccentProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={cn('shrink-0', className)}
      aria-hidden={decorative || undefined}
      role={decorative ? undefined : 'img'}
    >
      {!decorative && <title>Pickleball</title>}
      <circle cx="60" cy="60" r="54" fill="#d9f900" />
      {[
        [38, 34], [65, 29], [82, 46], [42, 61],
        [69, 58], [84, 76], [55, 87],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="5.25" fill="#72151d" opacity=".9" />
      ))}
    </svg>
  );
}
