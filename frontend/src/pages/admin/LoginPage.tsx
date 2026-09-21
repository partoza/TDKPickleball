import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import { loginSchema } from '@/lib/validation';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type LoginFormData = z.infer<typeof loginSchema>;

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1.5 text-xs font-medium text-red-600" role="alert">{message}</p> : null;
}

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
    return () => root.classList.remove('light');
  }, []);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null);
      const user = await login(data);
      navigate(user.mustChangePassword ? ROUTES.ADMIN.WELCOME : ROUTES.ADMIN.DASHBOARD);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-white to-primary/10 flex w-full">
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
              Run your courts,<br />elevated.
            </h1>
            <p className="text-slate-300 mt-6 max-w-md text-[15px] leading-relaxed">
              Sign in to your TDK Admin workspace to manage court availability, update scheduling details, and track your daily bookings.
            </p>
            <Link to="/" className="mt-12 inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">
              <ArrowLeftIcon className="h-4 w-4" /> Back to website
            </Link>
          </div>
        </div>
      </section>

      {/* Right Panel */}
      <section className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-20">
        <div className="w-full max-w-[400px]">
          <div className="mb-10 text-center lg:text-left">
            <img src="/assets/images/tdk-logo.png" alt="The Dirty Kitchen" className="mb-8 h-12 w-auto object-contain mx-auto lg:mx-0" />
            <h2 className="text-3xl sm:text-4xl font-medium tracking-tight text-slate-950">Welcome back.</h2>
            <p className="mt-4 text-[15px] text-slate-500 leading-relaxed">Sign in with your authorized email account to access the admin console and manage the system.</p>
          </div>
          
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm" role="alert">{error}</div>}

            <div className="space-y-1.5">
              <div className="relative">
                <Input id="email" type="email" autoComplete="email" placeholder="Email address" aria-invalid={!!form.formState.errors.email} className={cn('h-[52px] rounded-2xl border-slate-200 bg-white/60 backdrop-blur-sm px-5 text-slate-950 shadow-sm focus-visible:border-primary focus-visible:ring-primary/20 transition-all text-[15px]', form.formState.errors.email && 'border-red-400')} {...form.register('email')} />
              </div>
              <FieldError message={form.formState.errors.email?.message} />
            </div>

            <div className="space-y-1.5">
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Password" aria-invalid={!!form.formState.errors.password} className={cn('h-[52px] rounded-2xl border-slate-200 bg-white/60 backdrop-blur-sm pl-5 pr-12 text-slate-950 shadow-sm focus-visible:border-primary focus-visible:ring-primary/20 transition-all text-[15px]', form.formState.errors.password && 'border-red-400')} {...form.register('password')} />
                <button type="button" onClick={() => setShowPassword(value => !value)} className="absolute right-4 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-primary transition-colors hover:bg-slate-50 hover:text-primary/80" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
              <FieldError message={form.formState.errors.password?.message} />
            </div>

            <Button type="submit" className="h-[52px] w-full rounded-2xl text-[15px] font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_8px_20px_rgba(114,21,29,0.25)] transition-all active:scale-[0.98] mt-2" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Signing in' : 'Continue with Admin'}
              {form.formState.isSubmitting && <ArrowPathIcon className="ml-2 h-4 w-4 animate-spin" />}
            </Button>
          </form>

          <p className="mt-10 text-center lg:text-left text-[13px] text-slate-400">By continuing, you agree to our Terms of Service and Privacy Policy.</p>
        </div>
      </section>
    </main>
  );
}
