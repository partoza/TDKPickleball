import { useState } from 'react';
import { format, startOfMonth, subMonths } from 'date-fns';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArchiveBoxXMarkIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  CircleStackIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  TrashIcon,
} from '@heroicons/react/24/solid';
import { toast } from 'sonner';
import { storageService } from '@/services/storage';
import { getApiErrorMessage } from '@/services/api';
import { CleanupGranularity, CleanupPeriodPicker, cleanupPeriodBounds } from '@/components/admin/CleanupPeriodPicker';
import { getManilaDateAsLocalDate } from '@/lib/manila-time';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

const statusKey = ['database-storage-status'];
const historyKey = ['booking-cleanup-history'];
const retryStorageQuery = (failureCount: number, error: unknown) =>
  (error as { response?: { status?: number } })?.response?.status !== 404 && failureCount < 2;

export default function StoragePage() {
  const client = useQueryClient();
  const [setupOpen, setSetupOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const initialPeriod = format(startOfMonth(subMonths(getManilaDateAsLocalDate(), 1)), 'yyyy-MM-dd');
  const [granularity, setGranularity] = useState<CleanupGranularity>('month');
  const [fromAnchor, setFromAnchor] = useState(initialPeriod);
  const [throughAnchor, setThroughAnchor] = useState(initialPeriod);
  const fromDate = cleanupPeriodBounds(granularity, fromAnchor).start;
  const throughDate = cleanupPeriodBounds(granularity, throughAnchor).end;
  const validRange = fromDate <= throughDate;
  const statusQuery = useQuery({ queryKey: statusKey, queryFn: storageService.getStatus, retry: retryStorageQuery });
  const historyQuery = useQuery({ queryKey: historyKey, queryFn: storageService.getHistory, retry: retryStorageQuery });
  const previewQuery = useQuery({
    queryKey: ['booking-cleanup-preview', fromDate, throughDate],
    queryFn: () => storageService.getPreview(fromDate, throughDate),
    enabled: setupOpen && validRange,
    retry: retryStorageQuery,
  });

  const cleanup = useMutation({
    mutationFn: () => {
      if (!previewQuery.data?.data || previewQuery.data.data.fromDate !== fromDate || previewQuery.data.data.throughDate !== throughDate)
        throw new Error('The backend must be restarted before date-range cleanup can run.');
      return storageService.cleanup(fromDate, throughDate);
    },
    onSuccess: response => {
      if (!response.success) return toast.error(response.message);
      setConfirmOpen(false);
      setSetupOpen(false);
      client.invalidateQueries({ queryKey: statusKey });
      client.invalidateQueries({ queryKey: historyKey });
      client.invalidateQueries({ queryKey: ['bookings'] });
      toast.success(response.message || `${response.data?.deletedBookingCount ?? 0} completed bookings deleted`);
    },
    onError: error => toast.error(getApiErrorMessage(error, 'Completed bookings could not be deleted')),
  });

  const status = statusQuery.data?.data;
  const preview = previewQuery.data?.data;
  const hasMatchingPreview = preview?.fromDate === fromDate && preview?.throughDate === throughDate;
  const history = historyQuery.data?.data || [];
  const usedPercent = Math.min(100, status?.usedPercent ?? 0);
  const thresholdPercent = status ? Math.min(100, status.warningThresholdMegabytes / status.limitMegabytes * 100) : 87.9;

  return <div className="mx-auto max-w-[1400px] space-y-6 pb-12">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data storage</h1>
        <p className="mt-1 text-muted-foreground">Monitor SQL database usage and safely remove previous completed booking records.</p>
      </div>
      <Button variant="destructive" className="storage-delete-button" onClick={() => setSetupOpen(true)}>
        <TrashIcon className="h-4 w-4" />Delete completed data
      </Button>
    </div>

    {statusQuery.isLoading ? <Skeleton className="h-72 rounded-2xl" /> : status ? <Card className="overflow-hidden rounded-2xl">
      <CardHeader className="border-b bg-muted/20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div><CardTitle className="flex items-center gap-2"><CircleStackIcon className="h-5 w-5 text-primary" />SQL database usage</CardTitle><CardDescription>1 GB plan limit with a warning threshold at 900 MB.</CardDescription></div>
          <Badge className={cn('w-fit gap-1.5', status.isHealthy ? 'bg-emerald-600 hover:bg-emerald-600' : 'bg-red-600 hover:bg-red-600')}>
            {status.isHealthy ? <CheckCircleIcon className="h-3.5 w-3.5" /> : <ExclamationTriangleIcon className="h-3.5 w-3.5" />}
            {status.isHealthy ? 'Good' : 'Action needed'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Metric label="Database used" value={`${formatMb(status.usedMegabytes)} MB`} note={`${status.usedPercent.toFixed(1)}% of 1 GB`} />
          <Metric label="Warning threshold" value={`${formatMb(status.warningThresholdMegabytes)} MB`} note="Cleanup recommended at this point" />
          <Metric label="Completed bookings" value={status.completedBookingCount.toLocaleString()} note="Records available for cleanup" />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between text-xs font-medium"><span>0 MB</span><span>{formatMb(status.limitMegabytes)} MB limit</span></div>
          <div className="relative h-4 overflow-hidden rounded-full bg-muted">
            <div className={cn('h-full rounded-full transition-all', status.isHealthy ? 'bg-emerald-500' : 'bg-red-500')} style={{ width: `${usedPercent}%` }} />
            <span className="absolute inset-y-0 w-0.5 bg-amber-500" style={{ left: `${thresholdPercent}%` }} title="900 MB warning threshold" />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground"><span>Measured from used SQL data pages</span><span>900 MB threshold</span></div>
        </div>
        <div className={cn('flex gap-3 rounded-xl border p-4', status.isHealthy ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100' : 'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/30 dark:text-red-100')}>
          {status.isHealthy ? <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0" /> : <ShieldExclamationIcon className="mt-0.5 h-5 w-5 shrink-0" />}
          <div><p className="font-semibold">{status.isHealthy ? 'Storage level is good' : 'Storage has reached the warning threshold'}</p><p className="text-sm opacity-80">{status.isHealthy ? `You have ${(status.warningThresholdMegabytes - status.usedMegabytes).toFixed(2)} MB before cleanup is recommended.` : 'Delete older completed bookings now to reduce used database space.'}</p></div>
        </div>
      </CardContent>
    </Card> : <ErrorCard message={storageError(statusQuery.error, statusQuery.data?.message || 'Storage status is unavailable')} />}

    <Card className="rounded-2xl">
      <CardHeader><CardTitle className="flex items-center gap-2"><ClockIcon className="h-5 w-5 text-primary" />Deletion history</CardTitle><CardDescription>Permanent cleanup activity is retained as an audit record, including who performed it.</CardDescription></CardHeader>
      <CardContent>
        {historyQuery.isLoading ? <div className="space-y-3">{[1, 2, 3].map(item => <Skeleton key={item} className="h-12 rounded-xl" />)}</div> : historyQuery.isError ? <p className="text-sm text-destructive dark:text-white" role="alert">{storageError(historyQuery.error, 'Deletion history is unavailable.')}</p> : history.length ? <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader><TableRow><TableHead>Deleted on</TableHead><TableHead>Date range</TableHead><TableHead>Records</TableHead><TableHead>Receipts</TableHead><TableHead>Deleted by</TableHead></TableRow></TableHeader>
            <TableBody>{history.map(item => <TableRow key={item.id}>
              <TableCell className="whitespace-nowrap font-medium">{formatDateTime(item.deletedAtUtc)}</TableCell>
              <TableCell className="whitespace-nowrap">{item.selectedFromDate ? `${formatDate(item.selectedFromDate)} – ${formatDate(item.deletedThroughDate)}` : item.oldestBookingDate ? `${formatDate(item.oldestBookingDate)} – ${formatDate(item.deletedThroughDate)}` : `Through ${formatDate(item.deletedThroughDate)}`}</TableCell>
              <TableCell>{item.deletedBookingCount.toLocaleString()}</TableCell>
              <TableCell>{item.deletedReceiptCount.toLocaleString()}</TableCell>
              <TableCell><p className="font-medium">{item.deletedByName}</p><p className="text-xs text-muted-foreground">{item.deletedByEmail}</p></TableCell>
            </TableRow>)}</TableBody>
          </Table>
        </div> : <div className="grid place-items-center rounded-xl border border-dashed py-12 text-center"><ArchiveBoxXMarkIcon className="h-9 w-9 text-muted-foreground/50" /><p className="mt-3 font-medium">No deletion history yet</p><p className="text-sm text-muted-foreground">Completed booking cleanups will appear here.</p></div>}
      </CardContent>
    </Card>

    <Dialog open={setupOpen} onOpenChange={value => { if (!cleanup.isPending) setSetupOpen(value); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Choose completed booking data</DialogTitle><DialogDescription>Choose a booking-date range. Only records already marked Completed within that range can be deleted.</DialogDescription></DialogHeader>
        <div className="space-y-4">
          <div className="mac-segmented grid grid-cols-4 gap-0.5 rounded-lg p-0.5" aria-label="Cleanup date range type">
            {(['day', 'week', 'month', 'year'] as CleanupGranularity[]).map(mode => <Button key={mode} type="button" variant="ghost" onClick={() => setGranularity(mode)} className={cn('h-8 rounded-md px-2 text-xs capitalize shadow-none', granularity === mode ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : 'text-muted-foreground')}>{mode === 'day' ? 'Daily' : mode === 'week' ? 'Weekly' : mode === 'month' ? 'Monthly' : 'Yearly'}</Button>)}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><p className="mb-2 text-sm font-medium">From {granularity}</p><CleanupPeriodPicker mode={granularity} value={fromAnchor} onChange={setFromAnchor} /></div>
            <div><p className="mb-2 text-sm font-medium">Through {granularity}</p><CleanupPeriodPicker mode={granularity} value={throughAnchor} onChange={setThroughAnchor} /></div>
          </div>
          <p className="text-xs text-muted-foreground">Selected booking dates: {formatDate(fromDate)} – {formatDate(throughDate)}. Current periods are capped at today.</p>
          {!validRange && <p className="text-sm text-destructive dark:text-white" role="alert">The start period must be on or before the end period.</p>}
          <div className="rounded-xl border bg-muted/30 p-4">
            {!validRange ? <p className="text-sm text-muted-foreground">Choose a valid date range to see matching records.</p> : previewQuery.isFetching ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><ArrowPathIcon className="h-4 w-4 animate-spin" />Checking matching records…</div> : preview && hasMatchingPreview ? <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Completed bookings</span><strong>{preview.eligibleBookingCount.toLocaleString()}</strong></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Receipt files</span><strong>{preview.receiptCount.toLocaleString()}</strong></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Selected range</span><strong className="text-right">{formatDate(preview.fromDate)} – {formatDate(preview.throughDate)}</strong></div>
            </div> : <p className="text-sm text-destructive dark:text-white" role="alert">{preview && !hasMatchingPreview ? 'The backend must be restarted before date-range cleanup can run.' : storageError(previewQuery.error, previewQuery.data?.message || 'The preview could not be loaded.')}</p>}
          </div>
          <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900 dark:border-red-900 dark:bg-red-950/30 dark:text-red-100"><ShieldExclamationIcon className="h-5 w-5 shrink-0" /><p className="text-sm"><strong>Permanent action.</strong> Booking details and matching receipt files cannot be restored. The cleanup audit entry will remain.</p></div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setSetupOpen(false)}>Cancel</Button><Button variant="destructive" className="storage-delete-button" disabled={!validRange || !hasMatchingPreview || !preview?.eligibleBookingCount || previewQuery.isFetching} onClick={() => setConfirmOpen(true)}>Review permanent deletion</Button></div>
        </div>
      </DialogContent>
    </Dialog>

    <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>Delete {preview?.eligibleBookingCount ?? 0} completed bookings?</AlertDialogTitle><AlertDialogDescription>This permanently deletes completed bookings dated {formatDate(fromDate)} through {formatDate(throughDate)}, plus {preview?.receiptCount ?? 0} associated receipt files. This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel disabled={cleanup.isPending}>Go back</AlertDialogCancel><AlertDialogAction className="storage-delete-button bg-destructive hover:bg-destructive/90" disabled={cleanup.isPending} onClick={event => { event.preventDefault(); cleanup.mutate(); }}>{cleanup.isPending && <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />}Permanently delete</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>;
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return <div className="rounded-xl border bg-card p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-white">{label}</p><p className="mt-2 text-2xl font-bold dark:text-white">{value}</p><p className="mt-1 text-xs text-muted-foreground dark:text-white">{note}</p></div>;
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
