import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import PublicHeader from './PublicHeader';
import PublicFooter from './PublicFooter';
import { ROUTES } from '@/lib/constants';

export default function PublicLayout() {
  const location = useLocation();
  const hideNavAndFooter = [ROUTES.LOGIN, ROUTES.GOOGLE_CALLBACK].includes(location.pathname);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
    return () => root.classList.remove('light');
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {!hideNavAndFooter && <PublicHeader />}
      <main className={`flex-1 ${hideNavAndFooter ? 'flex flex-col' : ''}`}>
        <Outlet />
      </main>
      {!hideNavAndFooter && <PublicFooter />}
    </div>
  );
}
