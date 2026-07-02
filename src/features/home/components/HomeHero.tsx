import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Bot,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react'
import { useAuth } from '@/features/auth/context/AuthProvider'
import { APP_NAME, APP_TAGLINE, getDashboardPath } from '@/shared/lib/constants'
import logoUrl from '@/assets/logo.png'

const floatingServices = [
  { icon: '🧹', label: 'Cleaning', top: '18%', left: '8%', delay: '0s' },
  { icon: '🔧', label: 'Handyman', top: '12%', right: '12%', delay: '0.5s' },
  { icon: '❄️', label: 'Aircon', bottom: '28%', left: '6%', delay: '1s' },
  { icon: '🚿', label: 'Plumbing', bottom: '22%', right: '8%', delay: '1.5s' },
  { icon: '📦', label: 'Movers', top: '42%', right: '4%', delay: '0.8s' },
]

export function HomeHero() {
  const { user } = useAuth()

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-nexo-deep via-nexo-800 to-nexo-600 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-nexo-glow/25 blur-3xl animate-pulse-glow"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-nexo-accent/15 blur-3xl animate-pulse-glow"
        style={{ animationDelay: '1.5s' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/4 h-64 w-64 -translate-x-1/2 rounded-full bg-nexo-mint/10 blur-3xl"
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
          <div className="relative z-10">
            <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-nexo-400/40 bg-nexo-400/15 px-4 py-1.5 text-sm text-nexo-mint">
              <Sparkles className="h-4 w-4 text-nexo-400" />
              Singapore&apos;s trusted home services hub
            </div>

            <h1 className="animate-fade-up-delay-1 mt-6 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Your home,
              <span className="mt-1 block bg-gradient-to-r from-nexo-400 via-nexo-accent to-nexo-mint bg-clip-text text-transparent">
                handled with care.
              </span>
            </h1>

            <p className="animate-fade-up-delay-2 mt-5 max-w-lg text-lg leading-relaxed text-nexo-100/90">
              {APP_TAGLINE}. Book verified cleaners, handymen, movers and more — all in one
              marketplace built for Singapore.
            </p>

            <div className="animate-fade-up-delay-3 mt-8 flex flex-wrap gap-3">
              <Link
                to="/services"
                className="group inline-flex items-center gap-2 rounded-full bg-nexo-400 px-6 py-3 text-sm font-semibold text-nexo-950 shadow-lg shadow-black/20 transition hover:bg-nexo-accent"
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

            <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-nexo-100/80">
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
          </div>

          <div className="relative mx-auto h-[340px] w-full max-w-md sm:h-[400px] lg:mx-0 lg:max-w-none">
            <div className="animate-float absolute left-1/2 top-1/2 z-20 w-56 -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-xl sm:w-64">
              <img src={logoUrl} alt="" className="mx-auto h-20 w-20 object-contain" />
              <p className="mt-3 text-center text-lg font-bold text-white">{APP_NAME}</p>
              <p className="mt-1 text-center text-xs text-nexo-mint/90">{APP_TAGLINE}</p>
              <div className="mt-4 flex justify-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="mt-2 text-center text-xs text-nexo-400">4.9 · 2,400+ bookings</p>
            </div>

            {floatingServices.map((item) => (
              <div
                key={item.label}
                className="animate-float-delayed absolute z-10 flex items-center gap-2 rounded-2xl border border-nexo-400/25 bg-nexo-800/70 px-3 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-md"
                style={{
                  top: item.top,
                  left: item.left,
                  right: item.right,
                  bottom: item.bottom,
                  animationDelay: item.delay,
                }}
              >
                <span className="text-lg" aria-hidden>
                  {item.icon}
                </span>
                {item.label}
              </div>
            ))}

            <div
              aria-hidden
              className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-nexo-400/30 sm:h-80 sm:w-80"
            />
          </div>
        </div>
      </div>

      <div className="relative border-t border-white/10 bg-nexo-900/40 py-3">
        <div className="flex overflow-hidden">
          <div className="animate-marquee flex shrink-0 items-center gap-8 whitespace-nowrap px-4 text-sm text-nexo-mint/70">
            {[...Array(2)].map((_, copy) => (
              <span key={copy} className="flex items-center gap-8">
                {[
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
                ].map((area) => (
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

export function HomeAssistantPromo() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl border border-nexo-200 bg-gradient-to-br from-nexo-100 to-white px-8 py-10 sm:px-12 sm:py-14">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-nexo-400/25 blur-2xl"
        />
        <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-nexo-600 shadow-md">
              <Bot className="h-7 w-7 text-nexo-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-nexo-900">Meet your AI concierge</h2>
              <p className="mt-2 max-w-md text-nexo-800/80">
                Tap <strong className="text-nexo-700">Ask Nexo</strong> anytime — get instant help with
                bookings, PayNow payments, provider jobs, and more.
              </p>
            </div>
          </div>
          <p className="rounded-full border border-nexo-300 bg-nexo-50 px-4 py-2 text-sm font-medium text-nexo-700">
            Available on every page ↘
          </p>
        </div>
      </div>
    </section>
  )
}
