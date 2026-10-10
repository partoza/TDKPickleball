import { useEffect, useMemo, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import type { Booking } from '@/types';
import { Button } from '@/components/ui/button';
import { CustomerBookingCard } from '@/components/customer/CustomerBookingCard';

const BOOKINGS_PER_PAGE = 2;

interface CustomerBookingCarouselProps {
  bookings: Booking[];
  emptyMessage?: string;
  ariaLabel?: string;
}

export function CustomerBookingCarousel({
  bookings,
  emptyMessage = 'No bookings in this category.',
  ariaLabel = 'Booking history',
}: CustomerBookingCarouselProps) {
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(bookings.length / BOOKINGS_PER_PAGE));
  const bookingIds = useMemo(() => bookings.map(booking => booking.id).join(','), [bookings]);

  useEffect(() => {
    setPage(0);
  }, [bookingIds]);

  const visibleBookings = bookings.slice(
    page * BOOKINGS_PER_PAGE,
    page * BOOKINGS_PER_PAGE + BOOKINGS_PER_PAGE,
  );

  if (!bookings.length) {
    return <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">{emptyMessage}</div>;
  }

  return (
    <section aria-label={ariaLabel}>
      <div className="grid gap-4 md:grid-cols-2">
        {visibleBookings.map(booking => <CustomerBookingCard booking={booking} key={booking.id} />)}
      </div>

      {pageCount > 1 && (
        <nav aria-label={`${ariaLabel} pages`} className="mt-4 flex items-center justify-center gap-3 border-t border-border/60 pt-4">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-full"
            disabled={page === 0}
            onClick={() => setPage(current => Math.max(0, current - 1))}
            aria-label="Previous booking page"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <span className="min-w-24 text-center text-xs font-semibold text-muted-foreground" aria-live="polite">
            Page {page + 1} of {pageCount}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-full"
            disabled={page === pageCount - 1}
            onClick={() => setPage(current => Math.min(pageCount - 1, current + 1))}
            aria-label="Next booking page"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </nav>
      )}
    </section>
  );
}
