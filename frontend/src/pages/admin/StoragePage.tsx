import { useState } from 'react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import {
  ArchiveBoxXMarkIcon,
  CheckCircleIcon,
  CircleStackIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
} from '@heroicons/react/24/solid';
import { storageService } from '@/services/storage';
import { getApiErrorMessage } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { TablePagination } from '@/components/admin/TablePagination';
import { DataCleanupButton } from '@/components/admin/DataCleanup';

const statusKey = ['database-storage-status'];
const historyKey = ['booking-cleanup-history'];
const retryStorageQuery = (failureCount: number, error: unknown) =>
  (error as { response?: { status?: number } })?.response?.status !== 404 && failureCount < 2;

export default function StoragePage() {
  const [historyPage, setHistoryPage] = useState(0);
  
  const statusQuery = useQuery({ queryKey: statusKey, queryFn: storageService.getStatus, retry: retryStorageQuery });
  const historyQuery = useQuery({ queryKey: historyKey, queryFn: storageService.getHistory, retry: retryStorageQuery });

  const status = statusQuery.data?.data;
  const history = historyQuery.data?.data || [];
  const paginatedHistory = history.slice(historyPage * 10, (historyPage + 1) * 10);
  const usedPercent = Math.min(100, status?.usedPercent ?? 0);
  const thresholdPercent = status ? Math.min(100, status.warningThresholdMegabytes / status.limitMegabytes * 100) : 80;

  return <div className="space-y-6 max-w-[1600px] w-full mx-auto px-4 sm:px-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data storage</h1>
        <p className="mt-1 text-muted-foreground">Monitor TiDB/MySQL usage and manually remove elapsed schedule records when you choose. Pending reservations are always retained.</p>
      </div>
      <DataCleanupButton />
    </div>

    {statusQuery.isLoading ? <Skeleton className="h-72 rounded-2xl" /> : status ? <Card className="overflow-hidden rounded-2xl">
      <CardHeader className="border-b bg-muted/20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div><CardTitle className="flex items-center gap-2"><CircleStackIcon className="h-5 w-5 text-primary" />Database usage</CardTitle><CardDescription>TiDB/MySQL table and index usage with a 5 GB limit and warning threshold at 4 GB.</CardDescription></div>
          <Badge className={cn('w-fit gap-1.5', status.isHealthy ? 'bg-emerald-600 hover:bg-emerald-600' : 'bg-red-600 hover:bg-red-600')}>
            {status.isHealthy ? <CheckCircleIcon className="h-3.5 w-3.5" /> : <ExclamationTriangleIcon className="h-3.5 w-3.5" />}
            {status.isHealthy ? 'Good' : 'Action needed'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Metric label="Database used" value={`${formatMb(status.usedMegabytes)} MB`} note={`${status.usedPercent.toFixed(1)}% of 5 GB`} />
          <Metric label="Warning threshold" value={`${formatMb(status.warningThresholdMegabytes)} MB`} note="Cleanup recommended at this point" />
          <Metric label="Cleanup eligible" value={status.cleanupEligibleRecordCount.toLocaleString()} note="Elapsed schedules; reservations excluded" />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between text-xs font-medium"><span>0 MB</span><span>{formatMb(status.limitMegabytes)} MB limit</span></div>
          <div className="relative h-4 overflow-hidden rounded-full bg-muted">
            <div className={cn('h-full rounded-full transition-all', status.isHealthy ? 'bg-emerald-500' : 'bg-red-500')} style={{ width: `${usedPercent}%` }} />
            <span className="absolute inset-y-0 w-0.5 bg-amber-500" style={{ left: `${thresholdPercent}%` }} title="4 GB warning threshold" />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground"><span>Tables and indexes in the current database</span><span>4 GB threshold</span></div>
        </div>
        <div className={cn('flex gap-3 rounded-xl border p-4', status.isHealthy ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100' : 'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/30 dark:text-red-100')}>
          {status.isHealthy ? <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0" /> : <ShieldExclamationIcon className="mt-0.5 h-5 w-5 shrink-0" />}
          <div><p className="font-semibold">{status.isHealthy ? 'Storage level is good' : 'Storage has reached the warning threshold'}</p><p className="text-sm opacity-80">{status.isHealthy ? `You have ${(status.warningThresholdMegabytes - status.usedMegabytes).toFixed(2)} MB before cleanup is recommended.` : 'Delete eligible elapsed schedules now to reduce used database space.'}</p></div>
        </div>
      </CardContent>
    </Card> : <ErrorCard message={storageError(statusQuery.error, statusQuery.data?.message || 'Storage status is unavailable')} />}

    <Card className="rounded-2xl">
      <CardHeader><CardTitle className="flex items-center gap-2"><ClockIcon className="h-5 w-5 text-primary" />Deletion history</CardTitle><CardDescription>Permanent cleanup activity is retained as an audit record, including who performed it.</CardDescription></CardHeader>
      <CardContent>
        {historyQuery.isLoading ? <div className="space-y-3">{[1, 2, 3].map(item => <Skeleton key={item} className="h-12 rounded-xl" />)}</div> : historyQuery.isError ? <p className="text-sm text-destructive dark:text-white" role="alert">{storageError(historyQuery.error, 'Deletion history is unavailable.')}</p> : history.length ? <div className="overflow-x-auto rounded-xl border dark:border-white/10">
          <Table>
            <TableHeader><TableRow><TableHead>Deleted on</TableHead><TableHead>Date range</TableHead><TableHead>Records</TableHead><TableHead>Receipts</TableHead><TableHead>Deleted by</TableHead></TableRow></TableHeader>
            <TableBody>{paginatedHistory.map(item => <TableRow key={item.id}>
              <TableCell className="whitespace-nowrap font-medium">{formatDateTime(item.deletedAtUtc)}</TableCell>
              <TableCell className="whitespace-nowrap">{item.selectedFromDate ? `${formatDate(item.selectedFromDate)} – ${formatDate(item.deletedThroughDate)}` : `Through ${formatDate(item.deletedThroughDate)}`}</TableCell>
              <TableCell><p className="font-medium">{item.deletedScheduleCount.toLocaleString()} schedules</p><p className="text-xs text-muted-foreground">{item.deletedBookingCount.toLocaleString()} bookings</p></TableCell>
              <TableCell>{item.deletedReceiptCount.toLocaleString()}</TableCell>
              <TableCell><p className="font-medium">{item.deletedByName}</p><p className="text-xs text-muted-foreground">{item.deletedByEmail}</p></TableCell>
            </TableRow>)}</TableBody>
          </Table>
          <TablePagination page={historyPage} total={history.length} onPageChange={setHistoryPage} />
        </div> : <div className="grid place-items-center rounded-xl border border-dashed py-12 text-center"><ArchiveBoxXMarkIcon className="h-9 w-9 text-muted-foreground/50" /><p className="mt-3 font-medium">No deletion history yet</p><p className="text-sm text-muted-foreground">Schedule cleanups will appear here.</p></div>}
      </CardContent>
    </Card>
  </div>;
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return <div className="rounded-xl border dark:border-white/10 bg-card p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-white">{label}</p><p className="mt-2 text-2xl font-bold dark:text-white">{value}</p><p className="mt-1 text-xs text-muted-foreground dark:text-white">{note}</p></div>;
}

function ErrorCard({ message }: { message: string }) {
  return <Card className="rounded-2xl border-red-200"><CardContent className="flex gap-3 pt-6 text-red-700 dark:text-white"><ExclamationTriangleIcon className="h-5 w-5" /><p role="alert">{message}</p></CardContent></Card>;
}

function storageError(error: unknown, fallback: string) {
  if ((error as { response?: { status?: number } })?.response?.status === 404)
    return `${fallback} Restart the backend to load the new storage endpoints.`;
  return error ? getApiErrorMessage(error, fallback) : fallback;
}

function formatMb(value: number) { return value.toLocaleString(undefined, { maximumFractionDigits: 2 }); }
function formatDate(value: string) { return format(new Date(`${value}T00:00:00`), 'MMM d, yyyy'); }
function formatDateTime(value: string) { return format(new Date(value), 'MMM d, yyyy · h:mm a'); }
