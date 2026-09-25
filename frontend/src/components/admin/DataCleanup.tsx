import { useState } from 'react';
import { format, startOfMonth, subMonths } from 'date-fns';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldExclamationIcon, TrashIcon } from '@heroicons/react/24/solid';
import { toast } from 'sonner';
import { storageService } from '@/services/storage';
import { getApiErrorMessage } from '@/services/api';
import { CleanupGranularity, CleanupPeriodPicker, cleanupPeriodBounds } from '@/components/admin/CleanupPeriodPicker';
import { getManilaDateAsLocalDate } from '@/lib/manila-time';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import { cn } from '@/lib/utils';

const retryStorageQuery = (failureCount: number, error: unknown) =>
  (error as { response?: { status?: number } })?.response?.status !== 404 && failureCount < 2;

function storageError(error: unknown, fallback: string) {
  if ((error as { response?: { status?: number } })?.response?.status === 404)
    return `${fallback} Restart the backend to load the new storage endpoints.`;
  return error ? getApiErrorMessage(error, fallback) : fallback;
}
function formatDate(value: string) { return format(new Date(`${value}T00:00:00`), 'MMM d, yyyy'); }

export function DataCleanupButton({ className }: { className?: string }) {
  const client = useQueryClient();
  const [setupOpen, setSetupOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [granularity, setGranularity] = useState<CleanupGranularity>('month');
  const initialPeriod = format(startOfMonth(subMonths(getManilaDateAsLocalDate(), 1)), 'yyyy-MM-dd');
  const [fromAnchor, setFromAnchor] = useState(initialPeriod);
  const [throughAnchor, setThroughAnchor] = useState(initialPeriod);
  
  const fromDate = cleanupPeriodBounds(granularity, fromAnchor).start;
  const throughDate = cleanupPeriodBounds(granularity, throughAnchor).end;
  const validRange = fromDate <= throughDate;

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
      client.invalidateQueries({ queryKey: ['database-storage-status'] });
      client.invalidateQueries({ queryKey: ['booking-cleanup-history'] });
      client.invalidateQueries({ queryKey: ['bookings'] });
      client.invalidateQueries({ queryKey: ['admin-revenue'] });
      toast.success(response.message || `${response.data?.deletedScheduleCount ?? 0} elapsed schedule records deleted`);
    },
    onError: error => toast.error(getApiErrorMessage(error, 'Elapsed schedule records could not be deleted')),
  });

  const preview = previewQuery.data?.data;
  const hasMatchingPreview = preview?.fromDate === fromDate && preview?.throughDate === throughDate;

  return (
    <>
      <Button variant="destructive" className={cn("storage-delete-button", className)} onClick={() => setSetupOpen(true)}>
        <TrashIcon className="h-4 w-4 mr-2" />Delete elapsed schedule data
      </Button>

      <Dialog open={setupOpen} onOpenChange={value => { if (!cleanup.isPending) setSetupOpen(value); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Choose schedule data</DialogTitle><DialogDescription>Choose a schedule-date range. Elapsed booked, training, internal, and unavailable records are eligible. Pending reservations remain stored.</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="mac-segmented grid grid-cols-4 gap-0.5 rounded-lg p-0.5" aria-label="Cleanup date range type">
              {(['day', 'week', 'month', 'year'] as CleanupGranularity[]).map(mode => <Button key={mode} type="button" variant="ghost" aria-pressed={granularity === mode} onClick={() => setGranularity(mode)} className={cn('h-8 rounded-md px-2 text-xs capitalize shadow-none', granularity === mode ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90' : 'text-muted-foreground')}>{mode === 'day' ? 'Daily' : mode === 'week' ? 'Weekly' : mode === 'month' ? 'Monthly' : 'Yearly'}</Button>)}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><p className="mb-2 text-sm font-medium">From {granularity}</p><CleanupPeriodPicker mode={granularity} value={fromAnchor} onChange={setFromAnchor} /></div>
              <div><p className="mb-2 text-sm font-medium">Through {granularity}</p><CleanupPeriodPicker mode={granularity} value={throughAnchor} onChange={setThroughAnchor} /></div>
            </div>
            <p className="text-xs text-muted-foreground">Selected schedule dates: {formatDate(fromDate)} – {formatDate(throughDate)}. Current periods are capped at today.</p>
            {!validRange && <p className="text-sm text-destructive dark:text-white" role="alert">The start period must be on or before the end period.</p>}
            <div className="rounded-xl border dark:border-white/10 bg-muted/30 p-4">
              {!validRange ? <p className="text-sm text-muted-foreground">Choose a valid date range to see matching records.</p> : previewQuery.isFetching ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><LoadingIndicator label="Checking matching records" />Checking matching records…</div> : preview && hasMatchingPreview ? <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Elapsed schedules</span><strong>{preview.eligibleScheduleCount.toLocaleString()}</strong></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Related bookings</span><strong>{preview.eligibleBookingCount.toLocaleString()}</strong></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Receipt files</span><strong>{preview.receiptCount.toLocaleString()}</strong></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Selected range</span><strong className="text-right">{formatDate(preview.fromDate)} – {formatDate(preview.throughDate)}</strong></div>
              </div> : <p className="text-sm text-destructive dark:text-white" role="alert">{preview && !hasMatchingPreview ? 'The backend must be restarted before date-range cleanup can run.' : storageError(previewQuery.error, previewQuery.data?.message || 'The preview could not be loaded.')}</p>}
            </div>
            <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900 dark:border-red-900 dark:bg-red-950/30 dark:text-red-100"><ShieldExclamationIcon className="h-5 w-5 shrink-0" /><p className="text-sm"><strong>Permanent action.</strong> Eligible schedules, related non-reservation bookings, and matching receipt files cannot be restored. Pending reservations are excluded. The cleanup audit entry will remain.</p></div>
            <DialogFooter><Button variant="outline" onClick={() => setSetupOpen(false)}>Cancel</Button><Button variant="destructive" className="storage-delete-button" disabled={!validRange || !hasMatchingPreview || !preview?.eligibleScheduleCount || previewQuery.isFetching} onClick={() => setConfirmOpen(true)}>Review permanent deletion</Button></DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete {preview?.eligibleScheduleCount ?? 0} elapsed schedule records?</AlertDialogTitle><AlertDialogDescription>This permanently deletes eligible schedules dated {formatDate(fromDate)} through {formatDate(throughDate)}, {preview?.eligibleBookingCount ?? 0} related non-reservation bookings, and {preview?.receiptCount ?? 0} receipt files. Pending reservations remain. This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel disabled={cleanup.isPending}>Go back</AlertDialogCancel><AlertDialogAction className="storage-delete-button bg-destructive hover:bg-destructive/90" disabled={cleanup.isPending} onClick={event => { event.preventDefault(); cleanup.mutate(); }}>{cleanup.isPending && <LoadingIndicator className="mr-2" label="Deleting completed data" />}Permanently delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
