import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowPathIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/constants';

export default function GoogleCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { completeGoogleLogin } = useAuth();
  const started = useRef(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const code = params.get('code');
    const providerError = params.get('google_error');
    if (!code || providerError) {
      setError('Google sign-in was cancelled or could not be completed.');
      return;
    }
    completeGoogleLogin(code)
      .then(() => navigate(ROUTES.BOOKING, { replace: true }))
      .catch(() => setError('The sign-in code expired or was already used. Please try again.'));
  }, [completeGoogleLogin, navigate, params]);

  return <section className="flex flex-1 items-center justify-center px-4"><div className="w-full max-w-md rounded-3xl border bg-card p-8 text-center shadow-xl">{error ? <><ExclamationCircleIcon className="mx-auto h-12 w-12 text-red-500"/><h1 className="mt-4 text-xl font-bold">Sign-in unsuccessful</h1><p className="mt-2 text-sm text-muted-foreground">{error}</p><button onClick={() => navigate(ROUTES.LOGIN)} className="mt-6 cursor-pointer rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white">Try again</button></> : <><ArrowPathIcon className="mx-auto h-10 w-10 animate-spin text-primary"/><h1 className="mt-4 text-xl font-bold">Completing your sign-in</h1><p className="mt-2 text-sm text-muted-foreground">Your booking selections are being restored.</p></>}</div></section>;
}
