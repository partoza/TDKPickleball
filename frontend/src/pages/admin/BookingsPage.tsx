import { useEffect, useMemo, useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import QRCode from 'react-qr-code';
import { Scanner } from '@yudiel/react-qr-scanner';
import { BarcodeDetector as BarcodeDetectorPonyfill } from 'barcode-detector/ponyfill';
import { EyeIcon as Eye, PlusIcon as Plus, QrCodeIcon as QrCode, ViewfinderCircleIcon as ScanLine, CalendarDaysIcon as CalendarClock, ArrowPathIcon as LoaderCircle, CheckIcon as Check, XMarkIcon as X, MagnifyingGlassIcon as Search, FunnelIcon as Filter, ArrowUpTrayIcon as Upload, ArrowDownTrayIcon as Download, TrashIcon as Trash } from '@heroicons/react/24/solid';
import { toast } from 'sonner';
import { useAvailability, useBookings, useCancelBooking, useCompleteBooking, useConfirmBooking, useCreateBooking, useDeleteBooking, useRescheduleBooking, useVerifyBooking } from '@/hooks/useBookings';
import { useCourts } from '@/hooks/useCourts';
import { Booking, BookingStatus, RateType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { AdminDatePicker, AdminTimeSelect, formatTimeLabel, TimeOption } from '@/components/admin/AdminFormControls';
import { useRates } from '@/hooks/useRates';
import { calculateRateQuote } from '@/lib/rate-calculation';
import { isValidTimeRange } from '@/lib/time-range';
import { BookingBlocksEditor } from '@/components/booking/BookingBlocksEditor';
import { allocateBatchPayment, BookingBlockErrors, BookingBlockValue, bookingBlocksTotal, createBookingBlock, hasBookingBlockErrors, validateBookingBlocks } from '@/lib/booking-blocks';
import { getApiErrorMessage } from '@/services/api';
import { TDK_ICON_URL } from '@/lib/branding';
import { getManilaDate, getManilaDateAsLocalDate, isPastManilaStart } from '@/lib/manila-time';

const emptyForm = { courtId: '', bookingDate: getManilaDate(), startTime: '', endTime: '', customerName: '', email: '', phone: '', notes: '', amountPaid: '' as number | string, paymentStatus: BookingStatus.Paid, rateType: RateType.Booking };

export default function BookingsPage() {
  const { data: response, isLoading } = useBookings();
  const { data: courtsResponse } = useCourts();
  const { data: ratesResponse } = useRates();
  const bookings = response?.data || [];
  const courts = courtsResponse?.data || [];
  const rates = ratesResponse?.data || [];
  const [selected, setSelected] = useState<Booking | null>(null);
  const [qrBooking, setQrBooking] = useState<Booking | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const downloadQr = async () => {
    if (!qrBooking || !qrRef.current || downloading) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(qrRef.current, { backgroundColor: '#ffffff', scale: 2, useCORS: true });
      const data = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = data;
      a.download = `${qrBooking.bookingReference}-QR.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('Ticket downloaded');
    } catch (err) {
      console.error('Failed to download QR image', err);
      toast.error('Failed to download ticket');
    } finally {
      setDownloading(false);
    }
  };
  const [showAdd, setShowAdd] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [reschedule, setReschedule] = useState<Booking | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [addBlocks, setAddBlocks] = useState<BookingBlockValue[]>([createBookingBlock()]);
  const [blockErrors, setBlockErrors] = useState<BookingBlockErrors[]>([]);
  const [creatingBatch, setCreatingBatch] = useState(false);
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
  const busy = creatingBatch || create.isPending || move.isPending;
  const [page, setPage] = useState(0);
  const [clock, setClock] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const filteredBookings = useMemo(() => bookings
    .slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .filter(b => !search.trim() || `${b.bookingReference} ${b.customerName}`.toLowerCase().includes(search.trim().toLowerCase()))
    .filter(b => courtFilter === 'all' || String(b.courtId) === courtFilter)
    .filter(b => statusFilter === 'all' || b.status === statusFilter)
    .filter(b => paymentFilter === 'all' || (paymentFilter === 'paid' ? b.status !== 'Cancelled' && b.remainingBalance <= 0 : b.status !== 'Cancelled' && b.remainingBalance > 0))
    .filter(b => !scheduleDate || b.bookingDate === scheduleDate), [bookings, search, courtFilter, statusFilter, paymentFilter, scheduleDate]);
  const paginatedBookings = filteredBookings.slice(page * 10, (page + 1) * 10);
  const totalRemaining = useMemo(() => filteredBookings.reduce((sum, b) => b.status === 'Cancelled' ? sum : sum + b.remainingBalance, 0), [filteredBookings]);
  const addGrandTotal = bookingBlocksTotal(addBlocks, rates, form.rateType);
  const hasFilters = !!search || courtFilter !== 'all' || statusFilter !== 'all' || paymentFilter !== 'all' || !!scheduleDate;
  const validate = (includeContact = true) => {
    const errors: Record<string, string> = {};
    const selectedQuote = calculateRateQuote(rates, form.startTime, form.endTime, form.rateType);
    if (!form.courtId) errors.courtId = 'Select a court.';
    if (!form.bookingDate) errors.bookingDate = 'Date is required.';
    if (!form.startTime) errors.startTime = 'Select a start time.';
    else if (isPastManilaStart(form.bookingDate, form.startTime, new Date(clock))) errors.startTime = 'Start time has already passed in Manila.';
    if (!form.endTime) errors.endTime = 'Select an end time.';
    else if (!isValidTimeRange(form.startTime, form.endTime)) errors.endTime = 'End time must be at least 1 hour after start time.';
    if (includeContact && !form.customerName.trim()) errors.customerName = 'Booked by is required.';
    if (includeContact && form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Enter a valid email address.';
    if (includeContact && Number(form.amountPaid) < 0) errors.amountPaid = 'Amount paid cannot be negative.';
    else if (includeContact && selectedQuote.covered && Number(form.amountPaid) > selectedQuote.total) errors.amountPaid = `Amount paid cannot exceed the total of ₱${selectedQuote.total.toLocaleString()}.`;
    if (includeContact && form.startTime && form.endTime && !calculateRateQuote(rates, form.startTime, form.endTime, form.rateType).covered) errors.rate = 'No active rate covers the complete selected time.';
    return errors;
  };
  const save = async () => {
    const errors: Record<string, string> = {};
    if (!form.customerName.trim()) errors.customerName = 'Booked by is required.';
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Enter a valid email address.';
    if (form.paymentStatus === BookingStatus.Reserved && Number(form.amountPaid) < 0) errors.amountPaid = 'Reservation amount cannot be negative.';
    else if (form.paymentStatus === BookingStatus.Reserved && Number(form.amountPaid) > addGrandTotal) errors.amountPaid = `Reservation amount cannot exceed the total of ₱${addGrandTotal.toLocaleString()}.`;
    const nextBlockErrors = validateBookingBlocks(addBlocks, rates, form.rateType);
    setFormErrors(errors);
    setBlockErrors(nextBlockErrors);
    if (Object.keys(errors).length || hasBookingBlockErrors(nextBlockErrors)) return;

    setCreatingBatch(true);
    try {
      const batchAmount = form.paymentStatus === BookingStatus.Paid ? addGrandTotal : Number(form.amountPaid || 0);
      const allocatedPayments = allocateBatchPayment(addBlocks, rates, form.rateType, batchAmount);
      const results = [];
      for (const [index, block] of addBlocks.entries()) {
        results.push(await create.mutateAsync({
          courtId: Number(block.courtId), bookingDate: block.date, startTime: block.startTime, endTime: block.endTime,
          customerName: form.customerName, email: form.email, phone: form.phone, notes: form.notes,
          amountPaid: allocatedPayments[index], rateType: form.rateType,
        }));
      }
      const failed = results.find(result => !result.success);
      if (failed) { toast.error(failed.message || 'One or more bookings could not be saved'); return; }
      toast.success(`${results.length} ${results.length === 1 ? 'booking' : 'bookings'} saved`);
      setShowAdd(false); setForm(emptyForm); setAddBlocks([createBookingBlock()]); setFormErrors({}); setBlockErrors([]);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Could not save the bookings');
    } finally {
      setCreatingBatch(false);
    }
  };
  const saveReschedule = () => {
    if (!reschedule) return;
    if (!canReschedule(reschedule)) {
      toast.error('Rescheduling is available only within 24 hours after the booking was created.');
      setReschedule(null);
      return;
    }
    const errors = validate(false); setFormErrors(errors); if (Object.keys(errors).length) return;
    move.mutate({ id: reschedule.id, payload: { courtId: Number(form.courtId), bookingDate: form.bookingDate, startTime: form.startTime, endTime: form.endTime } }, { onSuccess: r => { if (!r.success) return toast.error(r.message); toast.success('Booking rescheduled'); setReschedule(null); }, onError: error => toast.error(getApiErrorMessage(error, 'Could not reschedule')) });
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
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-3xl font-bold tracking-tight">Bookings</h1><p className="text-slate-500 mt-1">Reservations, payments, rescheduling, and QR verification in one place.</p></div><div className="flex gap-2"><Button variant="outline" className="h-10 gap-2 bg-background font-semibold shadow-sm hover:bg-accent" onClick={() => setShowScanner(true)}><ScanLine className="h-4 w-4" />Scan QR</Button><Button onClick={() => { setForm(emptyForm); setAddBlocks([createBookingBlock()]); setFormErrors({}); setBlockErrors([]); setShowAdd(true); }}><Plus className="h-4 w-4" />Add Booking</Button></div></div>
    <Card className="rounded-2xl overflow-hidden"><CardContent className="p-4 sm:p-5"><div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary"><Filter className="h-4 w-4" /></span><div><p className="font-semibold">Find a booking</p><p className="text-xs text-muted-foreground">Search and combine filters to narrow the records.</p></div></div>{hasFilters && <Button variant="ghost" size="sm" onClick={clearFilters}>Clear filters</Button>}</div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5"><div className="relative xl:col-span-2"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder="Reference or booked by" /></div><Select value={courtFilter} onValueChange={v => { setCourtFilter(v); setPage(0); }}><SelectTrigger><SelectValue placeholder="All courts" /></SelectTrigger><SelectContent><SelectItem value="all">All courts</SelectItem>{courts.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent></Select><Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(0); }}><SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="Reserved">Reservation</SelectItem><SelectItem value="Paid">Paid</SelectItem><SelectItem value="Cancelled">Cancelled</SelectItem><SelectItem value="Completed">Completed</SelectItem></SelectContent></Select><Select value={paymentFilter} onValueChange={v => { setPaymentFilter(v); setPage(0); }}><SelectTrigger><SelectValue placeholder="All payments" /></SelectTrigger><SelectContent><SelectItem value="all">All payments</SelectItem><SelectItem value="paid">Fully paid</SelectItem><SelectItem value="balance">Remaining balance</SelectItem></SelectContent></Select><div className="md:col-span-2 xl:col-span-2"><AdminDatePicker value={scheduleDate} onChange={v => { setScheduleDate(v); setPage(0); }} placeholder="Any schedule date" /></div></div></CardContent></Card>
    <div className="grid gap-4 sm:grid-cols-3"><Metric label="Matching bookings" value={filteredBookings.length.toString()} /><Metric label="Paid" value={filteredBookings.filter(b => b.status === 'Paid').length.toString()} /><Metric label="Remaining balance" value={`₱${totalRemaining.toLocaleString()}`} /></div>
    <Card className="rounded-2xl"><CardHeader><CardTitle>Booking records</CardTitle></CardHeader><CardContent>{isLoading ? <div className="space-y-3">{[1,2,3,4].map(x => <Skeleton key={x} className="h-14 w-full rounded-xl" />)}</div> : <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border hidden md:block"><Table><TableHeader><TableRow><TableHead>Reference</TableHead><TableHead>Booked by</TableHead><TableHead>Schedule</TableHead><TableHead>Payment</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
      {paginatedBookings.map(b => <TableRow key={b.id}><TableCell className="font-mono text-xs font-semibold">{b.bookingReference}</TableCell><TableCell><div className="font-medium">{b.customerName}</div><div className="text-xs text-slate-500">{b.email || 'No email'}{b.phone ? ` · ${b.phone}` : ''}</div></TableCell><TableCell><div className="flex flex-wrap items-center gap-2"><span>{b.courtName} · {format(new Date(`${b.bookingDate}T00:00:00`), 'MMM d, yyyy')}</span><BookingTypeBadge type={b.bookingType} /></div><div className="text-xs text-slate-500">{time(b.startTime)}–{time(b.endTime)}</div></TableCell><TableCell><div className="font-medium">₱{b.amountPaid.toLocaleString()} / ₱{b.totalAmount.toLocaleString()}</div><BalanceStatus booking={b} /></TableCell><TableCell><Badge className={b.status === 'Paid' ? 'bg-emerald-600 text-white' : b.status === 'Reserved' ? 'bg-amber-500 text-white' : b.status === 'Cancelled' ? 'bg-red-500 text-white' : ''}>{b.status}</Badge></TableCell><TableCell><div className="flex justify-end gap-1"><IconButton label="View" onClick={() => setSelected(b)}><Eye /></IconButton>{b.status !== 'Cancelled' && <IconButton label="QR" onClick={() => setQrBooking(b)}><QrCode /></IconButton>}{canReschedule(b) && <IconButton label="Reschedule" onClick={() => { setForm({ ...emptyForm, courtId: String(b.courtId), bookingDate: b.bookingDate, startTime: b.startTime.slice(0,5), endTime: b.endTime.slice(0,5), rateType: b.bookingType || RateType.Booking }); setReschedule(b); }}><CalendarClock /></IconButton>}{b.status === 'Reserved' && <IconButton label="Mark paid" onClick={() => act(b, 'paid')}><Check /></IconButton>}{b.status === 'Reserved' && <IconButton label="Cancel" onClick={() => act(b, 'cancel')}><X /></IconButton>}{b.status === 'Cancelled' && <IconButton label="Delete" onClick={() => deleteCancelled(b)}><Trash /></IconButton>}</div></TableCell></TableRow>)}
      {!filteredBookings.length && <TableRow><TableCell colSpan={6} className="py-12 text-center text-slate-500">No bookings match these filters.</TableCell></TableRow>}
    </TableBody></Table></div>
    <div className="grid md:hidden gap-4">
      {paginatedBookings.map(b => (
        <div key={b.id} className="rounded-xl border dark:border-white/10 p-4 space-y-3">
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
              <BalanceStatus booking={b} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <Button variant="outline" size="sm" className="flex-1 min-w-0" onClick={() => setSelected(b)}><Eye className="mr-1 h-3.5 w-3.5" /> View</Button>
            {b.status !== 'Cancelled' && <Button variant="outline" size="sm" className="flex-1 min-w-0" onClick={() => setQrBooking(b)}><QrCode className="mr-1 h-3.5 w-3.5" /> QR</Button>}
            {canReschedule(b) && <Button variant="outline" size="sm" className="flex-1 min-w-[30%]" onClick={() => { setForm({ ...emptyForm, courtId: String(b.courtId), bookingDate: b.bookingDate, startTime: b.startTime.slice(0,5), endTime: b.endTime.slice(0,5), rateType: b.bookingType || RateType.Booking }); setReschedule(b); }}><CalendarClock className="mr-1 h-3.5 w-3.5" /> Move</Button>}
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

    <Dialog open={showAdd} onOpenChange={open => { setShowAdd(open); if (!open) { setFormErrors({}); setBlockErrors([]); } }}>
      <DialogContent className="sm:max-w-3xl p-0 gap-0 flex flex-col max-h-[90vh] overflow-hidden bg-background text-foreground">
        <div className="px-6 pt-6 pb-2 shrink-0">
          <DialogHeader>
            <DialogTitle>Add booking</DialogTitle>
            <DialogDescription>Add one or more schedules. Each block is checked for availability and overlap before saving.</DialogDescription>
          </DialogHeader>
        </div>
        <div className="px-6 overflow-y-auto custom-scrollbar flex-1 py-4">
          <div className="space-y-5">
            <BookingBlocksEditor blocks={addBlocks} onChange={blocks => { setAddBlocks(blocks); setBlockErrors([]); setFormErrors(current => ({...current, amountPaid: ''})); }} courts={courts} rates={rates} rateType={form.rateType} errors={blockErrors} />
            <section className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 shadow-sm sm:grid-cols-2 sm:p-5 dark:border-white/10 dark:bg-[#323234]">
              <div><Label>Booking type *</Label><Select value={form.rateType} onValueChange={value => { setForm({...form, rateType: value as RateType}); setBlockErrors([]); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={RateType.Booking}>Booking</SelectItem><SelectItem value={RateType.Training}>Training</SelectItem></SelectContent></Select></div>
              <div><Label>Booked by *</Label><Input aria-invalid={!!formErrors.customerName} className={cn(formErrors.customerName && 'field-invalid')} value={form.customerName} onChange={event => { setForm({...form, customerName: event.target.value}); setFormErrors(current => ({...current, customerName: ''})); }} placeholder="e.g. John Doe" /><FieldError message={formErrors.customerName} /></div>
              <div><Label>Email (optional)</Label><Input aria-invalid={!!formErrors.email} className={cn(formErrors.email && 'field-invalid')} type="email" value={form.email} onChange={event => { setForm({...form, email: event.target.value}); setFormErrors(current => ({...current, email: ''})); }} placeholder="e.g. john@example.com" /><FieldError message={formErrors.email} /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={event => setForm({...form, phone: event.target.value})} placeholder="e.g. 09123456789" /></div>
              <div><Label>Payment *</Label><Select value={form.paymentStatus} onValueChange={(paymentStatus: BookingStatus) => { setForm({...form, paymentStatus, amountPaid: paymentStatus === BookingStatus.Paid ? '' : form.amountPaid}); setFormErrors(current => ({...current, amountPaid: ''})); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={BookingStatus.Paid}>Paid</SelectItem><SelectItem value={BookingStatus.Reserved}>Reservation</SelectItem></SelectContent></Select></div>
              {form.paymentStatus === BookingStatus.Reserved && <div><Label>Reservation Amount</Label><Input aria-invalid={!!formErrors.amountPaid} className={cn(formErrors.amountPaid && 'field-invalid')} type="number" min="0" max={addGrandTotal} step="0.01" value={form.amountPaid} onChange={event => { setForm({...form, amountPaid: event.target.value === '' ? '' : Number(event.target.value)}); setFormErrors(current => ({...current, amountPaid: ''})); }} placeholder="0" /><FieldError message={formErrors.amountPaid} /></div>}
              <div className="sm:col-span-2"><Label>Notes</Label><Input value={form.notes} onChange={event => setForm({...form, notes: event.target.value})} placeholder="Optional notes applied to every booking" /></div>
            </section>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border shrink-0 bg-muted/40">
          <Button onClick={save} disabled={busy} className="w-full h-11 font-bold text-[14px]">
            Save {addBlocks.length} {addBlocks.length === 1 ? 'Booking' : 'Bookings'}{busy && <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    <Dialog open={!!reschedule} onOpenChange={o => { if (!o) { setReschedule(null); setFormErrors({}); } }}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 flex flex-col max-h-[90vh] overflow-hidden">
        <div className="px-6 pt-6 pb-2 shrink-0">
          <DialogHeader>
            <DialogTitle>Reschedule {reschedule?.bookingReference}</DialogTitle>
            <DialogDescription>Paid and reservation bookings can be rescheduled within 24 hours after they are created. Old slots are released only after the new schedule passes validation.</DialogDescription>
          </DialogHeader>
        </div>
        <div className="px-6 overflow-y-auto custom-scrollbar flex-1 py-4">
            <BookingFields form={form} setForm={setForm} courts={courts} rates={rates} errors={formErrors} setErrors={setFormErrors} availability={availability} availabilityLoading={availabilityLoading} currentBooking={reschedule} now={clock} />
        </div>
        <div className="px-6 py-4 border-t border-slate-100 shrink-0 bg-white">
          <Button onClick={saveReschedule} disabled={busy} className="w-full h-11 font-bold text-[14px]">
            Reschedule Booking{busy && <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    <Dialog open={!!selected} onOpenChange={o => !o && setSelected(null)}><DialogContent><DialogHeader><DialogTitle>{selected?.bookingReference}</DialogTitle><DialogDescription>Complete booking details</DialogDescription></DialogHeader>{selected && <BookingDetails booking={selected} />}</DialogContent></Dialog>
    <Dialog open={!!qrBooking} onOpenChange={o => !o && setQrBooking(null)}><DialogContent className="sm:max-w-sm text-center"><DialogHeader><DialogTitle>Booking QR</DialogTitle><DialogDescription>Scan to verify {qrBooking?.bookingReference}</DialogDescription></DialogHeader>{qrBooking && <div className="flex flex-col gap-4"><div ref={qrRef} className="mx-auto flex w-full flex-col items-center rounded-2xl border p-6" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#000000' }}><img src="/assets/images/tdk-logo.png" alt="TDK Logo" crossOrigin="anonymous" className="h-10 mb-6 object-contain" /><div className="relative mx-auto h-[220px] w-[220px] rounded-xl" style={{ backgroundColor: '#ffffff' }}><QRCode value={qrBooking.bookingReference} size={220} level="H" bgColor="#ffffff" fgColor="#000000" /><span className="absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-xl p-2 border" style={{ backgroundColor: '#ffffff', borderColor: '#f1f5f9' }}><img src={TDK_ICON_URL} alt="" crossOrigin="anonymous" className="h-full w-full object-contain" /></span></div><p className="mt-6 font-mono text-lg font-bold" style={{ color: '#000000' }}>{qrBooking.bookingReference}</p><p className="mt-1 text-sm" style={{ color: '#475569' }}>{qrBooking.customerName}</p></div><Button onClick={downloadQr} disabled={downloading} className="w-full">{downloading ? <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Downloading...</> : <><Download className="mr-2 h-4 w-4" /> Download Ticket</>}</Button></div>}</DialogContent></Dialog>
    <Dialog open={!!scanResult} onOpenChange={o => !o && setScanResult(null)}><DialogContent><DialogHeader><DialogTitle className="text-emerald-700">Valid booking</DialogTitle><DialogDescription>QR verification successful</DialogDescription></DialogHeader>{scanResult && <BookingDetails booking={scanResult} />}</DialogContent></Dialog>
    <Dialog open={showScanner} onOpenChange={open => { setShowScanner(open); if (open) setScanError(''); }}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Verify booking QR</DialogTitle><DialogDescription>Camera scanning is the fastest option, or upload a saved QR image.</DialogDescription></DialogHeader><div className="overflow-hidden rounded-2xl bg-black/5 aspect-square relative flex items-center justify-center">{showScanner && <Scanner onScan={result => { if (result?.[0]?.rawValue && !verify.isPending) verifyReference(result[0].rawValue); }} />}</div><label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border bg-background px-4 text-sm font-semibold shadow-sm transition-colors hover:bg-accent"><Upload className="h-4 w-4" />Upload QR image<input className="sr-only" type="file" accept="image/*" onChange={e => uploadQr(e.target.files?.[0])} /></label>{verify.isPending && <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">Verifying<LoaderCircle className="h-4 w-4 animate-spin" /></p>}{scanError && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-center text-sm font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300" role="alert">{scanError}</p>}</DialogContent></Dialog>
  </div>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border bg-card p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>; }
function IconButton({ label, onClick, children }: any) { return <TooltipProvider><Tooltip delayDuration={200}><TooltipTrigger asChild><Button size="icon" variant="ghost" onClick={onClick} className="h-8 w-8 [&_svg]:h-4 [&_svg]:w-4">{children}</Button></TooltipTrigger><TooltipContent className="bg-primary text-primary-foreground font-semibold rounded-lg px-2.5 py-1.5">{label}</TooltipContent></Tooltip></TooltipProvider>; }
function canReschedule(booking: Booking) {
  if (booking.status !== BookingStatus.Paid && booking.status !== BookingStatus.Reserved) return false;
  if (booking.rescheduledAt) return false;
  const createdAtValue = /(?:Z|[+-]\d{2}:\d{2})$/i.test(booking.createdAt) ? booking.createdAt : `${booking.createdAt}Z`;
  const createdAt = new Date(createdAtValue).getTime();
  const elapsed = Date.now() - createdAt;
  return Number.isFinite(createdAt) && elapsed >= 0 && elapsed <= 24 * 60 * 60 * 1000;
}
function time(value: string) { return format(new Date(`2000-01-01T${value}`), 'h:mm a'); }
function BookingDetails({ booking: b }: { booking: Booking }) { return <div className="grid gap-3 rounded-xl border bg-slate-50 p-4 text-sm"><Detail k="Type" v={b.bookingType || RateType.Booking} /><Detail k="Listed" v={format(new Date(b.createdAt), 'MMMM d, yyyy h:mm a')} /><Detail k="Booked by" v={b.customerName} /><Detail k="Email" v={b.email || '—'} /><Detail k="Phone" v={b.phone || '—'} /><Detail k="Court" v={b.courtName} /><Detail k="Schedule" v={`${format(new Date(`${b.bookingDate}T00:00:00`), 'MMMM d, yyyy')} · ${time(b.startTime)}–${time(b.endTime)}`} /><Detail k="Reschedule" v={b.rescheduledAt ? 'Used (one allowed)' : canReschedule(b) ? 'Available once within 24 hours' : 'Closed'} /><Detail k="Payment" v={b.status === 'Cancelled' ? `₱${b.amountPaid.toLocaleString()} paid · no remaining balance` : `₱${b.amountPaid.toLocaleString()} paid · ₱${b.remainingBalance.toLocaleString()} remaining`} /><Detail k="Status" v={b.status} /></div>; }
function BalanceStatus({ booking }: { booking: Booking }) { return booking.status === 'Cancelled' ? <div className="text-xs font-medium text-slate-500">Cancelled · no remaining balance</div> : <div className={booking.remainingBalance ? 'text-xs text-amber-600' : 'text-xs text-emerald-600'}>{booking.remainingBalance ? `₱${booking.remainingBalance.toLocaleString()} remaining` : 'Fully paid'}</div>; }
function BookingTypeBadge({ type }: { type?: RateType }) { const value = type || RateType.Booking; return <Badge variant="outline" className={value === RateType.Training ? 'border-orange-700 bg-orange-600 text-white' : 'border-primary bg-primary text-primary-foreground'}>{value}</Badge>; }
function Detail({ k, v }: { k: string; v: string }) { return <div className="flex justify-between gap-4"><span className="text-slate-500">{k}</span><span className="text-right font-medium">{v}</span></div>; }
function FieldError({ message }: { message?: string }) { return message ? <p className="field-error" role="alert">{message}</p> : null; }
function BookingFields({ form, setForm, courts, rates = [], includeContact = false, errors = {}, setErrors, availability, availabilityLoading, currentBooking, now = Date.now() }: any) {
  const set = (k: string, v: any) => { setForm((f: any) => ({ ...f, [k]: v })); setErrors?.((current: any) => ({ ...current, [k]: '', ...(k === 'startTime' ? { endTime: '' } : {}) })); };
  const currentRangeContains = (slot: any) => currentBooking && String(currentBooking.courtId) === form.courtId && currentBooking.bookingDate === form.bookingDate && slot.startTime.slice(0, 5) >= currentBooking.startTime.slice(0, 5) && slot.startTime.slice(0, 5) < currentBooking.endTime.slice(0, 5);
  const availableSlots = availability?.availableSlots || [];
  const occupiedSlots = availability?.occupiedSlots || [];
  const slots = [...availableSlots.map((slot: any) => ({ ...slot, occupied: false })), ...occupiedSlots.map((slot: any) => ({ ...slot, occupied: !currentRangeContains(slot) }))].sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));
  const startOptions: TimeOption[] = slots.map((slot: any) => {
    const past = isPastManilaStart(form.bookingDate, slot.startTime, new Date(now));
    return { value: slot.startTime.slice(0, 5), label: formatTimeLabel(slot.startTime), disabled: past || slot.occupied, meta: past ? 'Past' : slot.occupied ? 'Occupied' : 'Available' };
  });
  const startIndex = slots.findIndex((slot: any) => slot.startTime.slice(0, 5) === form.startTime);
  const endOptions: TimeOption[] = startIndex < 0 ? [] : slots.slice(startIndex).map((slot: any, index: number) => {
    const endValue = slot.endTime.slice(0, 5);
    const blocked = !isValidTimeRange(form.startTime, endValue) || slots.slice(startIndex, startIndex + index + 1).some((candidate: any) => candidate.occupied);
    return { value: slot.endTime.slice(0, 5), label: formatTimeLabel(slot.endTime), disabled: blocked, meta: blocked ? 'Occupied' : 'Available' };
  });
  const timeDisabled = !form.courtId || !form.bookingDate || availabilityLoading;
  const quote = calculateRateQuote(rates, form.startTime, form.endTime, form.rateType || RateType.Booking);

  return <div className="grid gap-4 py-2">
    <div><Label>Court *</Label><Select value={form.courtId} onValueChange={v => { set('courtId', v); set('startTime', ''); set('endTime', ''); }}><SelectTrigger aria-invalid={!!errors.courtId} className={cn(errors.courtId && 'field-invalid')}><SelectValue placeholder="Select court" /></SelectTrigger><SelectContent>{courts.filter((c: any) => c.isActive).map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent></Select><FieldError message={errors.courtId} /></div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><div><Label>Date *</Label><AdminDatePicker invalid={!!errors.bookingDate} minDate={getManilaDateAsLocalDate(new Date(now))} value={form.bookingDate} onChange={value => { set('bookingDate', value); set('startTime', ''); set('endTime', ''); }} /><FieldError message={errors.bookingDate} /></div><div><Label>Start *</Label><AdminTimeSelect invalid={!!errors.startTime} value={form.startTime} onChange={value => { set('startTime', value); set('endTime', ''); }} options={startOptions} disabled={timeDisabled} placeholder={availabilityLoading ? 'Checking…' : 'Select start'} /><FieldError message={errors.startTime} /></div><div><Label>End *</Label><AdminTimeSelect invalid={!!errors.endTime} value={form.endTime} onChange={value => set('endTime', value)} options={endOptions} disabled={timeDisabled || !form.startTime} placeholder="Select end" /><FieldError message={errors.endTime} /></div></div>
    {form.courtId && form.bookingDate && !availabilityLoading && !slots.length && <p className="rounded-lg bg-primary/5 px-3 py-2 text-xs font-medium text-primary">No configured time slots are available for this court and date.</p>}
    {!!form.startTime && !!form.endTime && <div><div className={cn('rounded-xl border p-3.5', quote.covered ? 'border-primary/20 bg-primary/5' : 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20')}><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Calculated total</p><p className="mt-1 text-xs text-muted-foreground">{quote.covered ? quote.lines.map(line => `${Number.isInteger(line.hours) ? line.hours : line.hours.toFixed(2)} hr × ₱${line.pricePerHour.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${line.pricingId})`).join(' + ') : `No ${form.rateType || RateType.Booking} rate covers the complete time range.`}</p></div><p className="shrink-0 text-base font-bold text-primary">{quote.covered ? `₱${quote.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}</p></div></div><FieldError message={errors.rate} /></div>}
    {includeContact && <><div><Label>Booking type *</Label><Select value={form.rateType} onValueChange={value => set('rateType', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={RateType.Booking}>Booking</SelectItem><SelectItem value={RateType.Training}>Training</SelectItem></SelectContent></Select></div><div><Label>Booked by *</Label><Input aria-invalid={!!errors.customerName} className={cn(errors.customerName && 'field-invalid')} value={form.customerName} onChange={e => set('customerName', e.target.value)} placeholder="e.g. John Doe" /><FieldError message={errors.customerName} /></div><div><Label>Email (optional)</Label><Input aria-invalid={!!errors.email} className={cn(errors.email && 'field-invalid')} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="e.g. john@example.com" /><FieldError message={errors.email} /></div><div><Label>Phone</Label><Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="e.g. 09123456789" /></div><div><Label>Amount paid</Label><Input aria-invalid={!!errors.amountPaid} className={cn(errors.amountPaid && 'field-invalid')} type="number" min="0" max={quote.covered ? quote.total : undefined} step="0.01" value={form.amountPaid} onChange={e => set('amountPaid', e.target.value === '' ? '' : Number(e.target.value))} placeholder="0" /><FieldError message={errors.amountPaid} /></div><div><Label>Notes</Label><Input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional notes or requests" /></div></>}
  </div>;
}
