import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Squares2X2Icon as LayoutDashboard,
  CalendarDaysIcon as Calendar,
  TicketIcon as Ticket,
  BanknotesIcon as CircleDollarSign,
  RectangleGroupIcon as Dumbbell,
  ArrowRightStartOnRectangleIcon as LogOut,
  ComputerDesktopIcon as Monitor,
  SunIcon as Sun,
  MoonIcon as Moon,
  UsersIcon as Users,
  CircleStackIcon as Database,
  ReceiptPercentIcon as Percent,
  ChartBarIcon as ChartBar,
} from '@heroicons/react/24/solid';
import { ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

export default function AdminSidebar() {
  const location = useLocation();
  const { logout, user } = useAuth();
  
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(
    (localStorage.getItem('tdk-theme') as 'light' | 'dark' | 'system') || 'system'
  );

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
      // Remove local storage if system to respect OS changes
      localStorage.removeItem('tdk-theme');
      return;
    }

    root.classList.add(theme);
    localStorage.setItem('tdk-theme', theme);
  }, [theme]);

  const platformItems = [
    { icon: LayoutDashboard, label: 'Overview', href: ROUTES.ADMIN.DASHBOARD },
    { icon: Calendar, label: 'Schedule', href: ROUTES.ADMIN.SCHEDULE },
    { icon: Ticket, label: 'Bookings', href: ROUTES.ADMIN.BOOKINGS },
    ...(user?.role === 'Admin' ? [{ icon: ChartBar, label: 'Revenue', href: ROUTES.ADMIN.REVENUE }] : []),
  ];
  
  const systemItems = [
    { icon: CircleDollarSign, label: 'Rates', href: ROUTES.ADMIN.RATES },
    { icon: Dumbbell, label: 'Courts', href: ROUTES.ADMIN.COURTS },
    { icon: Users, label: 'Internal & Coaches', href: ROUTES.ADMIN.INTERNAL_COACHES },
    { icon: Percent, label: 'Promos', href: ROUTES.ADMIN.PROMOS },
    { icon: Users, label: 'Users', href: ROUTES.ADMIN.ADMINS },
    { icon: Database, label: 'Data storage', href: ROUTES.ADMIN.STORAGE },
  ];

  const renderNavGroup = (title: string, items: typeof platformItems) => (
    <div className="mb-7">
      <h4 className="mb-2 px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.14em]">{title}</h4>
      <div className="grid gap-1.5">
        {items.map((item) => {
          const isActive = location.pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "mac-sidebar-row group flex h-10 items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition-all",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
              )}
            >
              <span className={cn(
                "mac-sidebar-icon grid h-7 w-7 shrink-0 place-items-center rounded-md transition-colors",
                isActive ? "bg-primary text-white dark:text-primary-foreground shadow-sm" : "bg-black/[0.035] text-muted-foreground dark:bg-white/[0.06]"
              )}>
                <item.icon className="h-[15px] w-[15px]" strokeWidth={1.8} />
              </span>
              <span className="truncate">{item.label}</span>
              {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />}
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <aside className="admin-sidebar fixed inset-y-0 left-0 z-40 hidden w-72 flex-col md:flex">
      <div className="flex h-16 items-center justify-center border-b border-border/40 px-5">
        <Link to={ROUTES.ADMIN.DASHBOARD} className="flex w-full items-center justify-center">
          <img src="/assets/images/tdk-logo.png" alt="The Dirty Kitchen" className="h-14 w-auto object-contain dark:hidden" />
          <img src="/tdk-logo-white.png" alt="The Dirty Kitchen" className="h-14 w-auto object-contain hidden dark:block" />
        </Link>
      </div>
      <nav className="flex-1 overflow-auto px-4 py-6" aria-label="Admin navigation">
        {renderNavGroup('Platform', platformItems)}
        {user?.role === 'Admin' && renderNavGroup('System', systemItems)}
      </nav>
      <div className="mt-auto border-t border-border/60 px-4 py-4">
        <div className="mb-3 flex items-center justify-between px-2">
          <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.14em]">Appearance</h4>
          <div className="mac-segmented flex items-center gap-0.5 rounded-lg p-0.5">
            <button
              onClick={() => setTheme('system')}
              className={cn("p-1.5 rounded-md transition-all", theme === 'system' ? "bg-primary text-primary-foreground shadow-sm dark:bg-primary dark:text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
              title="Use system appearance"
            >
              <Monitor className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setTheme('light')}
              className={cn("p-1.5 rounded-md transition-all", theme === 'light' ? "bg-primary text-primary-foreground shadow-sm dark:bg-primary dark:text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
              title="Use light appearance"
            >
              <Sun className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={cn("p-1.5 rounded-md transition-all", theme === 'dark' ? "bg-primary text-primary-foreground shadow-sm dark:bg-primary dark:text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
              title="Use dark appearance"
            >
              <Moon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        
        <button
          onClick={logout}
          className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-[13px] font-medium text-muted-foreground hover:bg-primary/5 hover:text-primary transition-colors"
        >
          <span className="grid h-7 w-7 place-items-center rounded-md bg-black/[0.035] dark:bg-white/[0.06]"><LogOut className="h-[15px] w-[15px]" /></span>
          Logout
        </button>

        <div className="mt-3 border-t border-border/50 px-3 pt-3 text-[10px] leading-relaxed text-muted-foreground">
          <div className="flex items-center gap-3">
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="mailto:support@tdk.com" className="hover:text-foreground">Support</a>
          </div>
        </div>
      </div>
    </aside>
  );
}

