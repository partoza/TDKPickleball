import { Link } from 'react-router-dom';
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  CheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  HandRaisedIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants';

const courtRules = [
  {
    number: '01',
    title: 'Booking',
    text: 'Court use is by reservation only. Please arrive ready to play and follow your scheduled time.',
    icon: CalendarDaysIcon,
  },
  {
    number: '02',
    title: 'Court shoes',
    text: 'Wear proper court shoes. Footwear that marks or damages the playing surface is not allowed.',
    icon: CheckIcon,
  },
  {
    number: '03',
    title: 'Keep it clean',
    text: 'Keep the playing area clean. Food, drinks, and smoking are not allowed on court.',
    icon: SparklesIcon,
  },
  {
    number: '04',
    title: 'Equipment',
    text: 'Handle court and rental equipment with care. Damage may be charged accordingly.',
    icon: WrenchScrewdriverIcon,
  },
  {
    number: '05',
    title: 'Respect',
    text: 'Be considerate of other players and staff. Disruptive or inappropriate behavior is not allowed.',
    icon: UserGroupIcon,
  },
  {
    number: '06',
    title: 'Safety',
    text: 'Play responsibly and follow safety guidance. Children must be supervised by an adult at all times.',
    icon: ShieldCheckIcon,
  },
  {
    number: '07',
    title: 'Belongings',
    text: 'Keep valuables secure. Management is not responsible for lost or damaged items.',
    icon: LockClosedIcon,
  },
  {
    number: '08',
    title: 'End of session',
    text: 'Leave the court on time and take your belongings with you. Please leave the space clean for the next players.',
    icon: ClockIcon,
  },
];

const bookingPolicy = [
  'All bookings are non-cancellable.',
  'Rescheduling is allowed up to 24 hours before the scheduled booking. Each booking is eligible for one rebooking only.',
  'No-shows and rescheduling requests made less than 24 hours before the scheduled booking will result in forfeiture of payment.',
];

const waiverItems = [
  {
    title: 'Play at your own risk',
    text: 'Pickleball is a physical activity. Be aware of the risk of falls, strains, sprains, and other injuries.',
  },
  {
    title: 'Take responsibility',
    text: 'Guests are responsible for their own safety and belongings. Management and staff are not liable for injuries, accidents, or lost or damaged items.',
  },
  {
    title: 'Follow the rules',
    text: 'Follow all court rules, safety guidelines, and staff instructions at all times.',
  },
];

function PickleballMark() {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
      <circle cx="60" cy="60" r="52" fill="#d9f900" />
      {[[39, 35], [66, 31], [83, 49], [42, 64], [69, 61], [84, 78], [54, 88]].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="5" fill="#72151d" opacity=".78" />
      ))}
    </svg>
  );
}

export default function RulesPage() {
  return (
    <div className="bg-[#f4efe5] text-[#241f1d]">
      <section className="relative overflow-hidden border-b border-[#72151d]/15">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 opacity-[0.08] sm:h-96 sm:w-96">
          <PickleballMark />
        </div>
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.15fr_.85fr] lg:items-end lg:px-10 lg:py-28">
          <div className="relative z-10 max-w-3xl">
            <p className="mb-5 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.26em] text-[#72151d]">
              <span className="h-px w-10 bg-[#72151d]" /> Before you step on court
            </p>
            <h1 className="text-[clamp(3.5rem,9vw,7.5rem)] font-black uppercase leading-[0.82] tracking-[-0.065em] text-[#72151d]">
              Play fair.<br />Play safe.
            </h1>
            <p className="mt-8 max-w-2xl text-base leading-7 text-[#5e5651] sm:text-lg sm:leading-8">
              A few straightforward rules keep every session safe, on time, and enjoyable for the whole Dirty Kitchen community.
            </p>
          </div>

          <div className="relative z-10 lg:justify-self-end">
            <div className="relative w-full max-w-md border-l-2 border-[#72151d] pl-6 sm:pl-8">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#72151d]">Quick read</p>
              <p className="mt-3 text-2xl font-semibold leading-tight sm:text-3xl">Respect the slot. Protect the court. Look after each other.</p>
              <div className="mt-7 flex flex-wrap gap-2 text-xs font-semibold">
                <a href="#court-rules" className="rounded-full border border-[#72151d]/20 bg-white/55 px-4 py-2.5 transition hover:border-[#72151d] hover:text-[#72151d]">Court rules</a>
                <a href="#booking-policy" className="rounded-full border border-[#72151d]/20 bg-white/55 px-4 py-2.5 transition hover:border-[#72151d] hover:text-[#72151d]">Booking policy</a>
                <a href="#waiver" className="rounded-full border border-[#72151d]/20 bg-white/55 px-4 py-2.5 transition hover:border-[#72151d] hover:text-[#72151d]">Waiver</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="court-rules" className="scroll-mt-24 bg-[#fffdf8] py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="mb-10 grid gap-5 border-b border-[#241f1d]/15 pb-8 md:grid-cols-[1fr_1fr] md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#72151d]">The house standard</p>
              <h2 className="mt-3 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">Court rules</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-[#6b625d] md:justify-self-end md:text-right sm:text-base">Eight simple habits that make the court better for the next rally—and the next group.</p>
          </div>

          <ol className="grid border-t border-[#241f1d]/15 md:grid-cols-2">
            {courtRules.map((rule, index) => {
              const Icon = rule.icon;
              return (
                <li key={rule.number} className={`group grid min-h-56 grid-cols-[auto_1fr] gap-5 border-b border-[#241f1d]/15 py-8 transition-colors hover:bg-[#f4efe5]/70 sm:gap-7 sm:px-6 ${index % 2 === 0 ? 'md:border-r' : ''}`}>
                  <div className="flex flex-col items-center gap-4">
                    <span className="text-xs font-bold tabular-nums tracking-[0.18em] text-[#72151d]">{rule.number}</span>
                    <span className="grid h-12 w-12 place-items-center rounded-full border border-[#72151d]/20 text-[#72151d] transition group-hover:bg-[#72151d] group-hover:text-white">
                      <Icon className="h-6 w-6" />
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold uppercase tracking-[-0.02em] text-[#72151d] sm:text-2xl">{rule.title}</h3>
                    <p className="mt-3 max-w-md text-sm leading-7 text-[#5e5651] sm:text-base">{rule.text}</p>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="mt-10 grid gap-4 border border-[#72151d]/15 bg-[#f4efe5] p-6 sm:grid-cols-[auto_1fr] sm:items-center sm:p-8">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-[#72151d] text-white"><ExclamationTriangleIcon className="h-6 w-6" /></span>
            <div><h3 className="font-bold text-[#72151d]">Food and beverage policy</h3><p className="mt-1 text-sm leading-6 text-[#5e5651] sm:text-base">Outside food and beverages are not allowed, except personal tumblers. Our in-house restaurant is available for your food and beverage needs.</p></div>
          </div>
        </div>
      </section>

      <section id="booking-policy" className="scroll-mt-24 bg-[#72151d] py-16 text-white sm:py-20 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[.72fr_1.28fr] lg:px-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#d9f900]">Plan ahead</p>
            <h2 className="mt-3 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">Rescheduling<br className="hidden lg:block" /> & cancellation</h2>
            <p className="mt-5 max-w-sm text-sm leading-6 text-white/65 sm:text-base">If plans change, let us know early. These terms help us keep court time available and fair for everyone.</p>
          </div>
          <ol className="border-t border-white/20">
            {bookingPolicy.map((item, index) => (
              <li key={item} className="grid grid-cols-[3rem_1fr] gap-4 border-b border-white/20 py-7 sm:grid-cols-[4rem_1fr] sm:py-8">
                <span className="text-sm font-bold tabular-nums text-[#d9f900]">0{index + 1}</span>
                <p className="max-w-2xl text-base leading-7 text-white/90 sm:text-lg sm:leading-8">{item}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="waiver" className="scroll-mt-24 py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <div className="mb-7 h-24 w-24"><PickleballMark /></div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#72151d]">Player waiver</p>
              <h2 className="mt-3 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">Know the risk.<br />Own your game.</h2>
            </div>
            <div className="divide-y divide-[#241f1d]/15 border-y border-[#241f1d]/15">
              {waiverItems.map((item, index) => (
                <article key={item.title} className="grid gap-3 py-8 sm:grid-cols-[3.5rem_1fr] sm:gap-5 sm:py-9">
                  <span className="text-xs font-bold tracking-[0.18em] text-[#72151d]">0{index + 1}</span>
                  <div><h3 className="text-xl font-bold uppercase tracking-[-0.02em] text-[#72151d] sm:text-2xl">{item.title}</h3><p className="mt-3 text-sm leading-7 text-[#5e5651] sm:text-base">{item.text}</p></div>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-8 bg-[#241f1d] p-7 text-white sm:p-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex max-w-3xl items-start gap-4">
              <HandRaisedIcon className="mt-1 h-7 w-7 shrink-0 text-[#d9f900]" />
              <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d9f900]">Acceptance</p><p className="mt-2 text-lg font-semibold leading-7 sm:text-xl">Making your payment confirms your acceptance of our policy and waiver.</p></div>
            </div>
            <Button size="lg" className="h-12 shrink-0 bg-[#d9f900] px-6 font-bold text-[#241f1d] hover:bg-[#e4ff3b]" asChild>
              <Link to={ROUTES.BOOKING}>Book with confidence <ArrowRightIcon className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
