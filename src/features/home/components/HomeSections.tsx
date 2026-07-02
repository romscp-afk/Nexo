import { Link } from 'react-router-dom'
import { ArrowRight, Users, CalendarCheck, BadgeCheck, Headphones } from 'lucide-react'

const stats = [
  { value: '50+', label: 'Verified providers', icon: Users },
  { value: '12', label: 'Service areas', icon: BadgeCheck },
  { value: '24h', label: 'Fast booking', icon: CalendarCheck },
  { value: 'AI', label: 'Instant support', icon: Headphones },
]

export function HomeTrustBar() {
  return (
    <section className="border-y border-nexo-200 bg-white">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-nexo-200 sm:grid-cols-4">
        {stats.map(({ value, label, icon: Icon }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-2 bg-white px-4 py-8 text-center sm:py-10"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-nexo-100">
              <Icon className="h-5 w-5 text-nexo-600" strokeWidth={1.75} />
            </div>
            <p className="text-2xl font-bold tracking-tight text-nexo-900">{value}</p>
            <p className="text-xs font-medium uppercase tracking-wider text-nexo-700/60">{label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

const steps = [
  {
    step: '01',
    title: 'Discover',
    description: 'Browse categories from deep cleaning to aircon servicing — all tailored for SG homes.',
  },
  {
    step: '02',
    title: 'Compare',
    description: 'Check ratings, coverage areas, and pricing. Pick the provider that fits your schedule.',
  },
  {
    step: '03',
    title: 'Book & relax',
    description: 'Request a booking, pay via PayNow or cash, and track everything in your dashboard.',
  },
]

export function HomeHowItWorks() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-nexo-600">
            Simple process
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-nexo-900 sm:text-4xl">
            Three steps to a happier home
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map(({ step, title, description }) => (
            <div
              key={step}
              className="group relative overflow-hidden rounded-2xl border border-nexo-200 bg-nexo-50 p-8 transition hover:-translate-y-1 hover:border-nexo-400 hover:shadow-md"
            >
              <span className="text-4xl font-black text-nexo-200">{step}</span>
              <h3 className="mt-4 text-xl font-bold text-nexo-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-nexo-800/70">{description}</p>
              <div className="absolute bottom-0 left-0 h-1 w-0 bg-nexo-400 transition-all group-hover:w-full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function HomeCta() {
  return (
    <section className="bg-nexo-50 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-nexo-ink via-nexo-deep to-nexo-800 px-8 py-16 text-center text-white shadow-xl sm:px-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 80%, #73dec5 0%, transparent 40%), radial-gradient(circle at 80% 20%, #ddd4c0 0%, transparent 35%)',
            }}
          />
          <div className="relative">
            <h2 className="text-3xl font-bold sm:text-4xl">Ready to simplify your home life?</h2>
            <p className="mx-auto mt-4 max-w-lg text-nexo-mint/80">
              Join thousands of Singapore homeowners who trust Nexo for reliable, verified home
              services.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-nexo-900 shadow-lg transition hover:bg-nexo-soft"
              >
                Create free account
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/providers"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Browse providers
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
