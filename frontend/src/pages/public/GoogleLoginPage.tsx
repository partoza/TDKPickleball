import { useEffect, useRef, useState } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import { Link, useNavigate } from 'react-router-dom';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import { useAuth } from '@/hooks/useAuth';
import { getApiErrorMessage } from '@/services/api';
import { ROUTES } from '@/lib/constants';

const GOOGLE_SCRIPT_ID = 'google-identity-services';

function loadGoogleIdentityServices() {
  if ((window as any).google?.accounts?.id) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Google sign-in could not be loaded')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.id = GOOGLE_SCRIPT_ID;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google sign-in could not be loaded'));
    document.head.appendChild(script);
  });
}

export default function GoogleLoginPage() {
  const buttonRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { verifyGoogleCredential } = useAuth();
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    let active = true;
    const clientId = String((import.meta as any).env.VITE_GOOGLE_CLIENT_ID || '').trim();
    if (!clientId) {
      setError('Google sign-in is not configured for this website.');
      return () => { active = false; };
    }

    loadGoogleIdentityServices()
      .then(() => {
        if (!active || !buttonRef.current) return;
        const google = (window as any).google;
        google.accounts.id.initialize({
          client_id: clientId,
          ux_mode: 'popup',
          auto_select: false,
          cancel_on_tap_outside: true,
          callback: async ({ credential }: { credential?: string }) => {
            if (!active || !credential) {
              if (active) setError('Google did not return a verification token. Please try again.');
              return;
            }
            setError('');
            setIsVerifying(true);
            try {
              await verifyGoogleCredential(credential);
              if (active) navigate(ROUTES.BOOKING, { replace: true });
            } catch (requestError) {
              if (active) setError(getApiErrorMessage(requestError, 'Google could not verify this email address.'));
            } finally {
              if (active) setIsVerifying(false);
            }
          },
        });
        google.accounts.id.renderButton(buttonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: Math.min(buttonRef.current.clientWidth || 400, 400),
        });
      })
      .catch((scriptError) => {
        if (active) setError(scriptError instanceof Error ? scriptError.message : 'Google sign-in could not be loaded.');
      });

    return () => {
      active = false;
      (window as any).google?.accounts?.id?.cancel();
    };
  }, [navigate, verifyGoogleCredential]);

  return (
    <main className="flex-1 bg-gradient-to-br from-white via-white to-primary/10 flex w-full">
      {/* Left Panel */}
      <section className="hidden lg:flex flex-col justify-between w-1/2 p-4 lg:p-6">
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
          
          <div className="relative flex min-h-[52px] w-full items-center justify-center overflow-hidden rounded-full bg-white">
            <div ref={buttonRef} className={isVerifying ? 'pointer-events-none opacity-50' : ''} />
            {isVerifying && <div className="absolute inset-0 flex items-center justify-center bg-white/90"><LoadingIndicator label="Verifying your Google email" /></div>}
          </div>
          {error && <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700">{error}</p>}

          <div className="mt-10 text-center lg:text-left">
            <p className="text-[13px] leading-relaxed text-slate-600">Google verifies your identity securely. We never receive or store your Google password.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
