import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { BOOKING_CONFIRMATION } from '@/shared/lib/cleaningContent'
import { CleaningPriceInline, CleaningRequestLink } from '@/shared/components/CleaningPriceLabel'
import { trackEvent } from '@/shared/lib/analytics'

export function HomeHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-nexo-ink via-nexo-deep to-indigo-950 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-nexo-glow/15 blur-3xl animate-pulse-glow"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-nexo-accent/10 blur-3xl animate-pulse-glow"
        style={{ animationDelay: '1.5s' }}
      />

      <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
          <div className="relative z-10">
            <p className="hero-enter inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-nexo-champagne backdrop-blur-sm">
              Home cleaning services in Singapore
            </p>

            <h1 className="hero-enter mt-6 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Reliable home cleaning, booked around your schedule.
            </h1>

            <p className="hero-enter mt-5 max-w-lg text-lg leading-relaxed text-nexo-mint/80">
              Request trusted home-cleaning services with clear pricing and a simple booking
              experience.
            </p>

            <div className="hero-enter mt-8 flex flex-wrap gap-3">
              <CleaningRequestLink
                onClick={() => trackEvent('request_cleaning_clicked', { source: 'hero' })}
                className="group inline-flex min-h-11 items-center gap-2 rounded-full bg-nexo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-nexo-600/25 transition hover:bg-nexo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Request a cleaning
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </CleaningRequestLink>
              <Link
                to="/how-it-works"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                How Nexo works
              </Link>
            </div>

            <p className="mt-8 max-w-lg text-sm text-nexo-mint/70">{BOOKING_CONFIRMATION}</p>
          </div>

          <div className="relative mx-auto h-[300px] w-full max-w-md sm:h-[360px] lg:mx-0 lg:max-w-none">
            <div className="animate-float absolute left-1/2 top-1/2 z-20 w-56 -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/20 bg-white p-6 shadow-2xl shadow-black/25 sm:w-64 sm:p-7">
              <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-2xl bg-nexo-50 sm:h-32 sm:w-32">
                <span className="text-6xl" aria-hidden>
                  🧹
                </span>
              </div>
              <p className="mt-4 text-center text-lg font-bold text-nexo-950">Standard Home Cleaning</p>
              <p className="mt-1 text-center text-xs text-nexo-800/70">Singapore · Phase 1</p>
              <div className="mt-4 text-center text-xs font-medium text-nexo-600">
                <CleaningPriceInline />
              </div>
            </div>

            <div
              aria-hidden
              className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-nexo-400/30 sm:h-72 sm:w-72"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
