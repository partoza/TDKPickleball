import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useCreateBooking } from '@/hooks/useBookings';
import { useCourts } from '@/hooks/useCourts';
import { useRates } from '@/hooks/useRates';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import QRCode from 'react-qr-code';
import { TDK_ICON_URL } from '@/lib/branding';
import { Booking, RateType } from '@/types';
import { CheckCircleIcon as CheckCircle2, CheckIcon, ClockIcon as Clock3, ArrowPathIcon as LoaderCircle, QrCodeIcon as QrCode, ArrowUpTrayIcon as Upload } from '@heroicons/react/24/solid';
import { calculateRateQuote } from '@/lib/rate-calculation';
import { cn } from '@/lib/utils';
import { formatTimeLabel } from '@/components/admin/AdminFormControls';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/constants';
import { BookingBlocksEditor } from '@/components/booking/BookingBlocksEditor';
import { BookingBlockValue, createBookingBlock, hasBookingBlockErrors, validateBookingBlocks } from '@/lib/booking-blocks';

const BOOKING_DRAFT_KEY = 'tdk-public-booking-draft';

function FieldError({ message }: { message?: string }) { 
  return message ? <p className="text-[13px] text-red-500 font-medium mt-1.5">{message}</p> : null; 
}

function groupSlots(slots: any[]) {
  if (!slots || !slots.length) return [];
  const sorted = [...slots].sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  const blocks = [];
  let currentBlock: any = null;
  for (const slot of sorted) {
    if (!currentBlock) {
      currentBlock = { date: slot.date, startTime: slot.startTime.slice(0,5), endTime: slot.endTime.slice(0,5), courtId: String(slot.courtId ?? '') };
    } else {
      if (currentBlock.date === slot.date && currentBlock.courtId === String(slot.courtId ?? '') && currentBlock.endTime === slot.startTime.slice(0,5)) {
        currentBlock.endTime = slot.endTime.slice(0,5);
      } else {
        blocks.push(currentBlock);
        currentBlock = { date: slot.date, startTime: slot.startTime.slice(0,5), endTime: slot.endTime.slice(0,5), courtId: String(slot.courtId ?? '') };
      }
    }
  }
  if (currentBlock) blocks.push(currentBlock);
  return blocks;
}

export default function BookingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const pickedSlots = location.state?.pickedSlots || [];
  const { user, isLoading: authLoading } = useAuth();
  const isGoogleCustomer = user?.role === 'Customer';
  
  const [blocks, setBlocks] = useState<BookingBlockValue[]>([]);
  const [step, setStep] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<any>({});
  const [createdBookings, setCreatedBookings] = useState<Booking[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [receiptError, setReceiptError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [paymentExpiresAt, setPaymentExpiresAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(10 * 60);
  const [paymentQrUnavailable, setPaymentQrUnavailable] = useState(false);

  const { data: courtsRes } = useCourts();
  const courts = courtsRes?.data || [];
  const { data: ratesRes } = useRates();
  const rates = ratesRes?.data || [];
  const createBooking = useCreateBooking();

  useEffect(() => {
    let savedBlocks: any[] = [];
    try { savedBlocks = JSON.parse(sessionStorage.getItem(BOOKING_DRAFT_KEY) || '{}').blocks || []; } catch { savedBlocks = []; }
    const initial = pickedSlots.length ? groupSlots(pickedSlots) : savedBlocks;
    if (initial.length === 0) {
      setBlocks([createBookingBlock()]);
    } else {
      setBlocks(initial.map((block: Partial<BookingBlockValue>) => createBookingBlock(block)));
    }
  }, []);

  useEffect(() => {
    if (authLoading || !isGoogleCustomer || !user) return;
    setEmail(user.email);
    setCustomerName(current => current || `${user.firstName || ''} ${user.lastName || ''}`.trim());
    try {
      const draft = JSON.parse(sessionStorage.getItem(BOOKING_DRAFT_KEY) || '{}');
      if (Array.isArray(draft.blocks) && draft.blocks.length && draft.resumeStep === 2) {
        setBlocks(draft.blocks.map((block: Partial<BookingBlockValue>) => createBookingBlock(block)));
        setStep(2);
      }
    } catch { sessionStorage.removeItem(BOOKING_DRAFT_KEY); }
  }, [authLoading, isGoogleCustomer, user]);

  useEffect(() => {
    if (step !== 3 || !paymentExpiresAt) return;

    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((paymentExpiresAt - Date.now()) / 1000));
      setSecondsLeft(remaining);

      if (remaining === 0) {
        setBlocks([createBookingBlock()]);
        setCustomerName('');
        setEmail('');
        setPhone('');
        setNotes('');
        setReceipt(null);
        setReceiptError('');
        setErrors({});
        setPaymentExpiresAt(null);
        sessionStorage.removeItem(BOOKING_DRAFT_KEY);
        setSubmitError('Your payment time expired. The booking form was cleared.');
        navigate('/');
      }
    };

    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [step, paymentExpiresAt, navigate]);

  const validateStep1 = () => {
    const blockErrors = validateBookingBlocks(blocks, rates, RateType.Booking);
    setErrors({ blocks: blockErrors });
    return !hasBookingBlockErrors(blockErrors);
  };

  const validateStep2 = () => {
    let isValid = true;
    const newErrors: any = {};
    if (!customerName.trim()) { newErrors.customerName = 'Full name is required.'; isValid = false; }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { newErrors.email = 'Enter a valid email address.'; isValid = false; }
    
    setErrors(newErrors);
    return isValid;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      if (!isGoogleCustomer || !user) {
        sessionStorage.setItem(BOOKING_DRAFT_KEY, JSON.stringify({ blocks, resumeStep: 2 }));
        navigate(ROUTES.LOGIN);
        return;
      }
      setEmail(user.email);
      setCustomerName(current => current || `${user.firstName || ''} ${user.lastName || ''}`.trim());
      setStep(2);
      return;
    }
    if (step === 2 && validateStep2()) {
      const expiresAt = Date.now() + (10 * 60 * 1000);
      setPaymentExpiresAt(expiresAt);
      setSecondsLeft(10 * 60);
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
  };

  const handleReceiptChange = (file?: File) => {
    setReceiptError('');
    if (!file) {
      setReceipt(null);
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setReceipt(null);
      setReceiptError('Upload a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setReceipt(null);
      setReceiptError('The receipt image must be 5 MB or smaller.');
      return;
    }
    setReceipt(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receipt) {
      setReceiptError('Upload your payment receipt before confirming.');
      return;
    }
    setIsSubmitting(true);
    
    try {
      const results = await Promise.all(
        blocks.map(block => createBooking.mutateAsync({
          courtId: Number(block.courtId),
          bookingDate: block.date,
          startTime: block.startTime,
          endTime: block.endTime,
          customerName,
          email,
          phone,
          notes,
          rateType: RateType.Booking,
          amountPaid: 0,
          receipt
        }))
      );
      
      const successful = results.filter(r => r.success).map(r => r.data!);
      if (successful.length === 0) {
        setSubmitError("Failed to submit any bookings. Please try again.");
      } else {
        if (successful.length < blocks.length) {
          setSubmitError(`Successfully booked ${successful.length} out of ${blocks.length} blocks. Some failed.`);
        }
        setCreatedBookings(successful);
        setPaymentExpiresAt(null);
        sessionStorage.removeItem(BOOKING_DRAFT_KEY);
        setStep(4);
      }
    } catch (error: any) {
      setSubmitError(error.response?.data?.message || "Failed to submit bookings");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 4) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Card className="text-center p-8 border-green-200 bg-green-50/50 dark:bg-green-950/10 dark:border-green-900">
          <div className="h-20 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckIcon className="h-10 w-10" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl mb-4 text-green-800 dark:text-green-400">Booking Confirmed!</CardTitle>
          <CardDescription className="text-base text-green-700/80 dark:text-green-500/80 mb-8">
            Your courts have been successfully booked. Save the QR codes below for verification.
          </CardDescription>
          
          <div className="flex flex-wrap justify-center gap-6 mb-8">
            {createdBookings.map((b, i) => (
              <div key={i} className="rounded-2xl border bg-white p-5 max-w-[280px] w-full text-left">
                <p className="text-sm font-semibold mb-1 text-slate-900">{b.courtName}</p>
                <p className="text-xs text-slate-500 mb-4">{format(new Date(`${b.bookingDate}T00:00:00`), 'MMM d, yyyy')} · {formatTimeLabel(b.startTime)} - {formatTimeLabel(b.endTime)}</p>
                <div className="relative mx-auto mb-4 h-[150px] w-[150px]">
                  <QRCode value={b.bookingReference} size={150} level="H" />
                  <span className="absolute left-1/2 top-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-lg bg-white p-1.5 shadow-sm">
                    <img src={TDK_ICON_URL} alt="" className="h-full w-full object-contain" />
                  </span>
                </div>
                <p className="font-mono font-bold text-center text-slate-900">{b.bookingReference}</p>
                <p className="mt-1 text-center text-sm font-semibold text-slate-700">Booked for {b.customerName}</p>
              </div>
            ))}
          </div>

          <Button onClick={() => { setBlocks([createBookingBlock()]); setCreatedBookings([]); setCustomerName(''); setEmail(''); setPhone(''); setNotes(''); setReceipt(null); setReceiptError(''); setStep(1); }} className="mx-auto hover:scale-105 transition-all duration-200">
            Book Another Court
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Book a Court</h1>
        <p className="text-muted-foreground">Follow the steps below to reserve your pickleball court.</p>
      </div>

      <div className="mb-10 relative flex justify-between items-center px-2 sm:px-8">
        <div className="absolute top-4 sm:top-[18px] left-[15%] right-[15%] h-[2px] bg-slate-100 z-0 hidden sm:block"></div>
        
        {[
          { number: 1, label: 'Schedule' },
          { number: 2, label: 'Your details' },
          { number: 3, label: 'Pay & confirm' },
        ].map((s) => (
          <div key={s.number} className="relative z-10 flex flex-col sm:flex-row items-center gap-2 sm:gap-3 bg-transparent sm:bg-background px-2 sm:px-4">
            <div className={cn(
              'flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full border-2 text-xs sm:text-sm font-bold transition-colors', 
              step === s.number 
                ? 'border-primary bg-primary text-primary-foreground' 
                : step > s.number 
                  ? 'border-primary bg-primary text-primary-foreground' 
                  : 'border-slate-200 bg-white text-slate-400'
            )}>
              {step > s.number ? <CheckCircle2 className="h-5 w-5" /> : s.number}
            </div>
            <span className={cn(
              "text-[11px] sm:text-[14px] font-semibold",
              step === s.number ? 'text-primary' : step > s.number ? 'text-primary' : 'text-slate-400'
            )}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <Card>
        <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
          <CardHeader>
            <CardTitle>
              {step === 1 && "Select Schedule"}
              {step === 2 && "Your Details"}
              {step === 3 && "Pay with QR Ph"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Choose when and where you want to play. You can book multiple timeslots at once."}
              {step === 2 && "Provide your contact information for the reservation."}
              {step === 3 && "Scan the merchant QR, upload your receipt, and confirm before the timer ends."}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {step === 1 && (
              <div>
                <BookingBlocksEditor blocks={blocks} onChange={setBlocks} courts={courts} rates={rates} rateType={RateType.Booking} errors={errors?.blocks} />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Full Name *</Label>
                  <Input id="customerName" placeholder="e.g. Juan Dela Cruz" value={customerName} onChange={e => setCustomerName(e.target.value)} className={cn(errors.customerName && 'border-red-500 ring-red-500')} />
                  <FieldError message={errors.customerName} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address (optional)</Label>
                    <Input id="email" type="email" value={email} readOnly aria-readonly="true" className={cn('cursor-not-allowed bg-muted/60', errors.email && 'border-red-500 ring-red-500')} />
                    <p className="text-xs text-muted-foreground">Verified by Google and used for this booking.</p>
                    <FieldError message={errors.email} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" placeholder="e.g. 09171234567" value={phone} onChange={e => setPhone(e.target.value)} />
                    <FieldError message={errors.phone} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input id="notes" placeholder="Optional notes or requests" value={notes} onChange={e => setNotes(e.target.value)} />
                </div>

                <div className="mt-6 bg-muted/30 p-4 rounded-lg border">
                  <h4 className="font-semibold mb-3">Booking Summary</h4>
                  <div className="space-y-2 text-sm">
                    {blocks.map((b, i) => {
                      const quote = calculateRateQuote(rates, b.startTime, b.endTime, RateType.Booking);
                      return (
                        <div key={i} className="flex justify-between border-b last:border-0 pb-2 last:pb-0">
                          <div>
                            <span className="font-medium">{courts.find(c => String(c.id) === b.courtId)?.name || 'Court'}</span>
                            <span className="text-muted-foreground ml-2">
                              {format(new Date(`${b.date}T00:00:00`), 'MMM d')} · {format(new Date(`2000-01-01T${b.startTime}`), 'h:mm a')} - {format(new Date(`2000-01-01T${b.endTime}`), 'h:mm a')}
                            </span>
                          </div>
                          <span className="font-medium text-primary">
                            {quote.covered ? `₱${quote.total.toLocaleString()}` : '—'}
                          </span>
                        </div>
                      )
                    })}
                    <div className="mt-2 flex justify-between pt-2">
                      <span className="font-semibold">Total Amount:</span>
                      <span className="font-bold text-primary text-base">
                        ₱{blocks.reduce((acc, b) => {
                          const quote = calculateRateQuote(rates, b.startTime, b.endTime, RateType.Booking);
                          return acc + (quote.covered ? quote.total : 0);
                        }, 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <div className={cn('flex flex-col gap-3 rounded-2xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between', secondsLeft <= 60 ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300' : 'border-primary/20 bg-primary/5')}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-background shadow-sm"><Clock3 className="h-5 w-5 text-primary" /></span>
                    <div><p className="text-sm font-semibold">Payment window</p><p className="text-xs opacity-80">Your form clears automatically when time runs out.</p></div>
                  </div>
                  <span className="font-mono text-2xl font-bold tabular-nums">{String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:{String(secondsLeft % 60).padStart(2, '0')}</span>
                </div>

                <div className="grid gap-5 md:grid-cols-[0.9fr_1.1fr]">
                  <div className="rounded-2xl border bg-muted/20 p-5 text-center">
                    <div className="mx-auto mb-4 flex h-10 w-fit items-center gap-2 rounded-full bg-primary/10 px-4 text-sm font-semibold text-primary"><QrCode className="h-4 w-4" /> QR Ph</div>
                    {!paymentQrUnavailable ? (
                      <img src="/assets/images/payment-method.png" alt="Payment QR code" className="mx-auto aspect-square w-full max-w-[250px] rounded-2xl border bg-white object-contain p-3 shadow-sm" onError={() => setPaymentQrUnavailable(true)} />
                    ) : (
                      <div className="mx-auto flex aspect-square w-full max-w-[250px] flex-col items-center justify-center rounded-2xl border border-dashed bg-background p-6 text-muted-foreground">
                        <QrCode className="mb-3 h-16 w-16" />
                        <p className="text-sm font-semibold text-foreground">Merchant QR unavailable</p>
                        <p className="mt-1 text-xs">Please contact The Dirty Kitchen before paying.</p>
                      </div>
                    )}
                    <p className="mt-4 text-sm text-muted-foreground">Scan using any QR Ph-enabled banking or e-wallet app.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border bg-card p-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount to pay</p>
                      <p className="mt-1 text-xl font-bold text-primary">₱{blocks.reduce((total, block) => { const quote = calculateRateQuote(rates, block.startTime, block.endTime, RateType.Booking); return total + (quote.covered ? quote.total : 0); }, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      <p className="mt-2 text-sm text-muted-foreground">For {blocks.length} booking {blocks.length === 1 ? 'schedule' : 'schedules'}</p>
                    </div>

                    <div>
                      <Label htmlFor="receipt">Payment receipt *</Label>
                      <label htmlFor="receipt" className={cn('mt-2 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-8 text-center transition-colors hover:border-primary hover:bg-primary/5', receiptError ? 'border-red-400 bg-red-50/50 dark:bg-red-950/20' : receipt ? 'border-primary bg-primary/5' : 'border-border')}>
                        <Upload className="mb-3 h-7 w-7 text-primary" />
                        <span className="text-sm font-semibold">{receipt ? receipt.name : 'Choose receipt image'}</span>
                        <span className="mt-1 text-xs text-muted-foreground">JPG, PNG, or WebP · maximum 5 MB</span>
                        {receipt && <span className="mt-2 text-xs font-medium text-primary">{(receipt.size / 1024 / 1024).toFixed(2)} MB selected</span>}
                      </label>
                      <input id="receipt" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={event => handleReceiptChange(event.target.files?.[0])} />
                      <FieldError message={receiptError} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col border-t p-6 bg-slate-50/50 rounded-b-xl gap-4">
            {submitError && (
              <div className="w-full rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 text-center">
                {submitError}
              </div>
            )}
            <div className="flex justify-between w-full">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={step === 1 || isSubmitting}
                className="hover:scale-105 transition-all duration-200"
              >
                Back
              </Button>

              {step < 3 ? (
                <Button type="button" onClick={handleNext} className="hover:scale-105 transition-all duration-200">
                  Next Step
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting} className="hover:scale-105 transition-all duration-200">
                  Submit Receipt & Confirm
                  {isSubmitting && <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />}
                </Button>
              )}
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
