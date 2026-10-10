import { Link } from 'react-router-dom';
import {
  ArrowRightIcon,
  ChatBubbleLeftRightIcon,
  CheckIcon,
  SparklesIcon,
  UserGroupIcon,
} from '@heroicons/react/24/solid';
import { Button } from '@/components/ui/button';
import { PaddleIcon } from '@/components/ui/paddle-icon';
import { PickleballAccent } from '@/components/public/PickleballAccent';
import { EXTERNAL_LINKS, ROUTES } from '@/lib/constants';

const benefits = [
  {
    number: '01',
    icon: PaddleIcon,
    title: 'Build the fundamentals',
    description: 'Develop dependable technique, court awareness, and confidence from your first focused session.',
  },
  {
    number: '02',
    icon: SparklesIcon,
    title: 'Sharpen your game',
    description: 'Turn the parts of your game you want to improve into deliberate, purposeful court time.',
  },
  {
    number: '03',
    icon: UserGroupIcon,
    title: 'Train at your level',
    description: 'Share your experience and goals so our team can help arrange a session that fits where you are now.',
  },
];

const steps = [
  ['Tell us about your game', 'Share your experience level, goals, and preferred training schedule.'],
  ['Confirm your session', 'Our team will coordinate the available time, court, and training details with you.'],
  ['Step onto the court', 'Arrive ready to learn, move, and enjoy a more confident game.'],
];

const rateDetails = [
  'Personalized coaching and drills',
  'Beginner to advanced skill levels',
  'Minimum two-hour session',
  'Discounted court rate — ₱300 per hour',
];

const trainers = [
  {
    name: 'Coach JC',
    image: '/assets/images/coaches/coachjc.png',
    position: 'center',
  },
  {
    name: 'Coach Luis',
    image: '/assets/images/coaches/coachluis.png',
    position: 'center',
  },
  {
    name: 'Coach Nelvin',
    image: '/assets/images/coaches/coachnelvin.png',
    position: 'center',
  },
];

export default function TrainingPage() {
  return (
    <div className="bg-[#f4efe5] text-[#241f1d]">
      <section className="relative min-h-[680px] overflow-hidden border-b border-[#72151d]/15">
        <img
          src="/assets/images/players.png"
          alt="Players enjoying pickleball at The Dirty Kitchen"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#f4efe5]/95 via-[#f4efe5]/90 to-[#f4efe5]/70 sm:from-[#f4efe5] sm:via-[#f4efe5]/95 sm:to-[#f4efe5]/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#f4efe5]/45 via-transparent to-[#f4efe5]/25" />
        <div className="relative mx-auto flex min-h-[680px] max-w-7xl items-center px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
          <div className="relative z-10 max-w-3xl">
            <div className="mb-10 flex max-w-xl items-center justify-between gap-6">
              <img src="/assets/images/tdk-logo.png" alt="The Dirty Kitchen Pickleball Court" className="h-auto w-52 object-contain sm:w-64" />
              <PickleballAccent className="h-16 w-16 drop-shadow-[0_8px_18px_rgba(114,21,29,0.12)] sm:h-20 sm:w-20" />
            </div>
            <p className="mb-5 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.26em] text-[#72151d]">
              <span className="h-px w-10 bg-[#72151d]" /> Pickleball training
            </p>
            <h1 className="text-[clamp(2.75rem,6vw,5rem)] font-black uppercase leading-[0.88] tracking-[-0.055em] text-[#72151d]">
              Grow your<br />game.
            </h1>
            <p className="mt-8 max-w-xl text-base leading-7 text-[#5e5651] sm:text-lg sm:leading-8">
              From your first paddle to your next breakthrough, get focused court time shaped around the player you are—and the player you want to become.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="h-12 rounded-xl bg-[#72151d] px-7 font-bold text-white hover:bg-[#5f1118]" asChild>
                <a href={EXTERNAL_LINKS.FACEBOOK_MESSAGE} target="_blank" rel="noopener noreferrer">
                  Ask about training <ArrowRightIcon className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="h-12 rounded-xl border-[#72151d]/30 bg-transparent px-7 font-bold text-[#72151d] hover:bg-white/50 hover:text-[#72151d]" asChild>
                <Link to={ROUTES.SCHEDULE}>View court schedule</Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 right-0 hidden bg-[#d9f900] px-7 py-5 text-[#241f1d] sm:block lg:px-10 lg:py-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Focused court time</p>
          <p className="mt-1 text-lg font-bold">Built around your game.</p>
        </div>
      </section>

      <section className="bg-[#241f1d] py-16 text-white sm:py-20 lg:py-24" aria-labelledby="trainers-title">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid gap-5 border-b border-white/15 pb-8 md:grid-cols-2 md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#d9f900]">The people behind your progress</p>
              <h2 id="trainers-title" className="mt-3 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">Meet the trainers.</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-white/60 sm:text-base md:justify-self-end md:text-right">
              Learn with trainers who keep every session focused, practical, and welcoming at every level.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {trainers.map((trainer, index) => (
              <article key={trainer.name} className="group">
                <div className="relative aspect-[4/5] overflow-hidden bg-[#302927]">
                  <img
                    src={trainer.image}
                    alt="The Dirty Kitchen pickleball training community"
                    className="h-full w-full scale-[1.65] object-cover grayscale transition duration-500 group-hover:scale-[1.72] group-hover:grayscale-0"
                    style={{ objectPosition: trainer.position }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#241f1d] via-[#241f1d]/10 to-transparent" />
                  <span className="absolute left-5 top-5 text-xs font-bold tracking-[0.2em] text-[#d9f900]">0{index + 1}</span>
                  <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#d9f900]">Pickleball trainer</p>
                    <h3 className="mt-2 text-2xl font-bold uppercase tracking-[-0.025em] text-white">{trainer.name}</h3>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#fffdf8] py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid gap-5 border-b border-[#241f1d]/15 pb-8 md:grid-cols-2 md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#72151d]">Why train with us</p>
              <h2 className="mt-3 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">Practice with purpose.</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-[#6b625d] sm:text-base md:justify-self-end md:text-right">
              Make every hour count with a session centered on your current level and the parts of your game you want to develop.
            </p>
          </div>

          <div className="grid border-t border-[#241f1d]/15 lg:grid-cols-3">
            {benefits.map(({ number, icon: Icon, title, description }, index) => (
              <article key={title} className={`group min-h-72 border-b border-[#241f1d]/15 px-1 py-9 sm:px-6 lg:px-8 ${index < benefits.length - 1 ? 'lg:border-r' : ''}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tracking-[0.18em] text-[#72151d]">{number}</span>
                  <span className="grid h-12 w-12 place-items-center rounded-full border border-[#72151d]/20 text-[#72151d] transition-colors group-hover:bg-[#72151d] group-hover:text-white">
                    <Icon className="h-6 w-6" />
                  </span>
                </div>
                <h3 className="mt-12 max-w-xs text-2xl font-bold uppercase leading-tight tracking-[-0.025em] text-[#72151d]">{title}</h3>
                <p className="mt-4 max-w-sm text-sm leading-7 text-[#5e5651] sm:text-base">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#72151d] py-16 text-white sm:py-20 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[.76fr_1.24fr] lg:px-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#d9f900]">Getting started</p>
            <h2 className="mt-3 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">Three steps.<br />Then we play.</h2>
            <p className="mt-5 max-w-sm text-sm leading-6 text-white/65 sm:text-base">No complicated intake. Tell us where you are, and we will help organize the right court time.</p>
          </div>
          <ol className="border-t border-white/20">
            {steps.map(([title, description], index) => (
              <li key={title} className="grid grid-cols-[3rem_1fr] gap-4 border-b border-white/20 py-7 sm:grid-cols-[4rem_1fr] sm:py-8">
                <span className="text-sm font-bold tabular-nums text-[#d9f900]">0{index + 1}</span>
                <div>
                  <h3 className="text-xl font-bold uppercase tracking-[-0.02em]">{title}</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">{description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid overflow-hidden border border-[#72151d]/20 bg-[#fffdf8] lg:grid-cols-[1fr_.95fr]">
            <div className="p-7 sm:p-10 lg:p-14">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#72151d]">Discounted training court rate</p>
              <div className="mt-5 flex items-end gap-3 text-[#72151d]">
                <span className="mb-2 text-2xl font-bold">₱</span>
                <span className="text-7xl font-black tracking-[-0.06em] sm:text-8xl">300</span>
                <span className="mb-3 text-sm font-semibold text-[#5e5651]">per hour</span>
              </div>
              <p className="mt-6 max-w-lg text-sm leading-6 text-[#6b625d] sm:text-base">Training sessions have a two-hour minimum. Coach availability and final session details are confirmed with you before booking.</p>
            </div>

            <div className="flex flex-col justify-between border-t border-[#72151d]/20 bg-[#241f1d] p-7 text-white sm:p-10 lg:border-l lg:border-t-0 lg:p-14">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#d9f900]">What is included</p>
                <div className="mt-7 space-y-4">
                  {rateDetails.map(item => (
                    <p key={item} className="flex items-start gap-3 text-sm leading-6 text-white/85 sm:text-base">
                      <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#d9f900]" /> {item}
                    </p>
                  ))}
                </div>
              </div>
              <Button size="lg" className="mt-10 h-12 w-full rounded-xl bg-[#d9f900] font-bold text-[#241f1d] hover:bg-[#e4ff3b]" asChild>
                <a href={EXTERNAL_LINKS.FACEBOOK_MESSAGE} target="_blank" rel="noopener noreferrer">
                  <ChatBubbleLeftRightIcon className="mr-2 h-5 w-5" /> Message our team
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Promotional Ad */}
      <section className="bg-[#f4efe5] py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10 flex justify-center">
          <img src="/assets/images/coaches/ads.png" alt="Promotional Advertisement" className="w-full max-w-5xl rounded-2xl shadow-2xl" />
        </div>
      </section>
    </div>
  );
}
