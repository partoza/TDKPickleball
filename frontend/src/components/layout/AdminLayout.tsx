import { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation, Link } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/constants';
import { BellIcon as Bell, ChevronDownIcon as ChevronDown, ArrowRightStartOnRectangleIcon as LogOut, Squares2X2Icon as LayoutDashboard, CalendarDaysIcon as Calendar, TicketIcon as Ticket, BanknotesIcon as CircleDollarSign, RectangleGroupIcon as Dumbbell, SunIcon as Sun, MoonIcon as Moon, KeyIcon as Key, UsersIcon as Users, EllipsisHorizontalIcon as More, ReceiptPercentIcon as Percent, CircleStackIcon as Database } from '@heroicons/react/24/solid';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export default function AdminLayout() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const location = useLocation();

  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(
    (localStorage.getItem('tdk-theme') as 'light' | 'dark' | 'system') || 'system'
  );

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (user?.role !== 'Admin' && user?.role !== 'Staff') {
      root.classList.add('light');
      return () => root.classList.remove('light');
    }

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
      localStorage.removeItem('tdk-theme');
      return () => root.classList.remove('light', 'dark');
    }

    root.classList.add(theme);
    localStorage.setItem('tdk-theme', theme);
    return () => root.classList.remove('light', 'dark');
  }, [theme, user?.role]);

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'light' : 'dark');
  };

  if (isLoading) {
    return <div className="admin-shell min-h-screen flex items-center justify-center"><div className="mac-loading"><span /><span /><span /></div></div>;
  }

  if (!isAuthenticated || (user?.role !== 'Admin' && user?.role !== 'Staff')) {
    return <Navigate to={ROUTES.ADMIN.LOGIN} replace />;
  }
  if (user?.mustChangePassword) return <Navigate to={ROUTES.ADMIN.WELCOME} replace />;
  const adminOnlyPaths = [ROUTES.ADMIN.RATES, ROUTES.ADMIN.COURTS, ROUTES.ADMIN.ADMINS];
  if (user?.role === 'Staff' && adminOnlyPaths.some(path => location.pathname.startsWith(path))) return <Navigate to={ROUTES.ADMIN.DASHBOARD} replace />;

  const initials = user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}` : 'JD';

  const bottomNavItems = [
    { icon: LayoutDashboard, label: 'Overview', href: ROUTES.ADMIN.DASHBOARD },
    { icon: Calendar, label: 'Schedule', href: ROUTES.ADMIN.SCHEDULE },
    { icon: Ticket, label: 'Bookings', href: ROUTES.ADMIN.BOOKINGS },
    ...(user?.role === 'Admin' ? [{ icon: Users, label: 'Users', href: ROUTES.ADMIN.ADMINS }] : []),
  ];

  const othersItems = user?.role === 'Admin' ? [
    { icon: CircleDollarSign, label: 'Rates', href: ROUTES.ADMIN.RATES },
    { icon: Dumbbell, label: 'Courts', href: ROUTES.ADMIN.COURTS },
    { icon: Users, label: 'Internal', href: ROUTES.ADMIN.STAFF },
    { icon: Percent, label: 'Promos', href: ROUTES.ADMIN.PROMOS },
    { icon: Database, label: 'Data storage', href: ROUTES.ADMIN.STORAGE },
  ] : [];

  return (
    <div className="admin-shell flex min-h-screen">
      <AdminSidebar />
      <div className="admin-workspace flex-1 flex flex-col min-w-0 md:pl-72 pb-16 md:pb-0">
        <header className="admin-topbar sticky top-0 z-30 flex h-16 items-center justify-between px-4 md:px-5 lg:px-7">
          <div className="flex items-center gap-3 min-w-0">
            <img src="/assets/images/tdk-logo.png" alt="Logo" className="h-8 w-auto md:hidden dark:hidden" />
            <img src="/tdk-logo-white.png" alt="Logo" className="h-8 w-auto hidden dark:block dark:md:hidden" />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="mac-toolbar-button text-muted-foreground hover:text-foreground md:hidden" onClick={toggleTheme} aria-label="Toggle theme">
              <Sun className="h-5 w-5 hidden dark:block" />
              <Moon className="h-5 w-5 block dark:hidden" />
            </Button>
            <Button variant="ghost" size="icon" className="mac-toolbar-button text-muted-foreground hover:text-foreground relative" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-white dark:ring-[#252527]"></span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="mac-account flex items-center gap-2.5 pl-2 cursor-pointer">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-[12px] font-semibold leading-none">{user?.firstName} {user?.lastName}</span>
                    <span className="text-[10px] text-muted-foreground mt-1">{user?.role || 'Administrator'}</span>
                  </div>
                  <Avatar className="h-8 w-8 border border-border shadow-sm">
                    {user?.profileImageUrl && <AvatarImage src={user.profileImageUrl} alt={`${user.firstName} ${user.lastName}`} />}
                    <AvatarFallback className="bg-primary/5 text-primary text-xs font-semibold">{initials}</AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild><Link to={ROUTES.ADMIN.PROFILE}><Key className="mr-2 h-4 w-4" />Change password</Link></DropdownMenuItem>
                <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        
        <main className="admin-content flex-1 p-3 md:p-5 lg:p-7">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-xl border-t border-border/40 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around px-2 h-16">
          {bottomNavItems.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className={cn(
                  "flex items-center justify-center p-1 rounded-full transition-all",
                  isActive ? "bg-primary/10" : "bg-transparent"
                )}>
                  <item.icon className="h-6 w-6" strokeWidth={isActive ? 2 : 1.5} />
                </div>
                <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
              </Link>
            );
          })}

          {othersItems.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors",
                    othersItems.some(i => location.pathname.startsWith(i.href)) ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className={cn(
                    "flex items-center justify-center p-1 rounded-full transition-all",
                    othersItems.some(i => location.pathname.startsWith(i.href)) ? "bg-primary/10" : "bg-transparent"
                  )}>
                    <More className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] font-medium tracking-wide">Others</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top" sideOffset={16} className="w-56">
                {othersItems.map(item => {
                  const isItemActive = location.pathname.startsWith(item.href);
                  return (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link to={item.href} className={cn("flex items-center gap-3 py-2 cursor-pointer", isItemActive && "text-primary font-medium")}>
                        <item.icon className={cn("h-4 w-4", isItemActive && "text-primary")} />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </nav>
    </div>
  );
}

