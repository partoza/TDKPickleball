import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import QRCode from 'react-qr-code';
import { Scanner } from '@yudiel/react-qr-scanner';
import { BarcodeDetector as BarcodeDetectorPonyfill } from 'barcode-detector/ponyfill';
import { EyeIcon as Eye, PlusIcon as Plus, QrCodeIcon as QrCode, ViewfinderCircleIcon as ScanLine, CalendarDaysIcon as CalendarClock, ArrowPathIcon as LoaderCircle, CheckIcon as Check, XMarkIcon as X, MagnifyingGlassIcon as Search, FunnelIcon as Filter, ArrowUpTrayIcon as Upload, TrashIcon as Trash } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { useAvailability, useBookings, useCancelBooking, useCompleteBooking, useConfirmBooking, useCreateBooking, useDeleteBooking, useRescheduleBooking, useVerifyBooking } from '@/hooks/useBookings';
import { useCourts } from '@/hooks/useCourts';
import { Booking, RateType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { AdminDatePicker, AdminTimeSelect, formatTimeLabel, TimeOption } from '@/components/admin/AdminFormControls';
import { useRates } from '@/hooks/useRates';
import { calculateRateQuote } from '@/lib/rate-calculation';

const emptyForm = { courtId: '', bookingDate: format(new Date(), 'yyyy-MM-dd'), startTime: '07:00', endTime: '08:00', customerName: '', email: '', phone: '', notes: '', amountPaid: '' as number | string, rateType: RateType.Booking };

export default function BookingsPage() {
  const { data: response, isLoading } = useBookings();
  const { data: courtsResponse } = useCourts();
  const { data: ratesResponse } = useRates();
  const bookings = response?.data || [];
  const courts = courtsResponse?.data || [];
  const rates = ratesResponse?.data || [];
  const [selected, setSelected] = useState<Booking | null>(null);
  const [qrBooking, setQrBooking] = useState<Booking | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [reschedule, setReschedule] = useState<Booking | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [scanResult, setScanResult] = useState<Booking | null>(null);
  const [scanError, setScanError] = useState('');
  const [search, setSearch] = useState('');
  const [courtFilter, setCourtFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [scheduleDate, setScheduleDate] = useState('');
  const create = useCreateBooking(); const move = useRescheduleBooking(); const verify = useVerifyBooking();
  const { data: availabilityResponse, isFetching: availabilityLoading } = useAvailability(form.bookingDate, form.courtId);
  const availability = availabilityResponse?.data;
  const markPaid = useConfirmBooking(); const cancel = useCancelBooking(); const complete = useCompleteBooking(); const remove = useDeleteBooking();
  const busy = create.isPending || move.isPending;
  const [page, setPage] = useState(0);
  const filteredBookings = useMemo(() => bookings
    .slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .filter(b => !search.trim() || `${b.bookingReference} ${b.customerName}`.toLowerCase().includes(search.trim().toLowerCase()))
    .filter(b => courtFilter === 'all' || String(b.courtId) === courtFilter)
    .filter(b => statusFilter === 'all' || b.status === statusFilter)
    .filter(b => paymentFilter === 'all' || (paymentFilter === 'paid' ? b.remainingBalance <= 0 : b.remainingBalance > 0))
    .filter(b => !scheduleDate || b.bookingDate === scheduleDate), [bookings, search, courtFilter, statusFilter, paymentFilter, scheduleDate]);
  const paginatedBookings = filteredBookings.slice(page * 10, (page + 1) * 10);
  const totalRemaining = useMemo(() => filteredBookings.reduce((sum, b) => sum + b.remainingBalance, 0), [filteredBookings]);
  const hasFilters = !!search || courtFilter !== 'all' || statusFilter !== 'all' || paymentFilter !== 'all' || !!scheduleDate;
  const validate = (includeContact = true) => {
    const errors: Record<string, string> = {};
    if (!form.courtId) errors.courtId = 'Select a court.';
    if (!form.bookingDate) errors.bookingDate = 'Date is required.';
    if (!form.startTime) errors.startTime = 'Select a start time.';
    if (!form.endTime) errors.endTime = 'Select an end time.';
    else if (form.endTime !== '00:00' && form.startTime >= form.endTime) errors.endTime = 'End time must be after start time.';
    if (includeContact && !form.customerName.trim()) errors.customerName = 'Booked by is required.';
    if (includeContact && form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Enter a valid email address.';
    if (includeContact && Number(form.amountPaid) < 0) errors.amountPaid = 'Amount paid cannot be negative.';
    if (includeContact && form.startTime && form.endTime && !calculateRateQuote(rates, form.startTime, form.endTime, form.rateType).covered) errors.rate = 'No active rate covers the complete selected time.';
    return errors;
  };
  const save = () => {
    const errors = validate(); setFormErrors(errors); if (Object.keys(errors).length) return;
    create.mutate(form, { onSuccess: r => { if (!r.success) return toast.error(r.message); toast.success(`Booking ${r.data?.bookingReference} saved`); setShowAdd(false); setForm(emptyForm); setFormErrors({}); }, onError: (e: any) => toast.error(e.response?.data?.message || 'Could not save booking') });
  };
  const saveReschedule = () => {
    if (!reschedule) return;
    const errors = validate(false); setFormErrors(errors); if (Object.keys(errors).length) return;
    move.mutate({ id: reschedule.id, payload: { courtId: Number(form.courtId), bookingDate: form.bookingDate, startTime: form.startTime, endTime: form.endTime } }, { onSuccess: r => { if (!r.success) return toast.error(r.message); toast.success('Booking rescheduled'); setReschedule(null); }, onError: (e: any) => toast.error(e.response?.data?.message || 'Could not reschedule') });
  };
  const act = (booking: Booking, action: 'paid'|'cancel'|'complete') => {
    const mutation = action === 'paid' ? markPaid : action === 'cancel' ? cancel : complete;
    mutation.mutate(booking.id, { onSuccess: () => toast.success(`Booking marked ${action}`), onError: () => toast.error('Action failed') });
  };
  const verifyReference = (value: string) => {
    setScanError('');
    verify.mutate(value, { onSuccess: r => {
      if (!r.success || !r.data) { setScanError('This booking QR is not valid or has been cancelled.'); return; }
      setShowScanner(false); setScanResult(r.data); toast.success('Booking verified');
    }, onError: () => setScanError('This booking QR is not valid or has been cancelled.') });
  };
  const uploadQr = async (file?: File) => {
    if (!file) return;
    setScanError('');
    try {
      const Detector = (window as any).BarcodeDetector || BarcodeDetectorPonyfill;
      const bitmap = await createImageBitmap(file);
      const codes = await new Detector({ formats: ['qr_code'] }).detect(bitmap);
      if (!codes.length) throw new Error('No QR code was found in this image.');
      verifyReference(codes[0].rawValue);
    } catch (error: any) { setScanError(error?.message || 'Unable to read this QR image.'); }
  };
  const clearFilters = () => { setSearch(''); setCourtFilter('all'); setStatusFilter('all'); setPaymentFilter('all'); setScheduleDate(''); setPage(0); };
  const deleteCancelled = (booking: Booking) => {
    if (!window.confirm(`Permanently delete ${booking.bookingReference}? This cannot be undone.`)) return;
    remove.mutate(booking.id, { onSuccess: r => r.success ? toast.success('Cancelled booking deleted') : toast.error(r.message), onError: () => toast.error('Booking could not be deleted') });
  };


  return <div className="space-y-6 max-w-[1500px] mx-auto">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-3xl font-bold tracking-tight">Bookings</h1><p className="text-slate-500 mt-1">Reservations, payments, rescheduling, and QR verification in one place.</p></div><div className="flex gap-2"><Button variant="outline" className="h-10 gap-2 bg-white font-semibold shadow-sm hover:bg-slate-50" onClick={() => setShowScanner(true)}><ScanLine className="h-4 w-4" />Scan QR</Button><Button onClick={() => { setForm(emptyForm); setShowAdd(true); }}><Plus className="h-4 w-4" />Add Booking</Button></div></div>
    <Card className="rounded-2xl overflow-hidden"><CardContent className="p-4 sm:p-5"><div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary"><Filter className="h-4 w-4" /></span><div><p className="font-semibold">Find a booking</p><p className="text-xs text-muted-foreground">Search and combine filters to narrow the records.</p></div></div>{hasFilters && <Button variant="ghost" size="sm" onClick={clearFilters}>Clear filters</Button>}</div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5"><div className="relative xl:col-span-2"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder="Reference or booked by" /></div><Select value={courtFilter} onValueChange={v => { setCourtFilter(v); setPage(0); }}><SelectTrigger><SelectValue placeholder="All courts" /></SelectTrigger><SelectContent><SelectItem value="all">All courts</SelectItem>{courts.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent></Select><Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(0); }}><SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="Reserved">Reservation</SelectItem><SelectItem value="Paid">Paid</SelectItem><SelectItem value="Cancelled">Cancelled</SelectItem><SelectItem value="Completed">Completed</SelectItem></SelectContent></Select><Select value={paymentFilter} onValueChange={v => { setPaymentFilter(v); setPage(0); }}><SelectTrigger><SelectValue placeholder="All payments" /></SelectTrigger><SelectContent><SelectItem value="all">All payments</SelectItem><SelectItem value="paid">Fully paid</SelectItem><SelectItem value="balance">Remaining balance</SelectItem></SelectContent></Select><div className="md:col-span-2 xl:col-span-2"><AdminDatePicker value={scheduleDate} onChange={v => { setScheduleDate(v); setPage(0); }} placeholder="Any schedule date" /></div></div></CardContent></Card>
    <div className="grid gap-4 sm:grid-cols-3"><Metric label="Matching bookings" value={filteredBookings.length.toString()} /><Metric label="Paid" value={filteredBookings.filter(b => b.status === 'Paid').length.toString()} /><Metric label="Remaining balance" value={`₱${totalRemaining.toLocaleString()}`} /></div>
    <Card className="rounded-2xl"><CardHeader><CardTitle>Booking records</CardTitle></CardHeader><CardContent>{isLoading ? <div className="space-y-3">{[1,2,3,4].map(x => <Skeleton key={x} className="h-14 w-full rounded-xl" />)}</div> : <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border hidden md:block"><Table><TableHeader><TableRow><TableHead>Reference</TableHead><TableHead>Booked by</TableHead><TableHead>Schedule</TableHead><TableHead>Payment</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
      {paginatedBookings.map(b => <TableRow key={b.id}><TableCell className="font-mono text-xs font-semibold">{b.bookingReference}</TableCell><TableCell><div className="font-medium">{b.customerName}</div><div className="text-xs text-slate-500">{b.email || 'No email'}{b.phone ? ` · ${b.phone}` : ''}</div></TableCell><TableCell><div className="flex flex-wrap items-center gap-2"><span>{b.courtName} · {format(new Date(`${b.bookingDate}T00:00:00`), 'MMM d, yyyy')}</span><BookingTypeBadge type={b.bookingType} /></div><div className="text-xs text-slate-500">{time(b.startTime)}–{time(b.endTime)}</div></TableCell><TableCell><div className="font-medium">₱{b.amountPaid.toLocaleString()} / ₱{b.totalAmount.toLocaleString()}</div><div className={b.remainingBalance ? 'text-xs text-amber-600' : 'text-xs text-emerald-600'}>{b.remainingBalance ? `₱${b.remainingBalance.toLocaleString()} remaining` : 'Fully paid'}</div></TableCell><TableCell><Badge className={b.status === 'Paid' ? 'bg-emerald-600 text-white' : b.status === 'Reserved' ? 'bg-amber-500 text-white' : b.status === 'Cancelled' ? 'bg-red-500 text-white' : ''}>{b.status}</Badge></TableCell><TableCell><div className="flex justify-end gap-1"><IconButton label="View" onClick={() => setSelected(b)}><Eye /></IconButton>{b.status !== 'Cancelled' && <IconButton label="QR" onClick={() => setQrBooking(b)}><QrCode /></IconButton>}{b.status !== 'Cancelled' && <IconButton label="Reschedule" onClick={() => { setForm({ ...emptyForm, courtId: String(b.courtId), bookingDate: b.bookingDate, startTime: b.startTime.slice(0,5), endTime: b.endTime.slice(0,5), rateType: b.bookingType || RateType.Booking }); setReschedule(b); }}><CalendarClock /></IconButton>}{b.status === 'Reserved' && <IconButton label="Mark paid" onClick={() => act(b, 'paid')}><Check /></IconButton>}{b.status === 'Reserved' && <IconButton label="Cancel" onClick={() => act(b, 'cancel')}><X /></IconButton>}{b.status === 'Cancelled' && <IconButton label="Delete" onClick={() => deleteCancelled(b)}><Trash /></IconButton>}</div></TableCell></TableRow>)}
      {!filteredBookings.length && <TableRow><TableCell colSpan={6} className="py-12 text-center text-slate-500">No bookings match these filters.</TableCell></TableRow>}
    </TableBody></Table></div>
    <div className="grid md:hidden gap-4">
      {paginatedBookings.map(b => (
        <div key={b.id} className="rounded-xl border p-4 space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-mono text-xs font-semibold text-primary">{b.bookingReference}</div>
              <div className="font-medium mt-0.5">{b.customerName}</div>
            </div>
            <div className="flex flex-col items-end gap-1.5"><Badge className={b.status === 'Paid' ? 'bg-emerald-600 text-white' : b.status === 'Reserved' ? 'bg-amber-500 text-white' : b.status === 'Cancelled' ? 'bg-red-500 text-white' : ''}>{b.status}</Badge><BookingTypeBadge type={b.bookingType} /></div>
          </div>
          <div className="text-sm text-muted-foreground flex justify-between">
            <div>
              <div>{b.courtName} · {format(new Date(`${b.bookingDate}T00:00:00`), 'MMM d')}</div>
              <div className="text-xs">{time(b.startTime)}–{time(b.endTime)}</div>
            </div>
            <div className="text-right">
              <div className="font-medium text-foreground">₱{b.amountPaid.toLocaleString()} / ₱{b.totalAmount.toLocaleString()}</div>
              <div className={b.remainingBalance ? 'text-xs text-amber-600' : 'text-xs text-emerald-600'}>{b.remainingBalance ? `₱${b.remainingBalance.toLocaleString()} remaining` : 'Fully paid'}</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <Button variant="outline" size="sm" className="flex-1 min-w-0" onClick={() => setSelected(b)}><Eye className="mr-1 h-3.5 w-3.5" /> View</Button>
            {b.status !== 'Cancelled' && <Button variant="outline" size="sm" className="flex-1 min-w-0" onClick={() => setQrBooking(b)}><QrCode className="mr-1 h-3.5 w-3.5" /> QR</Button>}
            {b.status !== 'Cancelled' && <Button variant="outline" size="sm" className="flex-1 min-w-[30%]" onClick={() => { setForm({ ...emptyForm, courtId: String(b.courtId), bookingDate: b.bookingDate, startTime: b.startTime.slice(0,5), endTime: b.endTime.slice(0,5), rateType: b.bookingType || RateType.Booking }); setReschedule(b); }}><CalendarClock className="mr-1 h-3.5 w-3.5" /> Move</Button>}
            {b.status === 'Reserved' && <Button variant="outline" size="sm" className="flex-1 min-w-[30%]" onClick={() => act(b, 'paid')}><Check className="mr-1 h-3.5 w-3.5" /> Paid</Button>}
            {b.status === 'Reserved' && <Button variant="outline" size="sm" className="flex-1 min-w-[30%] text-red-600" onClick={() => act(b, 'cancel')}><X className="mr-1 h-3.5 w-3.5" /> Cancel</Button>}
            {b.status === 'Cancelled' && <Button variant="outline" size="sm" className="flex-1 min-w-[30%] text-red-600" onClick={() => deleteCancelled(b)}><Trash className="mr-1 h-3.5 w-3.5" /> Delete</Button>}
          </div>
        </div>
      ))}
      {!filteredBookings.length && <div className="py-12 text-center text-slate-500">No bookings match these filters.</div>}
    </div>
    {filteredBookings.length > 10 && (
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-muted-foreground">Showing {page * 10 + 1} to {Math.min((page + 1) * 10, filteredBookings.length)} of {filteredBookings.length}</span>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>Prev</Button>
          <Button variant="outline" size="sm" disabled={(page + 1) * 10 >= filteredBookings.length} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      </div>
    )}
    </div>}</CardContent></Card>

    <Dialog open={showAdd} onOpenChange={open => { setShowAdd(open); if (!open) setFormErrors({}); }}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 flex flex-col max-h-[90vh] overflow-hidden">
        <div className="px-6 pt-6 pb-2 shrink-0">
          <DialogHeader>
            <DialogTitle>Add booking</DialogTitle>
            <DialogDescription>The booking immediately blocks the matching court schedule and sends an email confirmation.</DialogDescription>
          </DialogHeader>
        </div>
        <div className="px-6 overflow-y-auto custom-scrollbar flex-1 py-4">
          <BookingFields form={form} setForm={setForm} courts={courts} rates={rates} includeContact errors={formErrors} setErrors={setFormErrors} availability={availability} availabilityLoading={availabilityLoading} />
        </div>
        <div className="px-6 py-4 border-t border-slate-100 shrink-0 bg-white">
          <Button onClick={save} disabled={busy} className="w-full h-11 font-bold text-[14px]">
            Save Booking{busy && <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    <Dialog open={!!reschedule} onOpenChange={o => { if (!o) { setReschedule(null); setFormErrors({}); } }}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 flex flex-col max-h-[90vh] overflow-hidden">
        <div className="px-6 pt-6 pb-2 shrink-0">
          <DialogHeader>
            <DialogTitle>Reschedule {reschedule?.bookingReference}</DialogTitle>
            <DialogDescription>The old slots will be released after the new schedule passes conflict validation.</DialogDescription>
          </DialogHeader>
        </div>
        <div className="px-6 overflow-y-auto custom-scrollbar flex-1 py-4">
          <BookingFields form={form} setForm={setForm} courts={courts} rates={rates} errors={formErrors} setErrors={setFormErrors} availability={availability} availabilityLoading={availabilityLoading} currentBooking={reschedule} />
        </div>
        <div className="px-6 py-4 border-t border-slate-100 shrink-0 bg-white">
          <Button onClick={saveReschedule} disabled={busy} className="w-full h-11 font-bold text-[14px]">
            Reschedule Booking{busy && <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    <Dialog open={!!selected} onOpenChange={o => !o && setSelected(null)}><DialogContent><DialogHeader><DialogTitle>{selected?.bookingReference}</DialogTitle><DialogDescription>Complete booking details</DialogDescription></DialogHeader>{selected && <BookingDetails booking={selected} />}</DialogContent></Dialog>
    <Dialog open={!!qrBooking} onOpenChange={o => !o && setQrBooking(null)}><DialogContent className="sm:max-w-sm text-center"><DialogHeader><DialogTitle>Booking QR</DialogTitle><DialogDescription>Scan to verify {qrBooking?.bookingReference}</DialogDescription></DialogHeader>{qrBooking && <div className="mx-auto rounded-2xl border bg-white p-5"><QRCode value={qrBooking.bookingReference} size={220} /><p className="mt-4 font-mono font-bold text-slate-900">{qrBooking.bookingReference}</p></div>}</DialogContent></Dialog>
    <Dialog open={!!scanResult} onOpenChange={o => !o && setScanResult(null)}><DialogContent><DialogHeader><DialogTitle className="text-emerald-700">Valid booking</DialogTitle><DialogDescription>QR verification successful</DialogDescription></DialogHeader>{scanResult && <BookingDetails booking={scanResult} />}</DialogContent></Dialog>
    <Dialog open={showScanner} onOpenChange={open => { setShowScanner(open); if (open) setScanError(''); }}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Verify booking QR</DialogTitle><DialogDescription>Camera scanning is the fastest option, or upload a saved QR image.</DialogDescription></DialogHeader><div className="overflow-hidden rounded-2xl bg-black/5 aspect-square relative flex items-center justify-center">{showScanner && <Scanner onScan={result => { if (result?.[0]?.rawValue && !verify.isPending) verifyReference(result[0].rawValue); }} />}</div><label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border bg-background px-4 text-sm font-semibold shadow-sm transition-colors hover:bg-accent"><Upload className="h-4 w-4" />Upload QR image<input className="sr-only" type="file" accept="image/*" onChange={e => uploadQr(e.target.files?.[0])} /></label>{verify.isPending && <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">Verifying<LoaderCircle className="h-4 w-4 animate-spin" /></p>}{scanError && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-center text-sm font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300" role="alert">{scanError}</p>}</DialogContent></Dialog>
  </div>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border bg-card p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>; }
function IconButton({ label, onClick, children }: any) { return <Button size="icon" variant="ghost" title={label} onClick={onClick} className="h-8 w-8 [&_svg]:h-4 [&_svg]:w-4">{children}</Button>; }
function time(value: string) { return format(new Date(`2000-01-01T${value}`), 'h:mm a'); }
function BookingDetails({ booking: b }: { booking: Booking }) { return <div className="grid gap-3 rounded-xl border bg-slate-50 p-4 text-sm"><Detail k="Type" v={b.bookingType || RateType.Booking} /><Detail k="Booked by" v={b.customerName} /><Detail k="Email" v={b.email || '—'} /><Detail k="Phone" v={b.phone || '—'} /><Detail k="Court" v={b.courtName} /><Detail k="Schedule" v={`${format(new Date(`${b.bookingDate}T00:00:00`), 'MMMM d, yyyy')} · ${time(b.startTime)}–${time(b.endTime)}`} /><Detail k="Payment" v={`₱${b.amountPaid.toLocaleString()} paid · ₱${b.remainingBalance.toLocaleString()} remaining`} /><Detail k="Status" v={b.status} /></div>; }
function BookingTypeBadge({ type }: { type?: RateType }) { const value = type || RateType.Booking; return <Badge variant="outline" className={value === RateType.Training ? 'border-orange-200 bg-orange-50 text-orange-700' : 'border-primary/20 bg-primary/5 text-primary'}>{value}</Badge>; }
function Detail({ k, v }: { k: string; v: string }) { return <div className="flex justify-between gap-4"><span className="text-slate-500">{k}</span><span className="text-right font-medium">{v}</span></div>; }
function FieldError({ message }: { message?: string }) { return message ? <p className="field-error" role="alert">{message}</p> : null; }
function BookingFields({ form, setForm, courts, rates = [], includeContact = false, errors = {}, setErrors, availability, availabilityLoading, currentBooking }: any) {
  const set = (k: string, v: any) => { setForm((f: any) => ({ ...f, [k]: v })); setErrors?.((current: any) => ({ ...current, [k]: '', ...(k === 'startTime' ? { endTime: '' } : {}) })); };
  const currentRangeContains = (slot: any) => currentBooking && String(currentBooking.courtId) === form.courtId && currentBooking.bookingDate === form.bookingDate && slot.startTime.slice(0, 5) >= currentBooking.startTime.slice(0, 5) && slot.startTime.slice(0, 5) < currentBooking.endTime.slice(0, 5);
  const availableSlots = availability?.availableSlots || [];
  const occupiedSlots = availability?.occupiedSlots || [];
  const slots = [...availableSlots.map((slot: any) => ({ ...slot, occupied: false })), ...occupiedSlots.map((slot: any) => ({ ...slot, occupied: !currentRangeContains(slot) }))].sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));
  const startOptions: TimeOption[] = slots.map((slot: any) => ({ value: slot.startTime.slice(0, 5), label: formatTimeLabel(slot.startTime), disabled: slot.occupied, meta: slot.occupied ? 'Occupied' : 'Available' }));
  const startIndex = slots.findIndex((slot: any) => slot.startTime.slice(0, 5) === form.startTime);
  const endOptions: TimeOption[] = startIndex < 0 ? [] : slots.slice(startIndex).map((slot: any, index: number) => {
    const blocked = slots.slice(startIndex, startIndex + index + 1).some((candidate: any) => candidate.occupied);
    return { value: slot.endTime.slice(0, 5), label: formatTimeLabel(slot.endTime), disabled: blocked, meta: blocked ? 'Occupied' : 'Available' };
  });
  const timeDisabled = !form.courtId || !form.bookingDate || availabilityLoading;
  const quote = calculateRateQuote(rates, form.startTime, form.endTime, form.rateType || RateType.Booking);

  return <div className="grid gap-4 py-2">
    <div><Label>Court *</Label><Select value={form.courtId} onValueChange={v => { set('courtId', v); set('startTime', ''); set('endTime', ''); }}><SelectTrigger aria-invalid={!!errors.courtId} className={cn(errors.courtId && 'field-invalid')}><SelectValue placeholder="Select court" /></SelectTrigger><SelectContent>{courts.filter((c: any) => c.isActive).map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent></Select><FieldError message={errors.courtId} /></div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><div><Label>Date *</Label><AdminDatePicker invalid={!!errors.bookingDate} minDate={new Date()} value={form.bookingDate} onChange={value => { set('bookingDate', value); set('startTime', ''); set('endTime', ''); }} /><FieldError message={errors.bookingDate} /></div><div><Label>Start *</Label><AdminTimeSelect invalid={!!errors.startTime} value={form.startTime} onChange={value => { set('startTime', value); set('endTime', ''); }} options={startOptions} disabled={timeDisabled} placeholder={availabilityLoading ? 'Checking…' : 'Select start'} /><FieldError message={errors.startTime} /></div><div><Label>End *</Label><AdminTimeSelect invalid={!!errors.endTime} value={form.endTime} onChange={value => set('endTime', value)} options={endOptions} disabled={timeDisabled || !form.startTime} placeholder="Select end" /><FieldError message={errors.endTime} /></div></div>
    {form.courtId && form.bookingDate && !availabilityLoading && !slots.length && <p className="rounded-lg bg-primary/5 px-3 py-2 text-xs font-medium text-primary">No configured time slots are available for this court and date.</p>}
    {!!form.startTime && !!form.endTime && <div><div className={cn('rounded-xl border p-3.5', quote.covered ? 'border-primary/20 bg-primary/5' : 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20')}><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Calculated total</p><p className="mt-1 text-xs text-muted-foreground">{quote.covered ? quote.lines.map(line => `${Number.isInteger(line.hours) ? line.hours : line.hours.toFixed(2)} hr × ₱${line.pricePerHour.toLocaleString()} (${line.pricingId})`).join(' + ') : `No ${form.rateType || RateType.Booking} rate covers the complete time range.`}</p></div><p className="shrink-0 text-xl font-bold text-primary">{quote.covered ? `₱${quote.total.toLocaleString()}` : '—'}</p></div></div><FieldError message={errors.rate} /></div>}
    {includeContact && <><div><Label>Booking type *</Label><Select value={form.rateType} onValueChange={value => set('rateType', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={RateType.Booking}>Booking</SelectItem><SelectItem value={RateType.Training}>Training</SelectItem></SelectContent></Select></div><div><Label>Booked by *</Label><Input aria-invalid={!!errors.customerName} className={cn(errors.customerName && 'field-invalid')} value={form.customerName} onChange={e => set('customerName', e.target.value)} placeholder="e.g. John Doe" /><FieldError message={errors.customerName} /></div><div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><div><Label>Email</Label><Input aria-invalid={!!errors.email} className={cn(errors.email && 'field-invalid')} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="e.g. john@example.com" /><FieldError message={errors.email} /></div><div><Label>Phone</Label><Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="e.g. 09123456789" /></div></div><div><Label>Amount paid</Label><Input aria-invalid={!!errors.amountPaid} className={cn(errors.amountPaid && 'field-invalid')} type="number" min="0" value={form.amountPaid} onChange={e => set('amountPaid', e.target.value === '' ? '' : Number(e.target.value))} placeholder="0" /><FieldError message={errors.amountPaid} /></div><div><Label>Notes</Label><Input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional notes or requests" /></div></>}
  </div>;
}
