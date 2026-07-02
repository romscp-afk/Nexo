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
    <section className="border-b border-slate-200/80 bg-white">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-slate-200/80 sm:grid-cols-4">
        {stats.map(({ value, label, icon: Icon }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-2 bg-white px-4 py-8 text-center sm:py-10"
          >
            <Icon className="h-5 w-5 text-nexo-600" strokeWidth={1.75} />
            <p className="text-2xl font-bold tracking-tight text-slate-900">{value}</p>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
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
    accent: 'from-emerald-400 to-teal-500',
  },
  {
    step: '02',
    title: 'Compare',
    description: 'Check ratings, coverage areas, and pricing. Pick the provider that fits your schedule.',
    accent: 'from-teal-400 to-cyan-500',
  },
  {
    step: '03',
    title: 'Book & relax',
    description: 'Request a booking, pay via PayNow or cash, and track everything in your dashboard.',
    accent: 'from-lime-400 to-emerald-500',
  },
]

export function HomeHowItWorks() {
  return (
    <section className="bg-slate-50 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-nexo-600">
            Simple process
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Three steps to a happier home
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map(({ step, title, description, accent }) => (
            <div
              key={step}
              className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div
                className={`absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br ${accent} opacity-10 transition group-hover:opacity-20`}
              />
              <span className="text-4xl font-black text-slate-100">{step}</span>
              <h3 className="mt-4 text-xl font-bold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function HomeCta() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-nexo-600 px-8 py-16 text-center text-white sm:px-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              backgroundImage: 'radial-gradient(circle at 20% 80%, #6ee7b7 0%, transparent 50%), radial-gradient(circle at 80% 20%, #5eead4 0%, transparent 50%)',
            }}
          />
          <div className="relative">
            <h2 className="text-3xl font-bold sm:text-4xl">Ready to simplify your home life?</h2>
            <p className="mx-auto mt-4 max-w-lg text-emerald-100">
              Join thousands of Singapore homeowners who trust Nexo for reliable, verified home
              services.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-nexo-800 shadow-lg transition hover:bg-emerald-50"
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
