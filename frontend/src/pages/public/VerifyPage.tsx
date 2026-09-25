import { useState } from 'react';
import { format } from 'date-fns';
import { CheckCircleIcon as CheckCircle2, ViewfinderCircleIcon as ScanLine } from '@heroicons/react/24/solid';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import { useVerifyBooking } from '@/hooks/useBookings';
import { Booking } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function VerifyPage() {
  const [reference, setReference] = useState(''); const [booking, setBooking] = useState<Booking | null>(null); const [error, setError] = useState(''); const verify = useVerifyBooking();
  const check = (value = reference) => { const normalized = value.trim().toUpperCase(); setError(''); setBooking(null); if (!/^TDK-\d{7}$/.test(normalized)) return setError('Enter a reference in TDK-1234567 format'); verify.mutate(normalized, { onSuccess: r => { if (!r.success || !r.data) { return setError(r.message || 'Could not verify this booking'); } setBooking(r.data); }, onError: () => setError('Could not verify this booking') }); };
  const scan = async (file?: File) => { if (!file) return; try { setError(''); setBooking(null); const Detector = (window as any).BarcodeDetector; if (!Detector) throw new Error('QR image scanning is not supported by this browser'); const bitmap = await createImageBitmap(file); const codes = await new Detector({ formats: ['qr_code'] }).detect(bitmap); bitmap.close(); if (!codes[0]?.rawValue) throw new Error('No QR code found'); setReference(codes[0].rawValue); check(codes[0].rawValue); } catch (e: any) { setError(e.message); } };
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
          <p className="mt-3 text-white/90 text-sm sm:text-base font-medium drop-shadow-sm">Upload the QR from your confirmation email or enter your booking reference.</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl shadow-black/5">
          <div className="space-y-1.5 mb-4 text-left">
            <label className="text-sm font-semibold text-slate-700">Booking Reference</label>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input 
              value={reference} 
              onChange={e => setReference(e.target.value.toUpperCase())} 
              placeholder="e.g. TDK-1234567" 
              className={`h-11 flex-1 font-mono text-sm rounded-lg border-slate-200 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`} 
            />
            <Button 
              className="h-11 px-8 font-bold text-sm bg-primary hover:bg-primary/90 text-white transition-all shadow-sm hover:scale-105 duration-200" 
              onClick={() => check()} 
              disabled={verify.isPending}
            >
              Verify
              {verify.isPending && <LoadingIndicator className="ml-2" label="Verifying booking" />}
            </Button>
          </div>
          {error && <p className="mt-2 text-sm font-medium text-red-500">{error}</p>}
          
          <div className="relative flex items-center py-6">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="shrink-0 px-4 text-xs font-bold text-slate-300 uppercase tracking-widest">Or</span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>
          
          <label className="group flex h-36 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 text-sm font-semibold text-slate-600 hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all">
            <div className="rounded-full bg-white p-3 shadow-sm ring-1 ring-slate-200/50 group-hover:ring-primary/20 group-hover:scale-110 transition-all duration-300">
              <ScanLine className="h-6 w-6 text-slate-400 group-hover:text-primary transition-colors" />
            </div>
            Upload QR Code Image
            <input type="file" accept="image/*" className="hidden" onChange={e => scan(e.target.files?.[0])} />
          </label>
          
          {booking && (
            <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm animate-in fade-in duration-300">
              <div className="flex items-center gap-2 font-medium text-slate-900 text-sm border-b border-slate-100 pb-4 mb-4">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                Valid booking confirmed
              </div>
              <div className="grid gap-y-3 text-sm">
                <Detail k="Reference" v={booking.bookingReference} />
                <Detail k="Booked by" v={booking.customerName} />
                <Detail k="Court" v={booking.courtName} />
                <Detail k="Schedule" v={`${format(new Date(`${booking.bookingDate}T00:00:00`), 'MMM d, yyyy')} · ${format(new Date(`2000-01-01T${booking.startTime}`), 'h:mm a')}`} />
                <Detail k="Status" v={booking.status} />
                <Detail k="Balance" v={`₱${booking.remainingBalance.toLocaleString()}`} />
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
