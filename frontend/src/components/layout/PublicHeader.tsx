import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ROUTES } from '@/lib/constants';
import { useState } from 'react';
import { ArrowRightOnRectangleIcon, Bars3BottomRightIcon, ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { TDK_LOGO_URL } from '@/lib/branding';
import { useAuth } from '@/hooks/useAuth';

export default function PublicHeader() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Google user';
  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'G';

  const signOut = () => {
    logout();
    setIsOpen(false);
  };

  const navLinks = [
    { name: 'Home', href: ROUTES.HOME },
    { name: 'Schedule', href: ROUTES.SCHEDULE },
    { name: 'Verify Court', href: ROUTES.VERIFY },
    { name: 'Contact', href: ROUTES.CONTACT },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background text-foreground">
      <div className="container flex h-20 items-center justify-between px-4 md:px-6 mx-auto max-w-7xl">
        <Link to={ROUTES.HOME} className="flex items-center gap-2">
          <img src={TDK_LOGO_URL} alt="The Dirty Kitchen Pickleball Court" className="h-14 sm:h-16 md:h-14 w-auto object-contain" />
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <nav className="flex gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-sm font-semibold tracking-wide transition-colors ${
                  location.pathname === link.href 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-primary'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Button size="sm" className="font-bold shadow-md hover:scale-105 transition-transform duration-200" asChild>
              <Link to={ROUTES.BOOKING}>BOOK NOW</Link>
            </Button>
            {!isLoading && (isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-10 max-w-[230px] gap-2 rounded-full border-border px-2 pr-3 hover:border-primary/30 hover:bg-primary/5">
                    <Avatar className="h-7 w-7 border">
                      <AvatarImage src={user.profileImageUrl} alt={displayName} referrerPolicy="no-referrer" />
                      <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">{initials}</AvatarFallback>
                    </Avatar>
                    <span className="max-w-[145px] truncate text-sm font-semibold">{displayName}</span>
                    <ChevronDownIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel className="font-normal">
                    <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700 dark:focus:bg-red-950/40">
                    <ArrowRightOnRectangleIcon className="mr-2 h-4 w-4" />Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="outline" size="sm" className="font-bold border-primary text-primary hover:bg-primary/5 hover:scale-105 transition-transform duration-200" asChild>
                <Link to={ROUTES.LOGIN}>SIGN IN</Link>
              </Button>
            ))}
          </div>
        </div>
        <div className="md:hidden">
          <button type="button" onClick={() => setIsOpen(!isOpen)} className="text-primary hover:text-primary/80 transition-colors flex items-center justify-center p-1">
            {isOpen
              ? <XMarkIcon className="size-10" aria-hidden="true" />
              : <Bars3BottomRightIcon className="size-10" aria-hidden="true" />}
          </button>
        </div>
      </div>
      {isOpen && (
        <div className="md:hidden border-b bg-background px-6 py-6 shadow-lg space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => setIsOpen(false)}
              className="block py-3 text-lg font-bold text-slate-800 transition-colors hover:text-primary border-b border-slate-100 last:border-0"
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-4 pb-2 space-y-3">
            <Button className="w-full h-12 text-base font-bold shadow-md hover:scale-[1.02] transition-transform duration-200" asChild>
              <Link to={ROUTES.BOOKING} onClick={() => setIsOpen(false)}>BOOK NOW</Link>
            </Button>
            {!isLoading && (isAuthenticated && user ? (
              <div className="rounded-2xl border bg-muted/30 p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="h-11 w-11 border">
                    <AvatarImage src={user.profileImageUrl} alt={displayName} referrerPolicy="no-referrer" />
                    <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{displayName}</p><p className="truncate text-xs text-muted-foreground">{user.email}</p></div>
                </div>
                <Button variant="outline" className="mt-3 h-10 w-full justify-center text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40" onClick={signOut}>
                  <ArrowRightOnRectangleIcon className="mr-2 h-4 w-4" />Logout
                </Button>
              </div>
            ) : (
              <Button variant="outline" className="w-full h-12 text-base font-bold border-primary text-primary hover:bg-primary/5 hover:scale-[1.02] transition-transform duration-200" asChild>
                <Link to={ROUTES.LOGIN} onClick={() => setIsOpen(false)}>SIGN IN</Link>
              </Button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
