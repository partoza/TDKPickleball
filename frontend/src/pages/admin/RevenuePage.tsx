import { useMemo, useState } from 'react';
import { endOfMonth, endOfWeek, endOfYear, format, startOfMonth, startOfWeek, startOfYear } from 'date-fns';
import { BanknotesIcon, CalendarDaysIcon, ChartBarIcon, ClockIcon, RectangleGroupIcon, TrophyIcon } from '@heroicons/react/24/solid';
import { useRevenue } from '@/hooks/useRevenue';
import { AdminDatePicker } from '@/components/admin/AdminFormControls';
import { DataCleanupButton } from '@/components/admin/DataCleanup';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TablePagination, TABLE_PAGE_SIZE } from '@/components/admin/TablePagination';
import { cn } from '@/lib/utils';

type RangePreset = 'today' | 'week' | 'month' | 'year' | 'custom';

const money = (value: number) => `₱${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const isoDate = (date: Date) => format(date, 'yyyy-MM-dd');

export default function RevenuePage() {
  const today = useMemo(() => new Date(), []);
  const [preset, setPreset] = useState<RangePreset>('month');
  const [fromDate, setFromDate] = useState(isoDate(startOfMonth(today)));
  const [throughDate, setThroughDate] = useState(isoDate(endOfMonth(today)));
  const [page, setPage] = useState(0);
  const report = useRevenue(fromDate, throughDate);
  const revenue = report.data?.data;

  const choosePreset = (next: Exclude<RangePreset, 'custom'>) => {
    setPreset(next);
    setPage(0);
    if (next === 'today') {
      setFromDate(isoDate(today));
      setThroughDate(isoDate(today));
    } else if (next === 'week') {
      setFromDate(isoDate(startOfWeek(today, { weekStartsOn: 1 })));
      setThroughDate(isoDate(endOfWeek(today, { weekStartsOn: 1 })));
    } else if (next === 'month') {
      setFromDate(isoDate(startOfMonth(today)));
      setThroughDate(isoDate(endOfMonth(today)));
    } else {
      setFromDate(isoDate(startOfYear(today)));
      setThroughDate(isoDate(endOfYear(today)));
    }
  };

  const maxGross = Math.max(1, ...(revenue?.daily.map(day => day.grossSales) || [1]));
  const rows = [...(revenue?.daily || [])].reverse();
  const paginatedRows = rows.slice(page * TABLE_PAGE_SIZE, (page + 1) * TABLE_PAGE_SIZE);

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 pb-12 sm:px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Revenue</h2>
          <p className="mt-1 text-muted-foreground">Track collected revenue, booked sales, outstanding balances, and sales by service.</p>
        </div>
        <DataCleanupButton />
      </div>

      <Card className="overflow-hidden">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap gap-2">
            {(['today', 'week', 'month', 'year'] as const).map(value => (
              <Button key={value} type="button" size="sm" variant={preset === value ? 'default' : 'outline'} className="capitalize" onClick={() => choosePreset(value)}>{value}</Button>
            ))}
            <Button type="button" size="sm" variant={preset === 'custom' ? 'default' : 'outline'} onClick={() => setPreset('custom')}>Custom</Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:max-w-2xl">
            <div><p className="mb-1.5 text-xs font-semibold text-muted-foreground">From date</p><AdminDatePicker value={fromDate} onChange={value => { setPreset('custom'); setFromDate(value); setPage(0); }} placeholder="Select start date" /></div>
            <div><p className="mb-1.5 text-xs font-semibold text-muted-foreground">Through date</p><AdminDatePicker value={throughDate} onChange={value => { setPreset('custom'); setThroughDate(value); setPage(0); }} placeholder="Select end date" /></div>
          </div>
        </CardContent>
      </Card>

      {report.isLoading ? (
        <div className="flex min-h-72 items-center justify-center"><LoadingIndicator size="lg" label="Loading revenue report" /></div>
      ) : report.isError || !revenue ? (
        <Card><CardContent className="flex min-h-48 flex-col items-center justify-center gap-4 text-center"><p className="text-sm text-red-600">Revenue data could not be loaded.</p><Button variant="outline" onClick={() => report.refetch()}>Try again</Button></CardContent></Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={BanknotesIcon} label="Collected revenue" value={money(revenue.collectedRevenue)} note="Payments received" tone="primary" />
            <MetricCard icon={ChartBarIcon} label="Gross booked sales" value={money(revenue.grossSales)} note={`${revenue.transactionCount} non-cancelled transaction${revenue.transactionCount === 1 ? '' : 's'}`} />
            <MetricCard icon={ClockIcon} label="Outstanding balance" value={money(revenue.outstandingBalance)} note={`${revenue.reservedCount} reservation${revenue.reservedCount === 1 ? '' : 's'} awaiting payment`} tone="amber" />
            <MetricCard icon={TrophyIcon} label="Collection rate" value={`${revenue.grossSales > 0 ? Math.min(100, (revenue.collectedRevenue / revenue.grossSales) * 100).toFixed(1) : '0.0'}%`} note={`${revenue.paidCount + revenue.completedCount} paid or completed`} tone="emerald" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SalesCard label="Court bookings" value={revenue.bookingSales} color="bg-primary" />
            <SalesCard label="Training" value={revenue.trainingSales} color="bg-orange-500" />
            <SalesCard label="Paddle rentals" value={revenue.paddleRentalSales} color="bg-emerald-500" note={`${revenue.paddleRentalCount} paddle rental${revenue.paddleRentalCount === 1 ? '' : 's'}`} />
          </div>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><ChartBarIcon className="h-5 w-5 text-primary" />Daily gross sales</CardTitle><p className="text-xs text-muted-foreground">Product sales value by booking date. Collected payments are shown separately in the table.</p></CardHeader>
            <CardContent>
              {revenue.daily.length === 0 ? <EmptyRevenue /> : (
                <div className="overflow-x-auto pb-2">
                  <div className="flex h-56 min-w-max items-end gap-2 border-b px-1 pt-6">
                    {revenue.daily.map(day => {
                      const totalHeight = Math.max(4, (day.grossSales / maxGross) * 168);
                      const bookingHeight = day.grossSales ? (day.bookingSales / day.grossSales) * totalHeight : 0;
                      const trainingHeight = day.grossSales ? (day.trainingSales / day.grossSales) * totalHeight : 0;
                      const paddleHeight = day.grossSales ? (day.paddleRentalSales / day.grossSales) * totalHeight : 0;
                      return <div key={day.date} className="flex w-9 shrink-0 flex-col items-center justify-end gap-1" title={`${format(new Date(`${day.date}T00:00:00`), 'MMM d')}: ${money(day.grossSales)}`}>
                        <span className="text-[9px] font-semibold text-muted-foreground">{day.grossSales >= 1000 ? `${(day.grossSales / 1000).toFixed(1)}k` : day.grossSales.toFixed(0)}</span>
                        <div className="flex w-6 flex-col-reverse overflow-hidden rounded-t-md bg-muted" style={{ height: `${totalHeight}px` }}>
                          <span className="bg-primary" style={{ height: `${bookingHeight}px` }} />
                          <span className="bg-orange-500" style={{ height: `${trainingHeight}px` }} />
                          <span className="bg-emerald-500" style={{ height: `${paddleHeight}px` }} />
                        </div>
                        <span className="text-[9px] text-muted-foreground">{format(new Date(`${day.date}T00:00:00`), 'd')}</span>
                      </div>;
                    })}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground"><Legend color="bg-primary" label="Bookings" /><Legend color="bg-orange-500" label="Training" /><Legend color="bg-emerald-500" label="Paddle rentals" /></div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><CalendarDaysIcon className="h-5 w-5 text-primary" />Daily revenue details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {rows.length === 0 ? <EmptyRevenue /> : <div className="overflow-x-auto rounded-xl border"><Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Bookings</TableHead><TableHead>Training</TableHead><TableHead>Paddles</TableHead><TableHead>Discounts</TableHead><TableHead>Gross sales</TableHead><TableHead>Collected</TableHead><TableHead>Outstanding</TableHead><TableHead className="text-right">Transactions</TableHead></TableRow></TableHeader><TableBody>{paginatedRows.map(day => <TableRow key={day.date}><TableCell className="font-semibold">{format(new Date(`${day.date}T00:00:00`), 'MMM d, yyyy')}</TableCell><TableCell>{money(day.bookingSales)}</TableCell><TableCell>{money(day.trainingSales)}</TableCell><TableCell>{money(day.paddleRentalSales)}</TableCell><TableCell className="text-rose-600">{money(-day.promoDiscounts)}</TableCell><TableCell className="font-semibold">{money(day.grossSales)}</TableCell><TableCell className="font-semibold text-emerald-600">{money(day.collectedRevenue)}</TableCell><TableCell className={cn('font-semibold', day.outstandingBalance > 0 ? 'text-amber-600' : 'text-muted-foreground')}>{money(day.outstandingBalance)}</TableCell><TableCell className="text-right">{day.transactionCount}</TableCell></TableRow>)}</TableBody></Table></div>}
              <TablePagination page={page} total={rows.length} onPageChange={setPage} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, note, tone = 'default' }: { icon: typeof BanknotesIcon; label: string; value: string; note: string; tone?: 'default' | 'primary' | 'amber' | 'emerald' }) {
  const tones = { default: 'bg-muted text-foreground', primary: 'bg-primary/10 text-primary', amber: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300', emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' };
  return <Card><CardContent className="flex items-start gap-4 p-5"><span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl', tones[tone])}><Icon className="h-5 w-5" /></span><div className="min-w-0"><p className="text-xs font-semibold text-muted-foreground">{label}</p><p className="mt-1 truncate text-2xl font-bold tracking-tight">{value}</p><p className="mt-1 text-xs text-muted-foreground">{note}</p></div></CardContent></Card>;
}

function SalesCard({ label, value, color, note }: { label: string; value: number; color: string; note?: string }) {
  return <Card><CardContent className="p-5"><div className="flex items-center gap-2"><span className={cn('h-2.5 w-2.5 rounded-full', color)} /><p className="text-sm font-semibold">{label}</p></div><p className="mt-3 text-2xl font-bold">{money(value)}</p><p className="mt-1 text-xs text-muted-foreground">{note || 'Gross sales after discounts'}</p></CardContent></Card>;
}

function Legend({ color, label }: { color: string; label: string }) { return <span className="inline-flex items-center gap-1.5"><span className={cn('h-2.5 w-2.5 rounded-sm', color)} />{label}</span>; }
function EmptyRevenue() { return <div className="flex min-h-32 flex-col items-center justify-center text-center"><RectangleGroupIcon className="h-8 w-8 text-muted-foreground/40" /><p className="mt-3 text-sm font-semibold">No sales in this date range</p><p className="mt-1 text-xs text-muted-foreground">Choose another range to view revenue.</p></div>; }
