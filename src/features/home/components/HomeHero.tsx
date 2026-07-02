import { Link } from 'react-router-dom'
import {
  ArrowRight,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react'
import { useAuth } from '@/features/auth/context/AuthProvider'
import { APP_NAME, APP_TAGLINE, getDashboardPath } from '@/shared/lib/constants'
import logoUrl from '@/assets/logo.png'

const servicePills = [
  { icon: '🧹', label: 'Cleaning' },
  { icon: '🔧', label: 'Handyman' },
  { icon: '❄️', label: 'Aircon' },
  { icon: '🚿', label: 'Plumbing' },
  { icon: '📦', label: 'Movers' },
]

const coverageAreas = [
  'Tampines',
  'Jurong East',
  'Woodlands',
  'Bedok',
  'CBD',
  'Bishan',
  'Ang Mo Kio',
  'Clementi',
  'Toa Payoh',
  'Yishun',
]

export function HomeHero() {
  const { user } = useAuth()

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-nexo-ink via-nexo-deep to-indigo-950 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-nexo-500/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-nexo-600/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-1/3 h-64 w-64 rounded-full bg-nexo-accent/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-4xl px-4 pb-16 pt-8 text-center sm:px-6 sm:pb-20 sm:pt-12 lg:px-8">
        {/* Logo showcase — focal point */}
        <div className="animate-fade-up mx-auto flex max-w-sm flex-col items-center">
          <div className="relative">
            <div
              aria-hidden
              className="absolute -inset-3 rounded-[2.25rem] bg-gradient-to-br from-nexo-400/50 via-nexo-500/30 to-nexo-600/40 blur-md"
            />
            <div className="relative rounded-[2rem] border border-white/25 bg-white p-6 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.45)] sm:p-8">
              <img
                src={logoUrl}
                alt={`${APP_NAME} logo`}
                className="mx-auto h-28 w-28 object-contain sm:h-36 sm:w-36"
              />
            </div>
          </div>

          <p className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">{APP_NAME}</p>
          <p className="mt-1 text-sm text-nexo-mint/90 sm:text-base">{APP_TAGLINE}</p>

          <div className="mt-3 flex items-center justify-center gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
            ))}
            <span className="ml-1 text-sm font-medium text-nexo-mint/90">4.9 · 2,400+ bookings</span>
          </div>
        </div>

        <div className="animate-fade-up-delay-1 mx-auto mt-10 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-nexo-champagne backdrop-blur-sm">
          <Sparkles className="h-4 w-4 text-nexo-400" />
          Singapore&apos;s trusted home services hub
        </div>

        <h1 className="animate-fade-up-delay-1 mx-auto mt-6 max-w-2xl text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
          Your home,
          <span className="mt-1 block bg-gradient-to-r from-nexo-400 via-nexo-accent to-white bg-clip-text text-transparent">
            handled with care.
          </span>
        </h1>

        <p className="animate-fade-up-delay-2 mx-auto mt-5 max-w-xl text-lg leading-relaxed text-nexo-mint/80">
          Book verified cleaners, handymen, movers and more — all in one marketplace built for
          Singapore.
        </p>

        <div className="animate-fade-up-delay-3 mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/services"
            className="group inline-flex items-center gap-2 rounded-full bg-nexo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-nexo-600/30 transition hover:bg-nexo-800"
          >
            Explore services
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
          {user ? (
            <Link
              to={getDashboardPath(user.role)}
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              Go to dashboard
            </Link>
          ) : (
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              Join {APP_NAME} free
            </Link>
          )}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-nexo-mint/75">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-nexo-400" />
            Verified providers
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            Rated & reviewed
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-nexo-400" />
            Island-wide coverage
          </span>
        </div>

        <div className="animate-fade-up-delay-3 mt-12 flex flex-wrap justify-center gap-2">
          {servicePills.map((item) => (
            <span
              key={item.label}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm"
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </span>
          ))}
        </div>
      </div>

      <div className="relative border-t border-white/10 bg-nexo-ink/50 py-3">
        <div className="flex overflow-hidden">
          <div className="animate-marquee flex shrink-0 items-center gap-8 whitespace-nowrap px-4 text-sm text-nexo-mint/70">
            {[...Array(2)].map((_, copy) => (
              <span key={copy} className="flex items-center gap-8">
                {coverageAreas.map((area) => (
                  <span key={`${copy}-${area}`} className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" />
                    {area}
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
