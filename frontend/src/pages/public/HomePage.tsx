import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChatBubbleBottomCenterTextIcon as Quote, StarIcon as Star, CheckCircleIcon, MapPinIcon, ClockIcon, ShieldCheckIcon } from '@heroicons/react/24/solid';

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

      {/* Rates Section */}
      <section className="bg-background py-20 md:py-24">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between"><div><p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-primary">Simple hourly pricing</p><h2 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">Rates</h2></div><p className="max-w-xl text-base leading-relaxed text-muted-foreground md:text-right md:text-lg">Choose regular court time or a dedicated training session. Your total is calculated automatically from the number of hours booked.</p></div>

          <div className="grid gap-5 lg:grid-cols-3">
            {[
              { title: 'Daytime', time: '7:00 AM – 5:00 PM', price: 320, description: 'A relaxed daytime schedule for casual games and regular court sessions.', features: ['Professional indoor court', 'Ideal for morning and afternoon play'], featured: false },
              { title: 'Prime Time', time: '5:00 PM – 12:00 MN', price: 400, description: 'Evening court access with the full tournament-lighting experience.', features: ['After-work sessions', 'Tournament lighting included'], featured: true },
              { title: 'Training', time: '7:00 AM – 12:00 MN', price: 300, description: 'A dedicated hourly rate for coached practice and focused skill development.', features: ['Available throughout operating hours', 'Designed for training sessions'], featured: false },
            ].map(rate => <Card key={rate.title} className={`relative flex h-full flex-col overflow-hidden rounded-3xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${rate.featured ? 'border-primary shadow-md' : 'border-border'}`}>{rate.featured && <div className="bg-primary py-2 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-white">Most popular</div>}<CardHeader className={rate.featured ? 'pb-3 pt-7' : 'pb-3 pt-9'}><div className="mb-5 flex items-center justify-end"><span className="text-xs font-medium text-muted-foreground">per hour</span></div><CardTitle className="text-2xl">{rate.title}</CardTitle><CardDescription className="text-sm font-medium">{rate.time}</CardDescription></CardHeader><CardContent className="flex flex-1 flex-col pb-7"><div className="mb-5 flex items-end gap-1 text-primary"><span className="text-2xl font-bold">₱</span><span className="text-5xl font-bold tracking-tight tabular-nums">{formatPesoAmount(rate.price)}</span><span className="mb-1 text-sm font-semibold text-muted-foreground">/hr</span></div><p className="min-h-[60px] text-sm leading-relaxed text-muted-foreground">{rate.description}</p><ul className="my-6 space-y-3">{rate.features.map(feature => <li key={feature} className="flex items-start gap-2.5 text-sm"><CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><span>{feature}</span></li>)}</ul><Button className="mt-auto h-11 w-full hover:scale-105 active:scale-95 transition-all duration-200" variant={rate.featured ? 'default' : 'outline'} asChild><Link to={ROUTES.BOOKING}>{rate.title === 'Training' ? 'Book Training' : 'Book This Rate'}</Link></Button></CardContent></Card>)}
          </div>
        </div>
      </section>

      {/* The Courts Section */}
      <section className="relative overflow-hidden bg-muted/10 py-20 md:py-24">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="mb-10 grid gap-5 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
            <div><p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-primary">Play indoors</p><h2 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">Courts</h2></div>
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground lg:justify-self-end lg:text-right md:text-lg">Two professionally surfaced indoor pickleball courts with clear sightlines and tournament-grade lighting, ready for casual games, training, and events.</p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {[
              { number: '01', name: 'Main Court', image: '/assets/images/hero-image.png', note: 'Spacious primary court for games and group sessions' },
              { number: '02', name: 'Side Court', image: '/assets/images/court2.png', note: 'Comfortable indoor court for focused play and training' },
            ].map(court => <article key={court.number} className="group relative min-h-[320px] overflow-hidden rounded-3xl border border-white/10 bg-black shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-xl md:min-h-[410px]"><img src={court.image} alt={court.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-black/5" /><div className="absolute inset-x-0 bottom-0 z-10 p-6 md:p-8"><div className="mb-4 flex items-center gap-3"><span className="rounded-full border border-white/25 bg-black/30 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-md">Court {court.number}</span><span className="h-px flex-1 bg-white/25" /></div><h3 className="text-3xl font-bold tracking-tight text-white md:text-4xl">{court.name}</h3><p className="mt-2 max-w-md text-sm leading-relaxed text-white/75">{court.note}</p></div></article>)}
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
            <div className="relative flex min-h-[340px] items-center justify-center overflow-hidden rounded-3xl border bg-card p-5 shadow-sm sm:p-8"><div className="absolute left-5 top-5 z-10 rounded-full bg-foreground px-4 py-2 text-[11px] font-semibold text-background shadow-sm">Court layout</div><img src="/assets/images/courtDiagram.png" alt="Layout of Court 1 and Court 2" className="h-full max-h-[430px] w-full object-contain" /></div>
            <div className="rounded-3xl border bg-card p-6 shadow-sm md:p-8"><p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">At a glance</p><h3 className="mt-2 text-2xl font-bold tracking-tight">Built for better play</h3><ul className="mt-7 space-y-6">{[
              ['Two Indoor Courts', 'Full-size regulation courts suited for doubles or singles.'],
              ['Professional Surfacing', 'Non-slip texture for dependable grip and a consistent bounce.'],
              ['Tournament Lighting', 'Bright anti-glare lighting for clear visibility day or night.'],
            ].map(([title, text]) => <li key={title} className="flex items-start gap-3"><CheckCircleIcon className="mt-0.5 h-6 w-6 shrink-0 text-primary" /><div><h4 className="font-semibold text-foreground">{title}</h4><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p></div></li>)}</ul><Button className="mt-8 w-full hover:scale-105 active:scale-95 transition-all duration-200" asChild><Link to={ROUTES.BOOKING}>Book a Court</Link></Button></div>
          </div>
        </div>
      </section>



      {/* Testimonials Section */}
      <section className="relative overflow-hidden border-t border-border/50 bg-muted/20 py-20 md:py-24">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="container relative z-10 mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-10 grid items-end gap-8 md:grid-cols-[1fr_auto] md:mb-14">
            <div className="max-w-2xl">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-primary">Player stories</p>
              <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">What Players Say</h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">Real feedback from the community that plays, trains, and competes on our courts.</p>
            </div>
            <div className="flex w-fit items-center gap-4 rounded-2xl border bg-background px-5 py-4 shadow-sm">
              <div><p className="text-3xl font-bold leading-none text-foreground">4.7</p><p className="mt-1 text-xs text-muted-foreground">Average rating</p></div>
              <div className="border-l pl-4"><div className="flex gap-0.5 text-amber-400">{[0, 1, 2, 3, 4].map(star => <Star key={star} className="h-4 w-4 fill-current" />)}</div><p className="mt-1 text-xs font-medium text-muted-foreground">Loved by local players</p></div>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              { name: "Miguel Santos", initials: "MS", role: "Competitive Player", rating: 5, text: "Best indoor courts in the city. The lighting is perfect and the surface has great grip. Highly recommended for both casual and competitive play." },
              { name: "Anna Reyes", initials: "AR", role: "Weekend Warrior", rating: 4, text: "Booking is so smooth! Love playing here after work with friends. The staff is also very accommodating and friendly." },
              { name: "Carlo Dimaculangan", initials: "CD", role: "Morning Regular", rating: 5, text: "Top-notch facility. The morning rate is a steal for the quality of courts you're getting. I will definitely be a regular here." }
            ].map(testimonial => (
              <article key={testimonial.name} className="group relative flex h-full flex-col overflow-hidden rounded-3xl border bg-background p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl md:p-7">
                <Quote className="absolute right-5 top-5 h-14 w-14 text-primary/[0.07] transition-colors group-hover:text-primary/10" />
                <div className="relative mb-6 flex items-center justify-between gap-4">
                  <div className="flex gap-1" aria-label={`${testimonial.rating} out of 5 stars`}>
                    {[0, 1, 2, 3, 4].map(star => <Star key={star} className={star < testimonial.rating ? 'h-5 w-5 fill-amber-400 text-amber-400' : 'h-5 w-5 fill-muted text-muted'} />)}
                  </div>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">{testimonial.rating}.0</span>
                </div>
                <blockquote className="relative flex-1 text-base leading-7 text-foreground/85">“{testimonial.text}”</blockquote>
                <div className="mt-7 flex items-center gap-3 border-t pt-5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-sm">{testimonial.initials}</span>
                  <div><p className="font-semibold text-foreground">{testimonial.name}</p><p className="text-xs text-muted-foreground">{testimonial.role}</p></div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Location Map Section */}
      <section className="relative h-[650px] lg:h-[750px] w-full border-t border-border/50 overflow-hidden">
        
        {/* Full Screen Map */}
        <div className="absolute inset-0 z-0">
          {cookieConsent === 'accepted' ? <iframe
            src="https://maps.google.com/maps?q=Chixboy%20Grill,%2041%20Luisa%20Street,%20Davao%20City,%20Davao,%20Philippines&t=&z=15&ie=UTF8&iwloc=&output=embed" 
            width="100%" 
            height="100%" 
            style={{ border: 0 }} 
            allowFullScreen={true} 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
            title="Google Maps Location"
            className="w-full h-full object-cover pointer-events-none"
          ></iframe> : <div className="flex h-full w-full items-center justify-center bg-muted/40 px-6 text-center"><div className="max-w-md rounded-3xl border bg-background/95 p-7 shadow-lg"><ShieldCheckIcon className="mx-auto h-10 w-10 text-primary" /><h3 className="mt-3 text-xl font-bold">Map privacy protected</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Google Maps stays disabled until you allow optional third-party cookies.</p><Button className="mt-5" variant="outline" onClick={() => chooseCookieConsent('accepted')}>Allow cookies and show map</Button></div></div>}
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
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-transparent pointer-events-none z-10 w-full lg:w-[65%]"></div>
        {/* Bottom gradient for mobile readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none z-10 lg:hidden block h-full"></div>

        {/* Floating Content (No Card) */}
        <div className="container relative h-full mx-auto px-4 md:px-6 max-w-7xl flex flex-col justify-end lg:justify-center z-20 pb-12 lg:pb-0">
          <div className="max-w-md w-full">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground uppercase mb-4 md:mb-6">Find Us Here</h2>
            <div className="w-12 md:w-16 h-1 md:h-1.5 bg-primary rounded-full mb-8 md:mb-12"></div>
            
            <div className="space-y-8 md:space-y-10">
              <div className="flex items-start gap-4 md:gap-6">
                <MapPinIcon className="h-6 w-6 md:h-8 md:w-8 text-primary shrink-0 mt-1 md:mt-0.5 drop-shadow-sm" />
                <div>
                  <h4 className="text-xl md:text-2xl font-bold text-primary mb-1 md:mb-2 drop-shadow-sm">Address</h4>
                  <p className="text-base md:text-lg text-foreground font-medium leading-relaxed drop-shadow-sm">
                    University Drive<br />
                    Juna Subdivision, Davao City, 8000
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 md:gap-6">
                <ClockIcon className="h-6 w-6 md:h-8 md:w-8 text-primary shrink-0 mt-1 md:mt-0.5 drop-shadow-sm" />
                <div>
                  <h4 className="text-xl md:text-2xl font-bold text-primary mb-1 md:mb-2 drop-shadow-sm">Operating Hours</h4>
                  <p className="text-base md:text-lg text-foreground font-medium leading-relaxed drop-shadow-sm">
                    Monday - Sunday<br />
                    6:00 AM - 12:00 MN
                  </p>
                </div>
              </div>
            </div>
            
            <Button className="mt-8 md:mt-12 w-full sm:w-auto px-8 md:px-10 hover:scale-105 active:scale-95 transition-all duration-200 h-12 md:h-14 text-base md:text-lg font-bold shadow-xl shadow-primary/25" asChild>
              <a href="https://maps.google.com/?q=Chixboy+Grill,+41+Luisa+Street,+Davao+City,+Davao,+Philippines" target="_blank" rel="noopener noreferrer">
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
