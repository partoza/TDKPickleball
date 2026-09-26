import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 text-center dark:bg-[#1a1a1c]">
      <img
        src="/assets/images/404.png"
        alt="Page not found"
        className="h-auto w-full max-w-[280px] object-contain drop-shadow-sm sm:max-w-[340px]"
      />
      <h1 className="mt-3 text-6xl font-bold tracking-tighter text-primary sm:text-7xl">404</h1>
      <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">Page Not Found</h2>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        We couldn't find the page you were looking for.
      </p>
      <div className="mt-8">
        <Link to="/">
          <Button size="lg" className="h-12 px-8 font-semibold">
            Return Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
