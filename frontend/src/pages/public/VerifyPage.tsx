import { useState } from 'react';
import { format } from 'date-fns';
import { CheckCircle2, LoaderCircle, ScanLine } from 'lucide-react';
import { toast } from 'sonner';
import { useVerifyBooking } from '@/hooks/useBookings';
import { Booking } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function VerifyPage() {
  const [reference, setReference] = useState(''); const [booking, setBooking] = useState<Booking | null>(null); const verify = useVerifyBooking();
  const check = (value = reference) => { const normalized = value.trim().toUpperCase(); if (!/^TDK-\d{7}$/.test(normalized)) return toast.error('Enter a reference in TDK-1234567 format'); verify.mutate(normalized, { onSuccess: r => { if (!r.success || !r.data) { setBooking(null); return toast.error(r.message); } setBooking(r.data); toast.success('Booking verified'); }, onError: () => toast.error('Could not verify this booking') }); };
  const scan = async (file?: File) => { if (!file) return; try { const Detector = (window as any).BarcodeDetector; if (!Detector) throw new Error('QR image scanning is not supported by this browser'); const bitmap = await createImageBitmap(file); const codes = await new Detector({ formats: ['qr_code'] }).detect(bitmap); bitmap.close(); if (!codes[0]?.rawValue) throw new Error('No QR code found'); setReference(codes[0].rawValue); check(codes[0].rawValue); } catch (e: any) { toast.error(e.message); } };
  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f8fafc] relative pb-24">
      {/* Dynamic Background */}
      <div 
        className="absolute top-0 left-0 right-0 h-[50vh] min-h-[380px] bg-primary overflow-hidden bg-cover bg-center z-0"
        style={{ backgroundImage: 'url("/assets/images/hero-image.png")' }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-primary/95 via-primary/80 to-black/80 z-0 mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-black/20 z-0"></div>
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#f8fafc] to-transparent z-0"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 pt-20 sm:pt-28">
        <div className="text-center text-white mb-10 sm:mb-14">
          <h1 className="text-5xl font-black tracking-tighter md:text-7xl drop-shadow-xl">Verify Booking</h1>
          <p className="mx-auto mt-6 max-w-lg text-white/80 font-medium text-lg tracking-tight drop-shadow-sm">Upload the QR from your confirmation email or enter your booking reference.</p>
        </div>

        <div className="rounded-[32px] border border-white/60 bg-white/95 backdrop-blur-2xl p-6 shadow-[0_30px_100px_-15px_rgba(0,0,0,0.15)] sm:p-12 mx-auto max-w-2xl relative overflow-hidden ring-1 ring-black/5">
          {/* Subtle Top Glow inside card */}
          <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-primary/60 to-transparent"></div>
          
          <div className="flex flex-col gap-4 sm:flex-row mb-8">
            <Input 
              value={reference} 
              onChange={e => setReference(e.target.value.toUpperCase())} 
              placeholder="e.g. TDK-1234567" 
              className="h-[60px] font-mono text-lg tracking-wide rounded-2xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all px-6 shadow-inner" 
            />
            <Button 
              className="h-[60px] px-10 rounded-2xl font-black text-[16px] tracking-wide bg-primary hover:bg-primary/95 text-primary-foreground shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.98]" 
              onClick={() => check()} 
              disabled={verify.isPending}
            >
              VERIFY
              {verify.isPending && <LoaderCircle className="ml-2 h-5 w-5 animate-spin" />}
            </Button>
          </div>
          
          <label className="group flex h-[160px] cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 text-sm font-bold text-slate-500 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all duration-300">
            <div className="rounded-full bg-white p-3.5 shadow-sm group-hover:scale-110 transition-transform duration-300 group-hover:shadow-md ring-1 ring-slate-100 group-hover:ring-primary/20">
              <ScanLine className="h-7 w-7 text-slate-400 group-hover:text-primary transition-colors" />
            </div>
            Upload booking QR
            <input type="file" accept="image/*" className="hidden" onChange={e => scan(e.target.files?.[0])} />
          </label>
          
          {booking && (
            <div className="mt-10 rounded-3xl border border-emerald-100 bg-emerald-50/60 p-8 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 font-black text-emerald-800 text-lg border-b border-emerald-100 pb-5 mb-5 tracking-tight">
                <div className="h-10 w-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                VALID BOOKING CONFIRMED
              </div>
              <div className="grid gap-6 text-sm sm:grid-cols-2 px-1">
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
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.15em] text-emerald-700/60 mb-1">{k}</p>
      <p className="font-semibold text-emerald-950 text-[15px] tracking-tight">{v}</p>
    </div>
  ); 
}
