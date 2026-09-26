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
    const saved = localStorage.getItem('tdk-theme');
    const updateTheme = () => {
      if (saved === 'light' || saved === 'dark') { root.classList.remove('light', 'dark'); root.classList.add(saved); return; }
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.remove('light', 'dark');
      root.classList.add(isDark ? 'dark' : 'light');
    };
    updateTheme();
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => { if (!localStorage.getItem('tdk-theme')) updateTheme(); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
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
