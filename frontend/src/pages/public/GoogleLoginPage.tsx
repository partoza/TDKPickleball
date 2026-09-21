import { ArrowLeftIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { authService } from '@/services/auth';
import { ROUTES } from '@/lib/constants';

function GoogleMark() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.4Z"/><path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.37l-3.24-2.54c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.39 13.92A6.02 6.02 0 0 1 6.08 12c0-.67.11-1.32.31-1.92V7.46H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.54l3.35-2.62Z"/><path fill="#EA4335" d="M12 5.95c1.47 0 2.79.51 3.83 1.5l2.87-2.88A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.96 5.46l3.35 2.62C7.18 7.71 9.39 5.95 12 5.95Z"/></svg>;
}

export default function GoogleLoginPage() {
  return (
    <main className="min-h-[calc(100vh-5rem)] bg-gradient-to-br from-white via-white to-primary/10 flex w-full">
      {/* Left Panel */}
      <section className="hidden lg:flex flex-col justify-between w-1/2 max-w-[800px] p-4 lg:p-6">
        <div className="relative w-full h-full rounded-[32px] overflow-hidden bg-primary shadow-[0_20px_60px_-15px_rgba(114,21,29,0.3)] flex flex-col justify-between p-10 lg:p-14">
          <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{ backgroundImage: 'url(/assets/images/hero-image.png)' }} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#2a0407] via-primary/80 to-primary/30" />
          
          <div className="relative z-10 flex items-center gap-3">
            <img src="/assets/images/tdk-logo.png" alt="TDK Logo" className="h-16 brightness-0 invert opacity-100" />
          </div>

          <div className="relative z-10 mt-auto">
            <h1 className="text-white text-5xl md:text-6xl font-medium tracking-tight leading-[1.1]">
              Your booking is<br />waiting.
            </h1>
            <p className="text-slate-200 mt-6 max-w-md text-[15px] leading-relaxed">
              Sign in to secure your court. Your selected date, time, and details stay saved securely while you authenticate.
            </p>
            <Link to={ROUTES.BOOKING} className="mt-12 inline-flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white transition-colors">
              <ArrowLeftIcon className="h-4 w-4" /> Back to booking
            </Link>
          </div>
        </div>
      </section>

      {/* Right Panel */}
      <section className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-20">
        <div className="w-full max-w-[400px]">
          <div className="mb-10 text-center lg:text-left">
            <img src="/assets/images/tdk-logo.png" alt="The Dirty Kitchen" className="mb-8 h-12 w-auto object-contain mx-auto lg:mx-0" />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2">Secure checkout</p>
            <h2 className="text-3xl sm:text-4xl font-medium tracking-tight text-slate-950">Continue with Google</h2>
            <p className="mt-4 text-[15px] text-slate-500 leading-relaxed">We use your verified Google email for the booking. Your display name remains editable later.</p>
          </div>
          
          <button type="button" onClick={() => window.location.assign(authService.getGoogleLoginUrl())} className="h-[52px] w-full flex items-center justify-center gap-3 rounded-2xl text-[15px] font-bold border border-slate-200 bg-white text-slate-800 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md active:scale-[0.98]">
            <GoogleMark /> Sign in with Google
          </button>

          <div className="mt-10 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50/50 p-4">
            <ShieldCheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p className="text-[13px] leading-relaxed text-slate-600">Google verifies your identity securely. We never receive or store your Google password.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
