import {
  ArrowUpRightIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { PickleballAccent } from '@/components/public/PickleballAccent';
import { EXTERNAL_LINKS } from '@/lib/constants';

export default function ContactPage() {
  return (
    <div className="bg-[#f4efe5] text-[#241f1d]">
      <section className="relative overflow-hidden border-b border-[#72151d]/15">
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.02fr_.98fr] lg:items-center lg:px-10 lg:py-24">
          <div className="relative z-10 max-w-2xl">
            <div className="mb-10 flex max-w-xl items-center justify-between gap-6">
              <img src="/assets/images/tdk-logo.png" alt="The Dirty Kitchen Pickleball Court" className="h-auto w-52 object-contain sm:w-64" />
              <PickleballAccent className="h-16 w-16 drop-shadow-[0_8px_18px_rgba(114,21,29,0.12)] sm:h-20 sm:w-20" />
            </div>
            <p className="mb-5 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.26em] text-[#72151d]">
              <span className="h-px w-10 bg-[#72151d]" /> Contact the team
            </p>
            <h1 className="text-[clamp(2.75rem,6vw,5rem)] font-black uppercase leading-[0.88] tracking-[-0.055em] text-[#72151d]">
              Let’s get<br />you on court.
            </h1>
            <p className="mt-8 max-w-xl text-base leading-7 text-[#5e5651] sm:text-lg sm:leading-8">
              Questions about a booking, training, or court availability? Reach The Dirty Kitchen team directly and we will help you sort the details.
            </p>
            <Button asChild size="lg" className="mt-9 h-12 rounded-none bg-[#72151d] px-7 font-bold text-white hover:bg-[#5f1118]">
              <a href={EXTERNAL_LINKS.FACEBOOK_MESSAGE} target="_blank" rel="noopener noreferrer">
                <ChatBubbleLeftRightIcon className="mr-2 h-5 w-5" /> Message us on Facebook
              </a>
            </Button>
          </div>

          <div className="relative z-10 lg:justify-self-end">
            <div className="relative mx-auto max-w-xl lg:mx-0">
              <div className="absolute -left-4 -top-4 h-full w-full border border-[#72151d]/25 sm:-left-6 sm:-top-6" aria-hidden="true" />
              <img src="/assets/images/contact-image.png" alt="The Dirty Kitchen Facebook page and court location in Davao City" className="relative aspect-[1250/743] w-full object-cover" />
              <a href={EXTERNAL_LINKS.FACEBOOK_PAGE} target="_blank" rel="noopener noreferrer" className="absolute bottom-0 right-0 inline-flex items-center gap-2 bg-[#d9f900] px-5 py-4 text-sm font-bold text-[#241f1d] transition hover:bg-[#e4ff3b] sm:px-7">
                Visit our Facebook page <ArrowUpRightIcon className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#fffdf8] py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid gap-5 border-b border-[#241f1d]/15 pb-8 md:grid-cols-2 md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#72151d]">Plan your visit</p>
              <h2 className="mt-3 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">Find us in Matina.</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-[#6b625d] sm:text-base md:justify-self-end md:text-right">Open every day for early rallies, after-work games, and late-night court time.</p>
          </div>

          <div className="grid border-t border-[#241f1d]/15 md:grid-cols-2">
            <article className="grid min-h-56 grid-cols-[auto_1fr] gap-5 border-b border-[#241f1d]/15 py-8 sm:gap-7 sm:px-6 md:border-r">
              <span className="grid h-12 w-12 place-items-center rounded-full border border-[#72151d]/20 text-[#72151d]"><MapPinIcon className="h-6 w-6" /></span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#72151d]">Address</p>
                <h3 className="mt-4 max-w-md text-2xl font-bold leading-tight">University Avenue, Juna Subdivision, Matina, Davao City</h3>
              </div>
            </article>
            <article className="grid min-h-56 grid-cols-[auto_1fr] gap-5 border-b border-[#241f1d]/15 py-8 sm:gap-7 sm:px-6">
              <span className="grid h-12 w-12 place-items-center rounded-full border border-[#72151d]/20 text-[#72151d]"><ClockIcon className="h-6 w-6" /></span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#72151d]">Operating hours</p>
                <h3 className="mt-4 text-2xl font-bold">Monday to Sunday</h3>
                <p className="mt-2 text-lg font-semibold text-[#5e5651]">7:00 AM–12:00 MN</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-[#72151d] py-16 text-white sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[1fr_.9fr] lg:items-center lg:px-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#d9f900]">Talk to a real person</p>
            <h2 className="mt-3 max-w-2xl text-4xl font-bold tracking-[-0.04em] sm:text-5xl">Need help choosing a time?</h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-white/70 sm:text-base">Send us a message for booking questions, training arrangements, group play, or anything else you need before coming over.</p>
          </div>
          <div className="border border-white/20 p-6 sm:p-8 lg:justify-self-end">
            <p className="text-sm font-semibold leading-6 text-white/80">The fastest way to reach us is through Facebook Messenger.</p>
            <Button asChild size="lg" className="mt-6 h-12 w-full rounded-none bg-[#d9f900] px-7 font-bold text-[#241f1d] hover:bg-[#e4ff3b] sm:w-auto">
              <a href={EXTERNAL_LINKS.FACEBOOK_MESSAGE} target="_blank" rel="noopener noreferrer">Start a conversation <ArrowUpRightIcon className="ml-2 h-4 w-4" /></a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
