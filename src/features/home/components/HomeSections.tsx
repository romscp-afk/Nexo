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
    <section className="border-y border-nexo-100 bg-nexo-50/50">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-nexo-100 sm:grid-cols-4">
        {stats.map(({ value, label, icon: Icon }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-2 bg-white px-4 py-8 text-center sm:py-10"
          >
            <Icon className="h-5 w-5 text-nexo-500" strokeWidth={1.75} />
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
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Three steps to a happier home
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map(({ step, title, description }) => (
            <div
              key={step}
              className="group relative overflow-hidden rounded-2xl border border-nexo-100 bg-nexo-50/40 p-8 transition hover:-translate-y-1 hover:border-nexo-200 hover:bg-nexo-50 hover:shadow-sm"
            >
              <span className="text-4xl font-black text-nexo-200">{step}</span>
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
    <section className="bg-nexo-50/50 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-nexo-100 bg-white px-8 py-16 text-center shadow-sm sm:px-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 80%, #e4f4ea 0%, transparent 50%), radial-gradient(circle at 80% 20%, #f3faf5 0%, transparent 50%)',
            }}
          />
          <div className="relative">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              Ready to simplify your home life?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-slate-600">
              Join thousands of Singapore homeowners who trust Nexo for reliable, verified home
              services.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-full bg-nexo-600 px-8 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-nexo-700"
              >
                Create free account
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/providers"
                className="inline-flex items-center gap-2 rounded-full border border-nexo-200 bg-white px-8 py-3.5 text-sm font-semibold text-nexo-700 transition hover:bg-nexo-50"
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
