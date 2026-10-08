import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { CheckCircleIcon, MapPinIcon, ClockIcon, ShieldCheckIcon } from '@heroicons/react/24/solid';
import { CalendarDaysIcon, CheckBadgeIcon, Squares2X2Icon, UserIcon } from '@heroicons/react/24/outline';

const COOKIE_CONSENT_KEY = 'tdk-cookie-consent';

const formatPesoAmount = (amount: number) => amount.toLocaleString('en-PH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function HomePage() {
  const [cookieConsent, setCookieConsent] = useState<'accepted' | 'declined' | null>(() => {
    const saved = localStorage.getItem(COOKIE_CONSENT_KEY);
    return saved === 'accepted' || saved === 'declined' ? saved : null;
  });

  const chooseCookieConsent = (choice: 'accepted' | 'declined') => {
    localStorage.setItem(COOKIE_CONSENT_KEY, choice);
    setCookieConsent(choice);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section 
        className="relative min-h-[85vh] flex items-center bg-primary text-primary-foreground overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: 'url("/assets/images/hero-image.png")' }}
      >
        {/* Primary Red Overlay - Easy on the eyes */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/80 to-black/60 z-0"></div>
        <div className="absolute inset-0 bg-black/20 mix-blend-multiply z-0"></div>

        <div className="container mx-auto px-4 md:px-6 md:pl-12 max-w-7xl relative z-10 text-left flex flex-col justify-center">
          <div className="mb-6 mt-4">
            <img 
              src="/tdk-logo-white.png" 
              alt="The Dirty Kitchen Pickleball Court" 
              className="w-full max-w-[420px] h-auto drop-shadow-2xl" 
            />
          </div>
          
          <p className="max-w-[500px] text-lg md:text-xl text-white/95 mb-8 font-medium leading-relaxed drop-shadow-sm">
            Two Indoor Courts for Games, Trainings, and Events. 
            Book your court today and experience the best game in town.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-start items-center">
            <Button size="lg" className="w-full sm:w-auto text-base md:text-lg h-12 md:h-14 px-6 md:px-8 bg-white text-primary font-bold hover:bg-white/90 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200" asChild>
              <Link to={ROUTES.BOOKING}>
                Book a Court Now
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-base md:text-lg h-12 md:h-14 px-6 md:px-8 bg-black/10 backdrop-blur-sm border-2 border-white/80 text-white font-bold hover:bg-white hover:text-primary shadow-sm hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200" asChild>
              <Link to={ROUTES.SCHEDULE}>
                View Schedule
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Booking Steps */}
      <section className="bg-white py-14 text-[#17213f] sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-500">Booking</p>
          <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] sm:text-4xl">How booking works</h2>
          <p className="mt-3 text-base text-slate-500 sm:text-lg">Four steps, from an open court to a confirmed booking.</p>

          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:mt-10 lg:grid-cols-4 lg:gap-5">
            {[
              { title: 'Choose your date', description: 'Pick the day you want to play.', icon: CalendarDaysIcon },
              { title: 'Choose a court and time', description: 'See which courts are available and select the slots you want.', icon: Squares2X2Icon },
              { title: 'Sign in', description: 'So your booking is in your name and you can find it later.', icon: UserIcon },
              { title: 'Confirm', description: 'Review your booking and confirm your reservation.', icon: CheckBadgeIcon },
            ].map(({ title, description, icon: Icon }, index) => (
              <article key={title} className="relative min-h-52 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)] sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <span className="grid h-13 w-13 place-items-center rounded-2xl bg-[#293f91] text-white">
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-amber-400 text-base font-bold text-[#17213f]">{index + 1}</span>
                </div>
                <h3 className="mt-6 text-lg font-bold tracking-[-0.02em]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Rates Section */}
      <section className="bg-[#fffdf8] py-16 text-[#241f1d] sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid gap-5 border-b border-[#241f1d]/15 pb-8 md:grid-cols-2 md:items-end">
            <div><p className="text-xs font-bold uppercase tracking-[0.24em] text-[#72151d]">Simple hourly pricing</p><h2 className="mt-3 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">Choose your court time.</h2></div>
            <p className="max-w-xl text-sm leading-6 text-[#6b625d] sm:text-base md:justify-self-end md:text-right">Regular games, prime-time rallies, or focused training—your total is calculated automatically from the hours you book.</p>
          </div>
          <div className="grid border-t border-[#241f1d]/15 lg:grid-cols-3">
            {[
              { title: 'Daytime', time: '7:00 AM – 5:00 PM', price: 320, description: 'A relaxed daytime schedule for casual games and regular court sessions.', features: ['Standard court with silica', 'Morning and afternoon play'] },
              { title: 'Prime Time', time: '5:00 PM – 12:00 MN', price: 400, description: 'Evening court access with the full tournament-lighting experience.', features: ['After-work sessions', 'Tournament lighting included'] },
              { title: 'Training', time: '7:00 AM – 12:00 MN', price: 300, description: 'A dedicated hourly rate for coached practice and focused skill development.', features: ['Available all operating hours', 'Built for focused training'] },
            ].map((rate, index) => <article key={rate.title} className={`flex min-h-[430px] flex-col border-b border-[#241f1d]/15 px-1 py-9 sm:px-6 lg:px-8 ${index < 2 ? 'lg:border-r' : ''}`}>
              <div className="flex items-center justify-between"><span className="text-xs font-bold tracking-[0.18em] text-[#72151d]">0{index + 1}</span><span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6b625d]">{rate.time}</span></div>
              <h3 className="mt-10 text-2xl font-bold uppercase tracking-[-0.025em] text-[#72151d]">{rate.title}</h3>
              <div className="mt-4 flex items-end gap-2 text-[#72151d]"><span className="mb-2 text-xl font-bold">₱</span><span className="text-6xl font-black tracking-[-0.06em]">{formatPesoAmount(rate.price)}</span><span className="mb-2 text-xs font-semibold text-[#6b625d]">/ hour</span></div>
              <p className="mt-5 text-sm leading-6 text-[#5e5651]">{rate.description}</p>
              <div className="mt-6 space-y-3">{rate.features.map(feature => <p key={feature} className="flex items-center gap-2.5 text-sm font-semibold"><CheckCircleIcon className="h-5 w-5 text-[#72151d]" />{feature}</p>)}</div>
              <Button className="mt-auto h-11 w-full rounded-xl bg-[#72151d] font-bold text-white hover:bg-[#5f1118]" asChild><Link to={rate.title === 'Training' ? ROUTES.TRAINING : ROUTES.BOOKING}>{rate.title === 'Training' ? 'Explore Training' : 'Book This Rate'}</Link></Button>
            </article>)}
          </div>
        </div>
      </section>

      {/* The Courts Section */}
      <section className="bg-[#241f1d] py-16 text-white sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid gap-5 border-b border-white/15 pb-8 md:grid-cols-2 md:items-end">
            <div><p className="text-xs font-bold uppercase tracking-[0.24em] text-[#d9f900]">Play indoors</p><h2 className="mt-3 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">Two courts.<br />One place to play.</h2></div>
            <p className="max-w-xl text-sm leading-6 text-white/60 sm:text-base md:justify-self-end md:text-right">Silica-finished surfaces, clear sightlines, and tournament-grade lighting for games, training, and events.</p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {[
              { number: '01', name: 'Main Court', image: '/assets/images/hero-image.png', note: 'Spacious primary court for games and group sessions.' },
              { number: '02', name: 'Side Court', image: '/assets/images/court2.png', note: 'Comfortable indoor court for focused play and training.' },
            ].map(court => <article key={court.number} className="group">
              <div className="relative min-h-[360px] overflow-hidden bg-black md:min-h-[460px]"><img src={court.image} alt={court.name} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-[#241f1d] via-transparent to-black/10" /><span className="absolute left-5 top-5 text-xs font-bold tracking-[0.2em] text-[#d9f900]">{court.number}</span><div className="absolute inset-x-0 bottom-0 p-6 sm:p-8"><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#d9f900]">Indoor pickleball court</p><h3 className="mt-2 text-3xl font-bold uppercase tracking-[-0.03em]">{court.name}</h3><p className="mt-3 max-w-sm text-sm leading-6 text-white/70">{court.note}</p></div></div>
            </article>)}
          </div>
        </div>
      </section>

      <section className="bg-[#f4efe5] py-16 text-[#241f1d] sm:py-20 lg:py-24">
        <div className="mx-auto grid max-w-7xl overflow-hidden border border-[#72151d]/20 bg-[#fffdf8] lg:grid-cols-[1.2fr_.8fr]">
          <div className="relative flex min-h-[380px] items-center justify-center p-6 sm:p-10"><span className="absolute left-6 top-6 text-xs font-bold uppercase tracking-[0.22em] text-[#72151d]">Court layout</span><img src="/assets/images/courtDiagram.png" alt="Layout of Court 1 and Court 2" className="max-h-[460px] w-full object-contain" /></div>
          <div className="flex flex-col justify-between border-t border-[#72151d]/20 bg-[#72151d] p-7 text-white sm:p-10 lg:border-l lg:border-t-0 lg:p-14">
            <div><p className="text-xs font-bold uppercase tracking-[0.22em] text-[#d9f900]">Built for better play</p><div className="mt-8 space-y-7">{[
              ['Two indoor courts', 'Full-size regulation courts suited for doubles or singles.'],
              ['Silica-finished surfaces', 'Dependable grip and a consistent bounce in every session.'],
              ['Tournament lighting', 'Bright, clear visibility for daytime and evening play.'],
            ].map(([title, text], index) => <div key={title} className="grid grid-cols-[2.5rem_1fr] gap-3 border-b border-white/20 pb-6"><span className="text-xs font-bold text-[#d9f900]">0{index + 1}</span><div><h3 className="font-bold uppercase tracking-[-0.01em]">{title}</h3><p className="mt-2 text-sm leading-6 text-white/65">{text}</p></div></div>)}</div></div>
            <Button className="mt-9 h-12 w-full rounded-xl bg-[#d9f900] font-bold text-[#241f1d] hover:bg-[#e4ff3b]" asChild><Link to={ROUTES.BOOKING}>Book a Court</Link></Button>
          </div>
        </div>
      </section>

      {/* Location Map Section */}
      <section className="relative h-[650px] w-full overflow-hidden border-t border-[#72151d]/15 bg-[#f4efe5] lg:h-[750px]">
        
        {/* Full Screen Map */}
        <div className="absolute inset-0 z-0">
          {cookieConsent === 'accepted' ? <iframe
            src="https://maps.google.com/maps?q=3H3V%2B8Q9,%20University%20Ave,%20Talomo,%20Davao%20City,%20Davao%20del%20Sur&t=&z=17&ie=UTF8&iwloc=&output=embed"
            width="100%" 
            height="100%" 
            style={{ border: 0 }} 
            allowFullScreen={true} 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
            title="Google Maps Location"
            className="w-full h-full object-cover pointer-events-none"
          ></iframe> : <div className="flex h-full w-full items-center justify-center bg-[#f4efe5] px-6 text-center"><div className="max-w-md border border-[#72151d]/20 bg-[#fffdf8] p-7 shadow-lg"><ShieldCheckIcon className="mx-auto h-10 w-10 text-[#72151d]" /><h3 className="mt-3 text-xl font-bold text-[#241f1d]">Map privacy protected</h3><p className="mt-2 text-sm leading-relaxed text-[#6b625d]">Google Maps stays disabled until you allow optional third-party cookies.</p><Button className="mt-5 rounded-xl border-[#72151d]/25 text-[#72151d] hover:bg-[#72151d]/5" variant="outline" onClick={() => chooseCookieConsent('accepted')}>Allow cookies and show map</Button></div></div>}
        </div>

        {/* Pulsing Map Pin Over Chixboy Grill (Centered in iframe) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="relative flex flex-col items-center -mt-10">
            <MapPinIcon className="h-14 w-14 text-primary drop-shadow-2xl relative z-10 animate-bounce" style={{ animationDuration: '2s' }} />
            <div className="relative flex h-4 w-4 items-center justify-center -mt-3">
              <span className="absolute inline-flex h-12 w-12 animate-ping rounded-full bg-primary opacity-60" style={{ animationDuration: '1.5s' }}></span>
              <span className="relative inline-flex h-4 w-4 rounded-full bg-primary shadow-lg border-2 border-white"></span>
            </div>
          </div>
        </div>
        
        {/* White Gradient from the Left */}
        <div className="pointer-events-none absolute inset-0 z-10 w-full bg-gradient-to-r from-[#f4efe5] via-[#f4efe5]/95 to-transparent lg:w-[65%]"></div>
        {/* Bottom gradient for mobile readability */}
        <div className="pointer-events-none absolute inset-0 z-10 block h-full bg-gradient-to-t from-[#f4efe5] via-[#f4efe5]/90 to-transparent lg:hidden"></div>

        {/* Floating Content (No Card) */}
        <div className="relative z-20 mx-auto flex h-full max-w-7xl flex-col justify-end px-5 pb-12 sm:px-8 lg:justify-center lg:px-10 lg:pb-0">
          <div className="max-w-md w-full">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#72151d]">Plan your visit</p>
            <h2 className="mt-3 text-4xl font-bold uppercase tracking-[-0.04em] text-[#241f1d] sm:text-5xl">Find us here.</h2>
            <div className="mb-8 mt-6 h-1 w-14 bg-[#72151d] md:mb-12"></div>
            
            <div className="space-y-8 md:space-y-10">
              <div className="flex items-start gap-4 md:gap-6">
                <MapPinIcon className="mt-1 h-6 w-6 shrink-0 text-[#72151d] drop-shadow-sm md:mt-0.5 md:h-8 md:w-8" />
                <div>
                  <h4 className="mb-1 text-xl font-bold text-[#72151d] drop-shadow-sm md:mb-2 md:text-2xl">Address</h4>
                  <p className="text-base font-medium leading-relaxed text-[#241f1d] drop-shadow-sm md:text-lg">
                    University Avenue<br />
                    Juna Subdivision, Matina, Davao City
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 md:gap-6">
                <ClockIcon className="mt-1 h-6 w-6 shrink-0 text-[#72151d] drop-shadow-sm md:mt-0.5 md:h-8 md:w-8" />
                <div>
                  <h4 className="mb-1 text-xl font-bold text-[#72151d] drop-shadow-sm md:mb-2 md:text-2xl">Operating Hours</h4>
                  <p className="text-base font-medium leading-relaxed text-[#241f1d] drop-shadow-sm md:text-lg">
                    Monday - Sunday<br />
                    7:00 AM - 12:00 MN
                  </p>
                </div>
              </div>
            </div>
            
            <Button className="mt-8 h-12 w-full rounded-xl bg-[#72151d] px-8 text-base font-bold text-white shadow-xl shadow-[#72151d]/20 hover:bg-[#5f1118] sm:w-auto md:mt-12 md:h-14 md:px-10 md:text-lg" asChild>
              <a href="https://maps.google.com/?q=3H3V%2B8Q9%2C+University+Ave%2C+Talomo%2C+Davao+City%2C+Davao+del+Sur" target="_blank" rel="noopener noreferrer">
                Get Directions
              </a>
            </Button>
          </div>
        </div>
      </section>

      {cookieConsent === null && <div className="fixed bottom-3 left-3 right-3 z-[100] max-w-sm rounded-2xl border border-border bg-background/95 p-4 shadow-2xl backdrop-blur-xl sm:bottom-5 sm:left-5 sm:right-auto" role="dialog" aria-live="polite" aria-label="Cookie permission">
        <div className="flex flex-col gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="mt-0.5 rounded-full bg-primary/10 p-1.5 text-primary"><ShieldCheckIcon className="h-4 w-4" /></div>
            <div><h2 className="text-sm font-bold text-foreground">Your cookie choices</h2><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Optional services such as Google Maps may use cookies. You can decline and continue using the site.</p></div>
          </div>
          <div className="flex gap-2 pl-9">
            <Button size="sm" className="h-8 flex-1 text-xs" variant="outline" onClick={() => chooseCookieConsent('declined')}>Decline</Button>
            <Button size="sm" className="h-8 flex-1 text-xs" onClick={() => chooseCookieConsent('accepted')}>Accept</Button>
          </div>
        </div>
      </div>}
    </div>
  );
}
