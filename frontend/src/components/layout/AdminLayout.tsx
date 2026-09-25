import { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation, Link } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/constants';
import { BellIcon as Bell, ChevronDownIcon as ChevronDown, ArrowRightStartOnRectangleIcon as LogOut, Squares2X2Icon as LayoutDashboard, CalendarDaysIcon as Calendar, TicketIcon as Ticket, BanknotesIcon as CircleDollarSign, RectangleGroupIcon as Dumbbell, SunIcon as Sun, MoonIcon as Moon, UserCircleIcon as UserCircle, UsersIcon as Users, EllipsisHorizontalIcon as More, ReceiptPercentIcon as Percent, CircleStackIcon as Database, ChartBarIcon as ChartBar } from '@heroicons/react/24/solid';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/useNotifications';
import { DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';

export default function AdminLayout() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const location = useLocation();
  const canReceiveNotifications = isAuthenticated && (user?.role === 'Admin' || user?.role === 'Staff');
  const notificationsQuery = useNotifications(canReceiveNotifications);
  const [seenNotificationIds, setSeenNotificationIds] = useState<number[]>([]);

  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(
    (localStorage.getItem('tdk-theme') as 'light' | 'dark' | 'system') || 'system'
  );

  const notificationStorageKey = user?.email ? `tdk-notifications-seen:${user.email.toLowerCase()}` : '';
  const notifications = notificationsQuery.data?.data || [];
  const unreadNotifications = notifications.filter(notification => !seenNotificationIds.includes(notification.id));

  useEffect(() => {
    if (!notificationStorageKey) {
      setSeenNotificationIds([]);
      return;
    }
    try {
      const saved = JSON.parse(localStorage.getItem(notificationStorageKey) || '[]');
      setSeenNotificationIds(Array.isArray(saved) ? saved.filter(value => Number.isInteger(value)).slice(-100) : []);
    } catch {
      setSeenNotificationIds([]);
    }
  }, [notificationStorageKey]);

  const markNotificationsSeen = (ids: number[]) => {
    setSeenNotificationIds(current => {
      const next = Array.from(new Set([...current, ...ids])).slice(-100);
      if (notificationStorageKey) localStorage.setItem(notificationStorageKey, JSON.stringify(next));
      return next;
    });
  };

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
    return <div className="admin-shell min-h-screen flex items-center justify-center"><img src="/assets/images/loading.png" alt="Loading" className="page-loading-mascot" /></div>;
  }

  if (!isAuthenticated || (user?.role !== 'Admin' && user?.role !== 'Staff')) {
    return <Navigate to={ROUTES.ADMIN.LOGIN} replace />;
  }
  if (user?.mustChangePassword) return <Navigate to={ROUTES.ADMIN.WELCOME} replace />;
  const adminOnlyPaths = [ROUTES.ADMIN.REVENUE, ROUTES.ADMIN.RATES, ROUTES.ADMIN.COURTS, ROUTES.ADMIN.ADMINS];
  if (user?.role === 'Staff' && adminOnlyPaths.some(path => location.pathname.startsWith(path))) return <Navigate to={ROUTES.ADMIN.DASHBOARD} replace />;

  const initials = user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}` : 'JD';

  const bottomNavItems = [
    { icon: LayoutDashboard, label: 'Overview', href: ROUTES.ADMIN.DASHBOARD },
    { icon: Calendar, label: 'Schedule', href: ROUTES.ADMIN.SCHEDULE },
    { icon: Ticket, label: 'Bookings', href: ROUTES.ADMIN.BOOKINGS },
    ...(user?.role === 'Admin' ? [{ icon: Users, label: 'Users', href: ROUTES.ADMIN.ADMINS }] : []),
  ];

  const othersItems = user?.role === 'Admin' ? [
    { icon: ChartBar, label: 'Revenue', href: ROUTES.ADMIN.REVENUE },
    { icon: CircleDollarSign, label: 'Rates', href: ROUTES.ADMIN.RATES },
    { icon: Dumbbell, label: 'Courts', href: ROUTES.ADMIN.COURTS },
    { icon: Users, label: 'Internal & Coaches', href: ROUTES.ADMIN.INTERNAL_COACHES },
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="mac-toolbar-button text-muted-foreground hover:text-foreground relative" aria-label={`${unreadNotifications.length} unread notifications`}>
                  <Bell className="h-5 w-5" />
                  {unreadNotifications.length > 0 && <span className="absolute -right-1 -top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold leading-none text-white ring-2 ring-white dark:ring-[#252527]">{unreadNotifications.length > 9 ? '9+' : unreadNotifications.length}</span>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={8} className="w-[min(360px,calc(100vw-16px))] rounded-xl p-1.5">
                <div className="flex items-center justify-between gap-3 px-2.5 py-2">
                  <div><p className="text-sm font-bold">Notifications</p><p className="mt-0.5 text-[11px] text-muted-foreground">{unreadNotifications.length ? `${unreadNotifications.length} unread` : 'You are all caught up'}</p></div>
                  {unreadNotifications.length > 0 && <button type="button" className="rounded-md px-2 py-1 text-[11px] font-semibold text-primary hover:bg-primary/10" onClick={event => { event.preventDefault(); event.stopPropagation(); markNotificationsSeen(unreadNotifications.map(notification => notification.id)); }}>Mark all read</button>}
                </div>
                <DropdownMenuSeparator />
                <div className="max-h-[360px] overflow-y-auto">
                  {notificationsQuery.isLoading && <p className="px-3 py-6 text-center text-xs text-muted-foreground">Loading notifications…</p>}
                  {notificationsQuery.isError && <button type="button" className="w-full rounded-lg px-3 py-6 text-center text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => notificationsQuery.refetch()}>Notifications could not be loaded. Tap to retry.</button>}
                  {!notificationsQuery.isLoading && !notificationsQuery.isError && notifications.map(notification => {
                    const unread = !seenNotificationIds.includes(notification.id);
                    return <DropdownMenuItem key={notification.id} asChild className="mb-0.5 cursor-pointer items-start rounded-lg p-0 focus:bg-accent">
                      <Link to={ROUTES.ADMIN.BOOKINGS} className="flex w-full items-start gap-3 px-3 py-3" onClick={() => markNotificationsSeen([notification.id])}>
                        <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', unread ? 'bg-primary' : 'bg-transparent')} />
                        <span className="min-w-0 flex-1"><span className={cn('block truncate text-xs', unread ? 'font-bold' : 'font-semibold')}>{notification.title}</span><span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground">{notification.message}</span><span className="mt-1.5 block text-[10px] text-muted-foreground/70">{formatDistanceToNow(new Date(notification.createdAtUtc), { addSuffix: true })}</span></span>
                      </Link>
                    </DropdownMenuItem>;
                  })}
                  {!notificationsQuery.isLoading && !notificationsQuery.isError && notifications.length === 0 && <div className="px-4 py-8 text-center"><Bell className="mx-auto h-6 w-6 text-muted-foreground/50" /><p className="mt-2 text-xs font-semibold">No notifications</p><p className="mt-1 text-[11px] text-muted-foreground">Schedule and balance reminders will appear here.</p></div>}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            
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
                <DropdownMenuItem asChild><Link to={ROUTES.ADMIN.PROFILE}><UserCircle className="mr-2 h-4 w-4" />Profile</Link></DropdownMenuItem>
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

