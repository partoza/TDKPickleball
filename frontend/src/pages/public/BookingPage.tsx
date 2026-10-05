import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';
import { useAvailablePublicPromos, useSubmitPublicBookingRequest, useValidatePublicPromo } from '@/hooks/useBookings';
import { useCourts } from '@/hooks/useCourts';
import { useRates } from '@/hooks/useRates';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DiscountType, PublicPromo, RateType } from '@/types';
import { CheckCircleIcon as CheckCircle2, CheckIcon, ClockIcon as Clock3, QrCodeIcon as QrCode, ArrowUpTrayIcon as Upload, ArrowDownTrayIcon as Download, HomeIcon as Home, CalendarDaysIcon as CalendarDays, CameraIcon as Camera, EnvelopeIcon as Envelope, MinusIcon, PlusIcon, TagIcon as Tag, ChatBubbleLeftRightIcon as ChatBubble } from '@heroicons/react/24/solid';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import { calculateRateQuote } from '@/lib/rate-calculation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { EXTERNAL_LINKS, ROUTES } from '@/lib/constants';
import { BookingBlocksEditor } from '@/components/booking/BookingBlocksEditor';
import { BookingBlockValue, createBookingBlock, hasBookingBlockErrors, validateBookingBlocks } from '@/lib/booking-blocks';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PaddleIcon } from '@/components/ui/paddle-icon';
import { usePublicBookingWindow } from '@/hooks/useSchedule';
import { formatAppDate, formatAppTime } from '@/lib/date-time';

const BOOKING_DRAFT_KEY = 'tdk-public-booking-draft';
const PADDLE_RENTAL_PRICE = 100;
const PAYMENT_WINDOW_SECONDS = 15 * 60;

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
  const [paddleQuantity, setPaddleQuantity] = useState(0);
  const [promoName, setPromoName] = useState('');
  const [nfcPromoCode, setNfcPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PublicPromo | null>(null);
  const [promoError, setPromoError] = useState('');
  const [errors, setErrors] = useState<any>({});
  const [requestReference, setRequestReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState('');
  const [receiptError, setReceiptError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [paymentExpiresAt, setPaymentExpiresAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(PAYMENT_WINDOW_SECONDS);
  const [paymentQrUnavailable, setPaymentQrUnavailable] = useState(false);
  const [receiptPreviewOpen, setReceiptPreviewOpen] = useState(false);
  const [isDownloadingConfirmation, setIsDownloadingConfirmation] = useState(false);
  const confirmationRef = useRef<HTMLDivElement>(null);

  const { data: courtsRes } = useCourts();
  const courts = courtsRes?.data || [];
  const { data: ratesRes } = useRates();
  const rates = ratesRes?.data || [];
  const { data: publicBookingWindowResponse } = usePublicBookingWindow();
  const bookingThroughDate = publicBookingWindowResponse?.data?.bookingThroughDate;
  const submitBookingRequest = useSubmitPublicBookingRequest();
  const validatePromo = useValidatePublicPromo();
  const { data: availablePromosResponse, isLoading: promosLoading } = useAvailablePublicPromos(isGoogleCustomer);
  const isNfcCustomer = availablePromosResponse?.data?.isNfcCustomer === true;
  const availableNfcPromos = availablePromosResponse?.data?.promos || [];
  const courtBookingTotal = blocks.reduce((total, block) => {
    const quote = calculateRateQuote(rates, block.startTime, block.endTime, RateType.Booking);
    return total + (quote.covered ? quote.total : 0);
  }, 0);
  const promoDiscount = appliedPromo ? blocks.reduce((total, block) => {
    const quote = calculateRateQuote(rates, block.startTime, block.endTime, RateType.Booking);
    if (!quote.covered) return total;
    const discount = appliedPromo.type === DiscountType.Percentage
      ? quote.total * (appliedPromo.value / 100)
      : appliedPromo.value;
    return total + Math.min(quote.total, Math.max(0, discount));
  }, 0) : 0;
  const paddleRentalFee = paddleQuantity * PADDLE_RENTAL_PRICE;
  const checkoutTotal = Math.max(0, courtBookingTotal - promoDiscount) + paddleRentalFee;

  useEffect(() => {
    if (appliedPromo?.remainingUsesThisMonth != null && appliedPromo.remainingUsesThisMonth < blocks.length) {
      setAppliedPromo(null);
      setPromoName('');
      setNfcPromoCode('');
      setPromoError(`That promo has fewer than ${blocks.length} uses remaining for this month.`);
    }
  }, [blocks.length, appliedPromo]);

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
    if (!receipt) {
      setReceiptPreviewUrl('');
      return;
    }

    const previewUrl = URL.createObjectURL(receipt);
    setReceiptPreviewUrl(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [receipt]);

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
        setPaddleQuantity(0);
        setPromoName('');
        setAppliedPromo(null);
        setPromoError('');
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
    if (bookingThroughDate) {
      const formattedCutoff = formatAppDate(bookingThroughDate);
      blocks.forEach((block, index) => {
        if (block.date && block.date > bookingThroughDate) {
          blockErrors[index] = { ...blockErrors[index], date: `Online bookings are open through ${formattedCutoff}.` };
        }
      });
    }
    setErrors({ blocks: blockErrors });
    return !hasBookingBlockErrors(blockErrors);
  };

  const validateStep2 = () => {
    let isValid = true;
    const newErrors: any = {};
    if (!customerName.trim()) { newErrors.customerName = 'Full name is required.'; isValid = false; }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { newErrors.email = 'Enter a valid email address.'; isValid = false; }
    if (!phone.trim()) { newErrors.phone = 'Contact number is required.'; isValid = false; }
    else if (!/^\+?[0-9][0-9\s\-()]{5,28}[0-9]$/.test(phone.trim()) || (phone.match(/\d/g) || []).length < 7) { newErrors.phone = 'Enter a valid contact number.'; isValid = false; }
    
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
      const expiresAt = Date.now() + (PAYMENT_WINDOW_SECONDS * 1000);
      setPaymentExpiresAt(expiresAt);
      setSecondsLeft(PAYMENT_WINDOW_SECONDS);
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

  const handleApplyPromo = async () => {
    const exactName = promoName.trim();
    setPromoError('');
    setAppliedPromo(null);
    setNfcPromoCode('');
    if (!exactName) {
      setPromoError('Enter the exact promo code.');
      return;
    }

    try {
      const result = await validatePromo.mutateAsync(exactName);
      if (!result.success || !result.data) {
        setPromoError(result.message || 'Promo code is invalid or unavailable.');
        return;
      }
      setAppliedPromo(result.data);
      setPromoName(result.data.code);
    } catch (error: any) {
      setPromoError(error.response?.data?.message || 'Promo code is invalid or unavailable.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receipt) {
      setReceiptError('Upload your payment receipt before sending the request.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await submitBookingRequest.mutateAsync({
        customerName,
        email,
        phone,
        notes,
        paddleRentalQuantity: paddleQuantity,
        promoCode: appliedPromo?.code,
        schedules: blocks,
        receipt: receipt!,
      });
      if (result.success && result.data) {
        setRequestReference(result.data.requestReference);
        setPaymentExpiresAt(null);
        sessionStorage.removeItem(BOOKING_DRAFT_KEY);
        setStep(4);
      } else {
        setSubmitError(result.message || 'The booking request could not be sent. Please try again.');
      }
    } catch (error: any) {
      setSubmitError(error.response?.data?.message || 'The booking request could not be recorded. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadConfirmation = async () => {
    if (!confirmationRef.current || isDownloadingConfirmation) return;
    setIsDownloadingConfirmation(true);
    try {
      const image = await toPng(confirmationRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        cacheBust: true,
      });
      const link = document.createElement('a');
      link.download = `${requestReference || 'TDK-booking-request'}-confirmation.png`;
      link.href = image;
      link.click();
    } catch {
      toast.error('The confirmation image could not be downloaded. Please take a screenshot instead.');
    } finally {
      setIsDownloadingConfirmation(false);
    }
  };

  if (step === 4) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8 sm:py-14">
        <Card className="relative overflow-hidden border-border/70 bg-card shadow-[0_24px_70px_-36px_rgba(15,23,42,0.4)]">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-primary" />
          <div ref={confirmationRef} className="px-5 py-8 text-center sm:px-10 sm:py-12">
            <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/60 dark:bg-emerald-950/50 dark:text-emerald-400 dark:ring-emerald-950/30">
              <CheckIcon className="h-8 w-8" aria-hidden="true" />
            </div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">Booking Requested</p>
            <CardTitle className="text-2xl tracking-tight sm:text-3xl">Your request is awaiting confirmation</CardTitle>
            <CardDescription className="mx-auto mt-3 max-w-2xl text-sm leading-6 sm:text-base">
              Your request is now listed in the booking records and the selected schedule is held in blue while the store verifies your receipt. It becomes a confirmed booking after an admin approves it.
            </CardDescription>

            <div className="mx-auto mt-8 max-w-2xl space-y-5 text-left">
              <div className="rounded-2xl border bg-muted/20 p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Request reference</p>
                    <p className="mt-2 break-all font-mono text-lg font-bold tracking-tight text-foreground sm:text-xl">{requestReference}</p>
                  </div>
                  <span className="w-fit rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-blue-700 dark:border-blue-900/70 dark:bg-blue-950/40 dark:text-blue-300">Pending review</span>
                </div>
                <p className="mt-4 border-t pt-4 text-sm leading-6 text-muted-foreground">Keep this reference when contacting the store. Your selected schedule remains in Requested status until an admin reviews and confirms it.</p>
              </div>

              <div className="overflow-hidden rounded-2xl border bg-background">
                <div className="flex items-center gap-2 border-b bg-muted/25 px-5 py-3 text-sm font-semibold">
                  <CalendarDays className="h-4 w-4 text-primary" />Requested schedule
                </div>
                <div className="divide-y">
                  {blocks.map((block, index) => (
                    <div key={`${block.courtId}-${block.date}-${block.startTime}-${index}`} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-semibold text-foreground">{courts.find(court => String(court.id) === block.courtId)?.name || 'Court'}</p>
                      <p className="text-sm text-muted-foreground">{formatAppDate(block.date)} · {formatAppTime(block.startTime)}–{formatAppTime(block.endTime)}</p>
                    </div>
                  ))}
                  {paddleQuantity > 0 && <div className="flex items-center justify-between px-5 py-4 text-sm"><span className="font-medium flex items-center gap-1.5"><PaddleIcon className="w-4 h-4" /> Selkirk Paddle Rental</span><span className="font-semibold text-primary">× {paddleQuantity}</span></div>}
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border bg-background shadow-sm">
                <div className="border-b bg-muted/25 px-5 py-3">
                  <p className="text-sm font-semibold text-foreground">What happens next</p>
                </div>
                <div className="divide-y">
                  <div className="flex items-start gap-3 px-5 py-4">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300"><Envelope className="h-4 w-4" /></span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Check your email</p>
                      <p className="mt-1 break-all text-xs leading-5 text-muted-foreground">A request summary and receipt copy were sent to {email}. Check your inbox and spam folder.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 px-5 py-4">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300"><Camera className="h-4 w-4" /></span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Keep this confirmation</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">Download or screenshot this page and retain it until the store confirms your booking.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 rounded-2xl border border-blue-200 bg-blue-50/60 p-5 dark:border-blue-900/70 dark:bg-blue-950/25 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#1877F2] text-white"><ChatBubble className="h-5 w-5" /></span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Need help with your request?</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">Message us on Facebook and include reference <span className="font-mono font-semibold text-foreground">{requestReference}</span>.</p>
                  </div>
                </div>
                <Button asChild type="button" className="h-10 shrink-0 rounded-xl bg-[#1877F2] px-5 text-white shadow-sm hover:bg-[#166fe5]">
                  <a href={EXTERNAL_LINKS.FACEBOOK_MESSAGE} target="_blank" rel="noopener noreferrer">Message us on Facebook</a>
                </Button>
              </div>
            </div>

            <div className="mt-8 flex flex-col-reverse justify-center gap-3 border-t pt-6 sm:flex-row">
              <Button type="button" variant="outline" onClick={downloadConfirmation} disabled={isDownloadingConfirmation} className="h-11 min-w-48 rounded-xl px-6 font-semibold">
                {isDownloadingConfirmation ? <LoadingIndicator className="mr-2" label="Downloading confirmation" /> : <Download className="mr-2 h-4 w-4" />}
                {isDownloadingConfirmation ? 'Preparing download…' : 'Download confirmation'}
              </Button>
              <Button onClick={() => navigate(ROUTES.HOME)} className="h-11 min-w-44 rounded-xl px-6 font-semibold shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0">
                <Home className="mr-2 h-4 w-4" />Back to Home
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Request a Court Booking</h1>
        <p className="text-muted-foreground">Choose your schedule and send your payment receipt for manual store verification.</p>
      </div>

      <div className="mb-10 relative flex justify-between items-center px-2 sm:px-8">
        <div className="absolute top-4 sm:top-[18px] left-[15%] right-[15%] h-[2px] bg-slate-100 z-0 hidden sm:block"></div>
        
        {[
          { number: 1, label: 'Schedule' },
          { number: 2, label: 'Your details' },
          { number: 3, label: 'Pay & request' },
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
              {step === 3 && "Payment"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Choose when and where you want to play. You can book multiple timeslots at once."}
              {step === 2 && "Provide your contact information for the reservation."}
              {step === 3 && "Scan the merchant QR and upload your payment receipt for verification."}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {step === 1 && (
              <div>
                {bookingThroughDate && (
                  <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                    Online bookings are open through {formatAppDate(bookingThroughDate)}.
                  </p>
                )}
                <BookingBlocksEditor blocks={blocks} onChange={setBlocks} courts={courts} rates={rates} rateType={RateType.Booking} errors={errors?.blocks} maxBookingDate={bookingThroughDate} />
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
                    <Label htmlFor="email">Verified Email</Label>
                    <Input id="email" type="email" value={email} readOnly aria-readonly="true" className={cn('cursor-not-allowed bg-muted/60', errors.email && 'border-red-500 ring-red-500')} />
                    <p className="text-xs text-muted-foreground">Verified by Google and used for this booking.</p>
                    <FieldError message={errors.email} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Contact Number *</Label>
                    <Input id="phone" inputMode="tel" autoComplete="tel" maxLength={30} aria-invalid={!!errors.phone} className={cn(errors.phone && 'field-invalid')} placeholder="e.g. 09171234567" value={phone} onChange={e => { setPhone(e.target.value); setErrors((current: any) => ({ ...current, phone: '' })); }} />
                    <FieldError message={errors.phone} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input id="notes" placeholder="Optional notes or requests" value={notes} onChange={e => setNotes(e.target.value)} />
                </div>

                <section className="rounded-2xl border bg-card p-4 sm:p-5" aria-labelledby="paddle-rental-title">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h4 id="paddle-rental-title" className="font-semibold flex items-center gap-1.5"><PaddleIcon className="w-5 h-5" /> Paddle Rental</h4>
                      <p className="mt-2 text-sm font-medium">Selkirk Pickleball Paddle</p>
                      <p className="mt-0.5 text-sm font-semibold text-primary">₱100 per paddle <span className="text-muted-foreground">• Entire session</span></p>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Rental is valid for your entire booking session.</p>
                    </div>
                    <div className="flex w-fit items-center rounded-xl border bg-background p-1 shadow-sm" aria-label="Paddle rental quantity">
                      <Button type="button" variant="ghost" size="icon" className="h-10 w-10 cursor-pointer rounded-lg" onClick={() => setPaddleQuantity(quantity => Math.max(0, quantity - 1))} disabled={paddleQuantity === 0} aria-label="Remove one paddle">
                        <MinusIcon className="h-4 w-4" />
                      </Button>
                      <output className="min-w-12 text-center text-base font-bold tabular-nums" aria-live="polite">{paddleQuantity}</output>
                      <Button type="button" variant="ghost" size="icon" className="h-10 w-10 cursor-pointer rounded-lg" onClick={() => setPaddleQuantity(quantity => Math.min(50, quantity + 1))} disabled={paddleQuantity === 50} aria-label="Add one paddle">
                        <PlusIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border bg-card p-4 sm:p-5" aria-labelledby="promo-title">
                  <div className="flex items-center gap-2">
                    <Tag className="h-5 w-5 text-primary" aria-hidden="true" />
                    <h4 id="promo-title" className="font-semibold">Promo</h4>
                    <span className="text-xs text-muted-foreground">Optional</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Enter the promo code provided by The Dirty Kitchen.</p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <Input
                      aria-label="Promo code"
                      value={promoName}
                      maxLength={100}
                      placeholder="Enter promo code"
                      onChange={event => {
                        setPromoName(event.target.value);
                        setNfcPromoCode('');
                        setAppliedPromo(null);
                        setPromoError('');
                      }}
                      className={cn('sm:flex-1', promoError && 'border-red-500 ring-red-500')}
                    />
                    <Button type="button" className="sm:px-6" onClick={handleApplyPromo} disabled={validatePromo.isPending || !promoName.trim()}>
                      {validatePromo.isPending ? <LoadingIndicator label="Checking promo" /> : 'Apply Promo'}
                    </Button>
                  </div>
                  {isNfcCustomer && (
                    <div className="mt-4 border-t pt-4">
                      <div className="mb-2 flex items-center justify-between gap-2"><Label className="text-sm font-semibold">Customer Card Promo</Label><span className="text-[11px] font-medium text-primary">Active Customer Card</span></div>
                      <Select
                        value={nfcPromoCode || 'none'}
                        onValueChange={value => {
                          setPromoError('');
                          setPromoName('');
                          if (value === 'none') {
                            setNfcPromoCode('');
                            setAppliedPromo(null);
                            return;
                          }
                          const promo = availableNfcPromos.find(candidate => candidate.code === value) || null;
                          setNfcPromoCode(promo?.code || '');
                          setAppliedPromo(promo);
                        }}
                        disabled={promosLoading || availableNfcPromos.length === 0}
                      >
                        <SelectTrigger aria-label="Available Customer Card promo">
                          <SelectValue placeholder={promosLoading ? 'Loading Customer Card promos…' : 'Select a Customer Card promo'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Customer Card promo</SelectItem>
                          {availableNfcPromos.map(promo => {
                            const insufficientUses = promo.remainingUsesThisMonth != null && promo.remainingUsesThisMonth < blocks.length;
                            const discount = promo.type === DiscountType.Percentage ? `${promo.value}% off` : `₱${promo.value.toLocaleString()} off`;
                            const remaining = promo.remainingUsesThisMonth != null ? ` · ${promo.remainingUsesThisMonth} use${promo.remainingUsesThisMonth === 1 ? '' : 's'} left this month` : '';
                            return <SelectItem key={promo.code} value={promo.code} disabled={insufficientUses}>{promo.code} · {discount}{remaining}</SelectItem>;
                          })}
                        </SelectContent>
                      </Select>
                      {appliedPromo?.remainingUsesThisMonth != null && <p className="mt-2 text-xs font-semibold text-primary">{appliedPromo.remainingUsesThisMonth} use{appliedPromo.remainingUsesThisMonth === 1 ? '' : 's'} left this month{appliedPromo.resetsOn ? ` · Resets on ${formatAppDate(appliedPromo.resetsOn)}` : ''}</p>}
                      {!promosLoading && availableNfcPromos.length === 0 && <p className="mt-2 text-xs text-muted-foreground">No Customer Card promos are available right now.</p>}
                    </div>
                  )}
                  <FieldError message={promoError} />
                  {appliedPromo && (
                    <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
                      <span className="font-semibold">{appliedPromo.code} applied:</span>{' '}
                      {appliedPromo.type === DiscountType.Percentage ? `${appliedPromo.value}%` : `₱${appliedPromo.value.toLocaleString()}`} off each selected schedule.
                    </div>
                  )}
                </section>

                <div className="mt-6 bg-muted/30 p-4 rounded-lg border">
                  <h4 className="font-semibold mb-3">Booking Request Summary</h4>
                  <div className="space-y-2 text-sm">
                    {blocks.map((b, i) => {
                      const quote = calculateRateQuote(rates, b.startTime, b.endTime, RateType.Booking);
                      return (
                        <div key={i} className="flex justify-between border-b last:border-0 pb-2 last:pb-0">
                          <div>
                            <span className="font-medium">Court Booking · {courts.find(c => String(c.id) === b.courtId)?.name || 'Court'}</span>
                            <span className="text-muted-foreground ml-2">
                              {formatAppDate(b.date)} · {formatAppTime(b.startTime)} - {formatAppTime(b.endTime)}
                            </span>
                          </div>
                          <span className="font-medium text-primary">
                            {quote.covered ? `₱${quote.total.toLocaleString()}` : '—'}
                          </span>
                        </div>
                      )
                    })}
                    {paddleQuantity > 0 && (
                      <div className="flex items-center justify-between border-t pt-2">
                        <span className="font-medium flex items-center gap-1.5"><PaddleIcon className="w-4 h-4" /> Selkirk Paddle Rental × {paddleQuantity}</span>
                        <span className="font-medium text-primary">₱{paddleRentalFee.toLocaleString()}</span>
                      </div>
                    )}
                    {appliedPromo && promoDiscount > 0 && (
                      <div className="flex items-center justify-between border-t pt-2 text-emerald-700 dark:text-emerald-400">
                        <span className="font-medium">Promo · {appliedPromo.code}</span>
                        <span className="font-semibold">-₱{promoDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    <div className="mt-2 flex justify-between pt-2">
                      <span className="font-semibold">Total Amount:</span>
                      <span className="font-bold text-primary text-base">
                        ₱{checkoutTotal.toLocaleString()}
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
                        <>
                          <img src="/assets/images/payment-method.png" alt="Payment QR code" className="mx-auto aspect-square w-full max-w-[250px] rounded-2xl border bg-white object-contain p-3 shadow-sm" onError={() => setPaymentQrUnavailable(true)} />
                          <Button asChild type="button" variant="outline" size="sm" className="mt-4 cursor-pointer">
                            <a href="/assets/images/payment-method.png" download="TDK-Payment-QR.png">
                              <Download className="mr-2 h-4 w-4" />Download QR
                            </a>
                          </Button>
                        </>
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
                        <p className="mt-1 text-xl font-bold text-primary">₱{checkoutTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <p className="mt-2 text-sm text-muted-foreground">For {blocks.length} booking {blocks.length === 1 ? 'schedule' : 'schedules'}{paddleQuantity > 0 ? ` plus ${paddleQuantity} paddle ${paddleQuantity === 1 ? 'rental' : 'rentals'}` : ''}</p>
                      </div>

                      <div>
                        <Label htmlFor="receipt">Payment receipt *</Label>
                        {receipt && receiptPreviewUrl ? (
                          <div className={cn('mt-2 rounded-2xl border-2 border-dashed p-3 text-center', receiptError ? 'border-red-400 bg-red-50/50 dark:bg-red-950/20' : 'border-primary bg-primary/5')}>
                            <button type="button" className="group relative mx-auto block aspect-[4/3] max-h-64 w-full cursor-zoom-in overflow-hidden rounded-xl border bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" onClick={() => setReceiptPreviewOpen(true)} aria-label={`Preview ${receipt.name}`}>
                                <img
                                  src={receiptPreviewUrl}
                                  alt={`Preview of ${receipt.name}`}
                                  className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-[1.02]"
                                />
                                <div className="absolute inset-x-0 bottom-0 bg-black/70 px-3 py-2 text-left text-white backdrop-blur-sm">
                                  <p className="truncate text-xs font-semibold">{receipt.name}</p>
                                  <p className="mt-0.5 text-[11px] text-white/80">{(receipt.size / 1024 / 1024).toFixed(2)} MB · Click to preview</p>
                                </div>
                            </button>
                            <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
                              <p className="text-xs text-muted-foreground">JPG, PNG, or WebP · maximum 5 MB</p>
                              <label htmlFor="receipt" className="cursor-pointer text-xs font-semibold text-primary hover:underline">Replace receipt</label>
                            </div>
                          </div>
                        ) : (
                          <label htmlFor="receipt" className={cn('mt-2 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-8 text-center transition-colors hover:border-primary hover:bg-primary/5', receiptError ? 'border-red-400 bg-red-50/50 dark:bg-red-950/20' : 'border-border')}>
                            <>
                              <Upload className="mb-3 h-7 w-7 text-primary" />
                              <span className="text-sm font-semibold">Choose receipt image</span>
                              <span className="mt-1 text-xs text-muted-foreground">JPG, PNG, or WebP · maximum 5 MB</span>
                            </>
                          </label>
                        )}
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
                  Send Booking Request
                  {isSubmitting && <LoadingIndicator className="ml-2" label="Sending booking request" />}
                </Button>
              )}
            </div>
          </CardFooter>
        </form>
      </Card>
      <Dialog open={receiptPreviewOpen} onOpenChange={setReceiptPreviewOpen}>
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-hidden">
          <DialogHeader>
            <DialogTitle>Payment receipt preview</DialogTitle>
            <DialogDescription>{receipt?.name || 'Uploaded payment receipt'}</DialogDescription>
          </DialogHeader>
          {receiptPreviewUrl && <div className="flex max-h-[72vh] items-center justify-center overflow-auto rounded-xl bg-black/5 p-2"><img src={receiptPreviewUrl} alt="Full preview of uploaded payment receipt" className="max-h-[68vh] max-w-full object-contain" /></div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}

