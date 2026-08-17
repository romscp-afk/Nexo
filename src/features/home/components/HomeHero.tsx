import { Link } from 'react-router-dom'
import {
  ArrowRight,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react'
import { APP_NAME, APP_TAGLINE } from '@/shared/lib/constants'
import { PRIMARY_CATEGORY_SLUG, PHASE1_TAGLINE } from '@/shared/lib/catalogConfig'

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
            <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-nexo-champagne backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-nexo-400" />
              Singapore home cleaning — book in minutes
            </div>

            <h1 className="animate-fade-up-delay-1 mt-6 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              A cleaner home,
              <span className="mt-1 block bg-gradient-to-r from-nexo-400 via-nexo-accent to-white bg-clip-text text-transparent">
                without the hassle.
              </span>
            </h1>

            <p className="animate-fade-up-delay-2 mt-5 max-w-lg text-lg leading-relaxed text-nexo-mint/80">
              {PHASE1_TAGLINE}. {APP_TAGLINE}. Verified cleaners, transparent pricing, PayNow or cash.
            </p>

            <div className="animate-fade-up-delay-3 mt-8 flex flex-wrap gap-3">
              <Link
                to={`/providers/category/${PRIMARY_CATEGORY_SLUG}`}
                className="group inline-flex items-center gap-2 rounded-full bg-nexo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-nexo-600/25 transition hover:bg-nexo-800"
              >
                Book a cleaner
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
              <Link
                to={`/services/${PRIMARY_CATEGORY_SLUG}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                View cleaning services
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-nexo-mint/75">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-nexo-400" />
                Verified cleaners
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                Rated & reviewed
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-nexo-400" />
                Island-wide
              </span>
            </div>
          </div>

          <div className="relative mx-auto h-[300px] w-full max-w-md sm:h-[360px] lg:mx-0 lg:max-w-none">
            <div className="animate-float absolute left-1/2 top-1/2 z-20 w-56 -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/20 bg-white p-6 shadow-2xl shadow-black/25 sm:w-64 sm:p-7">
              <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-2xl bg-nexo-50 sm:h-32 sm:w-32">
                <span className="text-6xl" aria-hidden>
                  🧹
                </span>
              </div>
              <p className="mt-4 text-center text-lg font-bold text-nexo-950">Home Cleaning</p>
              <p className="mt-1 text-center text-xs text-nexo-800/70">{APP_NAME} · {APP_TAGLINE}</p>
              <div className="mt-4 flex justify-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="mt-2 text-center text-xs font-medium text-nexo-600">From $25/hr · PayNow accepted</p>
            </div>

            <div
              aria-hidden
              className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-nexo-400/30 sm:h-72 sm:w-72"
            />
          </div>
        </div>
      </div>

      <div className="relative border-t border-white/10 bg-nexo-ink/50 py-3">
        <div className="flex overflow-hidden">
          <div className="animate-marquee flex shrink-0 items-center gap-8 whitespace-nowrap px-4 text-sm text-nexo-mint/70">
            {[...Array(2)].map((_, copy) => (
              <span key={copy} className="flex items-center gap-8">
                {[
                  'Deep cleaning',
                  'Move-out cleaning',
                  'Weekly cleaning',
                  'Tampines',
                  'Jurong',
                  'Woodlands',
                  'Bedok',
                  'PayNow',
                  'Verified pros',
                ].map((label) => (
                  <span key={`${copy}-${label}`} className="inline-flex items-center gap-1.5">
                    {label.startsWith('T') || label.startsWith('J') || label.startsWith('W') || label.startsWith('B') ? (
                      <MapPin className="h-3 w-3" />
                    ) : null}
                    {label}
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
