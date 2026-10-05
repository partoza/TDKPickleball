import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircleIcon as CheckCircle2, ViewfinderCircleIcon as ScanLine } from '@heroicons/react/24/solid';
import { BarcodeDetector as BarcodeDetectorPonyfill, prepareZXingModule } from 'barcode-detector/ponyfill';
import zxingReaderWasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import { useVerifyBooking, useVerifyBookingRequest } from '@/hooks/useBookings';
import { Booking, PublicBookingRequestStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatAppDate, formatAppTime } from '@/lib/date-time';
import { formatManilaDatabaseTime } from '@/lib/manila-time';
import { CustomerBookingCard } from '@/components/customer/CustomerBookingCard';

const MAX_QR_IMAGE_BYTES = 10 * 1024 * 1024;
const SUPPORTED_QR_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

prepareZXingModule({
  overrides: {
    locateFile: (path, prefix) => path.endsWith('.wasm') ? zxingReaderWasmUrl : `${prefix}${path}`,
  },
});

export default function VerifyPage() {
  const [searchParams] = useSearchParams();
  const initialLookupStarted = useRef(false);
  const [reference, setReference] = useState('');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [request, setRequest] = useState<PublicBookingRequestStatus | null>(null);
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const verify = useVerifyBooking();
  const verifyRequest = useVerifyBookingRequest();
  const isPending = verify.isPending || verifyRequest.isPending;
  const check = (value = reference) => {
    const normalized = value.trim().toUpperCase();
    setReference(normalized);
    setError('');
    setBooking(null);
    setRequest(null);
    if (/^REQ-\d{8}-\d{6}$/.test(normalized)) {
      verifyRequest.mutate(normalized, {
        onSuccess: response => response.success && response.data ? setRequest(response.data) : setError(response.message || 'Could not find this booking request'),
        onError: (requestError: any) => setError(requestError?.response?.data?.message || 'Could not find this booking request'),
      });
      return;
    }
    if (!/^TDK-\d{7}$/.test(normalized)) {
      setError('Enter a booking reference (TDK-1234567) or request reference (REQ-YYYYMMDD-123456)');
      return;
    }
    verify.mutate(normalized, {
      onSuccess: response => response.success && response.data ? setBooking(response.data) : setError(response.message || 'Could not verify this booking'),
      onError: () => setError('Could not verify this booking'),
    });
  };

  useEffect(() => {
    const queryReference = searchParams.get('reference');
    if (!queryReference || initialLookupStarted.current) return;
    initialLookupStarted.current = true;
    check(queryReference);
  }, [searchParams]);
  const scan = async (file?: File) => {
    if (!file) return;
    if (!SUPPORTED_QR_IMAGE_TYPES.has(file.type)) {
      setError('Upload a JPG, PNG, or WebP QR code image');
      return;
    }
    if (file.size > MAX_QR_IMAGE_BYTES) {
      setError('QR code image must be 10 MB or smaller');
      return;
    }

    setError('');
    setBooking(null);
    setRequest(null);
    setIsScanning(true);

    try {
      const codes = await new BarcodeDetectorPonyfill({ formats: ['qr_code'] }).detect(file);
      const scannedReference = codes[0]?.rawValue;

      if (!scannedReference) throw new Error('No QR code found in this image');

      setReference(scannedReference.trim().toUpperCase());
      check(scannedReference);
    } catch (e: any) {
      setError(e?.message || 'Unable to read this QR image');
    } finally {
      setIsScanning(false);
    }
  };
  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#fafafa] relative flex flex-col items-center pt-20 sm:pt-32 px-4 pb-24">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: 'url("/assets/images/hero-image.png")' }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-primary/90 to-black/80"></div>
      </div>

      <div className="w-full max-w-[500px] relative z-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white drop-shadow-md">Verify Booking</h1>
          <p className="mt-3 text-white/90 text-sm sm:text-base font-medium drop-shadow-sm">Track a booking request, upload a booking QR, or enter a reference.</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl shadow-black/5">
          <div className="space-y-1.5 mb-4 text-left">
            <label className="text-sm font-semibold text-slate-700">Booking or request reference</label>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input 
              value={reference} 
              onChange={e => setReference(e.target.value.toUpperCase())} 
              placeholder="TDK-1234567 or REQ-…"
              className={`h-11 flex-1 font-mono text-sm rounded-lg border-slate-200 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`} 
            />
            <Button 
              className="h-11 px-8 font-bold text-sm bg-primary hover:bg-primary/90 text-white transition-all shadow-sm hover:scale-105 duration-200" 
              onClick={() => check()} 
              disabled={isPending}
            >
              Verify
              {isPending && <LoadingIndicator className="ml-2" label="Checking reference" />}
            </Button>
          </div>
          {error && <p className="mt-2 text-sm font-medium text-red-500">{error}</p>}
          
          <div className="relative flex items-center py-6">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="shrink-0 px-4 text-xs font-bold text-slate-300 uppercase tracking-widest">Or</span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>
          
          <label className={`group flex h-36 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 text-sm font-semibold text-slate-600 transition-all ${isScanning ? 'cursor-wait opacity-70' : 'cursor-pointer hover:border-primary/40 hover:bg-primary/5 hover:text-primary'}`}>
            <div className="rounded-full bg-white p-3 shadow-sm ring-1 ring-slate-200/50 group-hover:ring-primary/20 group-hover:scale-110 transition-all duration-300">
              {isScanning ? <LoadingIndicator label="Reading QR code" /> : <ScanLine className="h-6 w-6 text-slate-400 group-hover:text-primary transition-colors" />}
            </div>
            {isScanning ? 'Reading QR Code…' : 'Upload QR Code Image'}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={isScanning} onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; void scan(file); }} />
          </label>
          
          {booking && (
            <div className="mt-8 text-left animate-in fade-in slide-in-from-bottom-2 duration-300">
              <CustomerBookingCard booking={booking} />
            </div>
          )}

          {request && (
            <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm animate-in fade-in duration-300">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center gap-2 font-medium text-slate-900 text-sm">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Booking request found
                </div>
                <span className="rounded-md bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary ring-1 ring-inset ring-primary/20">{request.status}</span>
              </div>
              <div className="grid gap-y-3 text-sm">
                <Detail k="Request reference" v={request.requestReference} />
                <Detail k="Submitted" v={formatManilaDatabaseTime(request.submittedAt)} />
                <Detail k="Schedules" v={String(request.schedules.length)} />
                <Detail k="Total" v={`₱${request.totalAmount.toLocaleString()}`} />
              </div>
              <div className="mt-5 space-y-3 border-t border-slate-100 pt-5">
                {request.schedules.map((schedule, index) => (
                  <div key={schedule.bookingReference} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                    <div className="flex items-center justify-between gap-3"><strong className="text-slate-900">Schedule {index + 1}</strong><span className="text-xs font-semibold text-primary">{schedule.status}</span></div>
                    <p className="mt-1 text-slate-600">{schedule.courtName} · {formatAppDate(schedule.bookingDate)}</p>
                    <p className="mt-0.5 text-slate-600">{formatAppTime(schedule.startTime)}–{formatAppTime(schedule.endTime)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Detail({ k, v }: { k: string; v: string }) { 
  return (
    <div className="flex justify-between items-center">
      <span className="text-slate-500">{k}</span>
      <span className="font-medium text-slate-900">{v}</span>
    </div>
  ); 
}
