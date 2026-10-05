import { Link } from 'react-router-dom';
import {
  ArrowRightIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  SparklesIcon,
  UserGroupIcon,
} from '@heroicons/react/24/solid';
import { Button } from '@/components/ui/button';
import { PaddleIcon } from '@/components/ui/paddle-icon';
import { EXTERNAL_LINKS, ROUTES } from '@/lib/constants';

const benefits = [
  {
    icon: PaddleIcon,
    title: 'Learn the fundamentals',
    description: 'Build dependable technique, court awareness, and confidence from the first session.',
  },
  {
    icon: SparklesIcon,
    title: 'Sharpen your game',
    description: 'Turn the areas you want to improve into focused, purposeful court time.',
  },
  {
    icon: UserGroupIcon,
    title: 'Train at your level',
    description: 'Tell us your experience and goals so our team can help arrange the right session.',
  },
];

const steps = [
  ['Tell us about your game', 'Share your experience level, goals, and preferred training schedule.'],
  ['Confirm your session', 'Our team will coordinate the available time, court, and training details with you.'],
  ['Step onto the court', 'Arrive ready to learn, move, and enjoy a more confident game.'],
];

export default function TrainingPage() {
  return (
    <div className="bg-white text-slate-900">
      <section className="relative isolate min-h-[620px] overflow-hidden bg-slate-950">
        <img
          src="/assets/images/players.png"
          alt="Pickleball players together at The Dirty Kitchen"
          className="absolute inset-0 h-full w-full object-cover object-center opacity-65"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-slate-950/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

        <div className="relative mx-auto flex min-h-[620px] max-w-7xl items-center px-4 py-20 md:px-6">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white backdrop-blur-md">
              <PaddleIcon className="h-4 w-4" white /> Pickleball training
            </div>
            <h1 className="text-5xl font-bold tracking-[-0.045em] text-white sm:text-6xl lg:text-7xl">
              Grow your game, one rally at a time.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/80 md:text-xl">
              Whether you are picking up a paddle for the first time or working toward a stronger all-around game, training at The Dirty Kitchen gives you focused time on court.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="h-13 rounded-xl px-7 text-base font-bold shadow-xl shadow-black/20" asChild>
                <a href={EXTERNAL_LINKS.FACEBOOK_MESSAGE} target="_blank" rel="noopener noreferrer">
                  Ask About Training <ArrowRightIcon className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="h-13 rounded-xl border-white/40 bg-white/10 px-7 text-base font-bold text-white backdrop-blur-md hover:bg-white hover:text-primary" asChild>
                <Link to={ROUTES.SCHEDULE}>View Court Schedule</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Why train with us</p>
              <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">Practice with a purpose.</h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-slate-600 md:text-lg lg:justify-self-end">
              Make your court time count with a session centered on your current level and the parts of your game you want to develop.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {benefits.map(({ icon: Icon, title, description }) => (
              <article key={title} className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-xl font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-20 md:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 md:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Getting started</p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">Your first session is simple.</h2>
            <div className="mt-10 space-y-7">
              {steps.map(([title, description], index) => (
                <div key={title} className="flex gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-white">{index + 1}</span>
                  <div>
                    <h3 className="text-lg font-bold">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="overflow-hidden rounded-[2rem] bg-primary text-white shadow-2xl shadow-primary/15">
            <div className="p-8 md:p-10">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">Training court rate</p>
              <div className="mt-5 flex items-end gap-2">
                <span className="text-2xl font-bold">₱</span>
                <span className="text-6xl font-bold tracking-tight">300</span>
                <span className="mb-2 text-sm font-semibold text-white/70">per hour</span>
              </div>
              <div className="mt-7 space-y-3 border-t border-white/20 pt-7">
                {['Available during operating hours', 'Indoor court with tournament lighting', 'Session details confirmed by our team'].map(item => (
                  <p key={item} className="flex items-start gap-3 text-sm text-white/90">
                    <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0" /> {item}
                  </p>
                ))}
              </div>
              <p className="mt-6 text-xs leading-5 text-white/65">Coach availability and any additional fees are confirmed with you before your session.</p>
              <Button size="lg" className="mt-8 h-12 w-full rounded-xl bg-white font-bold text-primary hover:bg-white/90" asChild>
                <a href={EXTERNAL_LINKS.FACEBOOK_MESSAGE} target="_blank" rel="noopener noreferrer">
                  <ChatBubbleLeftRightIcon className="mr-2 h-5 w-5" /> Message Our Team
                </a>
              </Button>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
