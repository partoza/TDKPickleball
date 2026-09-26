import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircleIcon, ArrowDownTrayIcon, TicketIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants';

export default function SuccessPage() {
  const [searchParams] = useSearchParams();
  const tdkRefs = searchParams.get('refs')?.split(',') || [];
  const simulated = searchParams.get('simulated');
  
  // We can extract TDK refs from sessionStorage if they were passed there, or just show a general success message
  const [refs, setRefs] = useState<string[]>(tdkRefs);

  useEffect(() => {
    if (refs.length === 0) {
      const stored = sessionStorage.getItem('PM_TDK_REFS');
      if (stored) {
        try { setRefs(JSON.parse(stored)); } catch (e) {}
      }
    }
  }, [refs.length]);

  const downloadQR = async (ref: string) => {
    try {
      const response = await fetch(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${ref}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${ref}-QR.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed', error);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#fafafa] flex flex-col items-center pt-20 px-4 pb-24">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border p-8 sm:p-12 text-center">
        <CheckCircleIcon className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Booking Completed!</h1>
        <p className="text-slate-600 mb-8">
          {simulated ? "Your payment was simulated successfully." : "Your payment was successful."} 
          Your booking is now confirmed and marked as paid.
        </p>
        
        {refs.length > 0 && (
          <div className="space-y-8 mb-8">
            <h2 className="text-lg font-semibold text-slate-800 border-b pb-2">Your Booking QR Codes</h2>
            <div className="grid gap-6 sm:grid-cols-2 justify-center">
              {refs.map((ref, idx) => (
                <div key={idx} className="flex flex-col items-center bg-slate-50 p-6 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-4 text-slate-700 font-mono font-semibold">
                    <TicketIcon className="w-5 h-5" />
                    {ref}
                  </div>
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${ref}`} 
                    alt={`QR Code for ${ref}`}
                    className="w-40 h-40 bg-white p-2 rounded-lg shadow-sm border mb-4"
                  />
                  <Button variant="outline" size="sm" onClick={() => downloadQR(ref)} className="w-full">
                    <ArrowDownTrayIcon className="w-4 h-4 mr-2" /> Download QR
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
          <Link to={ROUTES.HOME}>
            <Button variant="outline" className="w-full sm:w-auto">Return Home</Button>
          </Link>
          <Link to={ROUTES.VERIFY}>
            <Button className="w-full sm:w-auto">Verify Bookings</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
