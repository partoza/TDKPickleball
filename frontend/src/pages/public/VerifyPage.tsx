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

function PickleballDecoration() {
  return (
    <svg viewBox="0 0 320 320" className="h-full w-full" aria-hidden="true">
      <circle cx="160" cy="160" r="154" fill="#d9f900" />
      {[
        [100, 58], [188, 38], [252, 92], [110, 142], [200, 130],
        [270, 190], [154, 228], [76, 238], [228, 266],
      ].map(([cx, cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="16" fill="#72151d" opacity=".12" />)}
    </svg>
  );
}

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
    } catch (scanError: any) {
      setError(scanError?.message || 'Unable to read this QR image');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f4efe5] text-[#241f1d]">
      <section className="relative overflow-hidden border-b border-[#72151d]/15">
        <div className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 opacity-[0.1] sm:-right-36 sm:-top-36 sm:h-[34rem] sm:w-[34rem]">
          <PickleballDecoration />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[.86fr_1.14fr] lg:items-center lg:px-10 lg:py-24">
          <div className="relative z-10 max-w-xl">
            <img src="/assets/images/tdk-logo.png" alt="The Dirty Kitchen Pickleball Court" className="mb-10 h-auto w-52 object-contain sm:w-64" />
            <p className="mb-5 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.26em] text-[#72151d]">
              <span className="h-px w-10 bg-[#72151d]" /> Booking lookup
            </p>
            <h1 className="text-[clamp(3.35rem,7vw,6.5rem)] font-black uppercase leading-[0.84] tracking-[-0.065em] text-[#72151d]">
              Verify your<br />booking.
            </h1>
            <p className="mt-7 max-w-lg text-base leading-7 text-[#5e5651] sm:text-lg sm:leading-8">
              Check a confirmed booking, follow a pending request, or upload the QR code from your reservation.
            </p>

            <ol className="mt-9 border-y border-[#241f1d]/15">
              {['Enter your reference', 'Upload your QR image', 'View the current status'].map((item, index) => (
                <li key={item} className="grid grid-cols-[2.75rem_1fr] items-center gap-3 border-b border-[#241f1d]/15 py-3.5 last:border-b-0">
                  <span className="text-xs font-bold tabular-nums text-[#72151d]">0{index + 1}</span>
                  <span className="text-sm font-semibold">{item}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="relative z-10 lg:justify-self-end">
            <div className="absolute -left-4 -top-4 h-full w-full border border-[#72151d]/20 sm:-left-6 sm:-top-6" aria-hidden="true" />
            <div className="relative w-full bg-[#fffdf8] p-6 shadow-[0_20px_60px_rgba(36,31,29,0.12)] sm:p-9 lg:w-[600px] lg:p-11">
              <div className="border-b border-[#241f1d]/15 pb-7">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#72151d]">Find your reservation</p>
                <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] sm:text-3xl">Enter a booking reference</h2>
                <p className="mt-2 text-sm leading-6 text-[#6b625d]">Use the reference from your confirmation email or booking receipt.</p>
              </div>

              <form className="mt-7" onSubmit={event => { event.preventDefault(); check(); }}>
                <label htmlFor="booking-reference" className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#72151d]">Booking or request reference</label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    id="booking-reference"
                    value={reference}
                    onChange={event => setReference(event.target.value.toUpperCase())}
                    placeholder="TDK-1234567 or REQ-…"
                    aria-invalid={!!error}
                    className={`h-12 flex-1 rounded-none border-[#241f1d]/20 bg-white px-4 font-mono text-sm shadow-none focus-visible:ring-[#72151d]/20 ${error ? 'border-red-600' : ''}`}
                  />
                  <Button type="submit" disabled={isPending} className="h-12 rounded-none bg-[#72151d] px-8 text-sm font-bold text-white hover:bg-[#5f1118]">
                    Verify
                    {isPending && <LoadingIndicator className="ml-2" label="Checking reference" />}
                  </Button>
                </div>
                {error && <p className="mt-2 text-sm font-semibold leading-5 text-red-700" role="alert">{error}</p>}
              </form>

              <div className="my-7 flex items-center gap-4">
                <span className="h-px flex-1 bg-[#241f1d]/15" />
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#6b625d]">or scan the ticket</span>
                <span className="h-px flex-1 bg-[#241f1d]/15" />
              </div>

              <label className={`group flex min-h-40 flex-col items-center justify-center border border-dashed border-[#72151d]/30 bg-[#f4efe5]/65 px-5 text-center transition-colors ${isScanning ? 'cursor-wait opacity-70' : 'cursor-pointer hover:border-[#72151d] hover:bg-[#f4efe5]'}`}>
                <span className="grid h-12 w-12 place-items-center rounded-full bg-[#72151d] text-white transition-transform group-hover:scale-105">
                  {isScanning ? <LoadingIndicator label="Reading QR code" /> : <ScanLine className="h-6 w-6" />}
                </span>
                <span className="mt-4 text-sm font-bold text-[#72151d]">{isScanning ? 'Reading QR code…' : 'Upload QR code image'}</span>
                <span className="mt-1 text-xs text-[#6b625d]">JPG, PNG or WebP · up to 10 MB</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={isScanning} onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; void scan(file); }} />
              </label>
            </div>
          </div>
        </div>
      </section>

      {(booking || request) && (
        <section className="bg-[#fffdf8] py-14 sm:py-20" aria-live="polite">
          <div className="mx-auto max-w-4xl px-5 sm:px-8">
            <div className="mb-8 flex items-end justify-between gap-5 border-b border-[#241f1d]/15 pb-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#72151d]">Lookup result</p>
                <h2 className="mt-2 text-3xl font-bold tracking-[-0.035em]">Booking details</h2>
              </div>
              <CheckCircle2 className="h-9 w-9 shrink-0 text-[#72151d]" />
            </div>

            {booking && <div className="animate-in fade-in slide-in-from-bottom-2 duration-300"><CustomerBookingCard booking={booking} /></div>}

            {request && (
              <div className="animate-in fade-in border border-[#72151d]/20 bg-white duration-300">
                <div className="flex flex-col gap-3 border-b border-[#241f1d]/15 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
                  <div className="flex items-center gap-3 font-bold text-[#241f1d]"><CheckCircle2 className="h-6 w-6 text-[#72151d]" />Booking request found</div>
                  <span className="w-fit bg-[#72151d] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white">{request.status}</span>
                </div>
                <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7">
                  <Detail k="Request reference" v={request.requestReference} />
                  <Detail k="Submitted" v={formatManilaDatabaseTime(request.submittedAt)} />
                  <Detail k="Schedules" v={String(request.schedules.length)} />
                  <Detail k="Total" v={`₱${request.totalAmount.toLocaleString()}`} />
                </div>
                <div className="border-t border-[#241f1d]/15 p-5 sm:p-7">
                  <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[#72151d]">Requested schedules</p>
                  <div className="divide-y divide-[#241f1d]/15 border-y border-[#241f1d]/15">
                    {request.schedules.map((schedule, index) => (
                      <div key={schedule.bookingReference} className="grid gap-2 py-5 sm:grid-cols-[8rem_1fr_auto] sm:items-center sm:gap-5">
                        <strong className="text-sm text-[#72151d]">Schedule {index + 1}</strong>
                        <div className="text-sm leading-6 text-[#5e5651]"><p>{schedule.courtName} · {formatAppDate(schedule.bookingDate)}</p><p>{formatAppTime(schedule.startTime)}–{formatAppTime(schedule.endTime)}</p></div>
                        <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#72151d]">{schedule.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function Detail({ k, v }: { k: string; v: string }) {
  return (
    <div className="border-b border-[#241f1d]/10 pb-3">
      <span className="block text-[10px] font-bold uppercase tracking-[0.15em] text-[#6b625d]">{k}</span>
      <span className="mt-1 block break-words text-sm font-bold text-[#241f1d]">{v}</span>
    </div>
  );
}
