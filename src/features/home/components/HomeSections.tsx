import { Link } from 'react-router-dom'
import { ArrowRight, CalendarCheck, Users, Wallet } from 'lucide-react'
import { PRIMARY_CATEGORY_SLUG } from '@/shared/lib/catalogConfig'
import { BOOKING_CONFIRMATION } from '@/shared/lib/cleaningContent'
import { useCleaningPricing } from '@/shared/hooks/useCleaningPricing'
import { CleaningRequestLink } from '@/shared/components/CleaningPriceLabel'

export function HomeTrustBar() {
  const pricing = useCleaningPricing()
  const count = pricing.cleanerCount

  const stats = [
    {
      value: pricing.loading ? '…' : String(count),
      label:
        count === 1 ? 'Cleaner onboarded' : count > 0 ? 'Cleaners onboarded' : 'Cleaners onboarding',
      icon: Users,
    },
    {
      value: 'PayNow',
      label: 'Flexible payment',
      icon: Wallet,
    },
    {
      value: 'Request',
      label: 'Subject to acceptance',
      icon: CalendarCheck,
    },
  ]

  return (
    <section className="border-y border-nexo-200 bg-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-px bg-nexo-200 sm:grid-cols-3">
        {stats.map(({ value, label, icon: Icon }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-2 bg-white px-4 py-8 text-center sm:py-10"
          >
            {Icon && (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-nexo-100">
                <Icon className="h-5 w-5 text-nexo-600" strokeWidth={1.75} />
              </div>
            )}
            <p className="text-2xl font-bold tracking-tight text-nexo-900">{value}</p>
            <p className="text-xs font-medium uppercase tracking-wider text-nexo-700/60">{label}</p>
            {!pricing.loading && count > 0 && (
              <Link
                to={`/providers/category/${PRIMARY_CATEGORY_SLUG}`}
                className="text-xs font-medium text-nexo-600 hover:text-nexo-800 hover:underline"
              >
                View cleaners
              </Link>
            )}
          </div>
        ))}
      </div>
      <p className="mx-auto max-w-3xl px-4 py-4 text-center text-xs text-slate-500">
        {BOOKING_CONFIRMATION}
      </p>
    </section>
  )
}

const steps = [
  {
    step: '01',
    title: 'Request a cleaning',
    description: 'Share your property, schedule and location. No account needed to start.',
  },
  {
    step: '02',
    title: 'Review your estimate',
    description: 'See hourly pricing and minimum duration before you sign in to submit.',
  },
  {
    step: '03',
    title: 'Cleaner confirms',
    description: BOOKING_CONFIRMATION,
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
            Home cleaning in three steps
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map(({ step, title, description }) => (
            <div
              key={step}
              className="group relative overflow-hidden rounded-2xl border border-nexo-200 bg-nexo-50 p-8 transition hover:-translate-y-1 hover:border-nexo-400 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              <span className="text-4xl font-black text-nexo-200">{step}</span>
              <h3 className="mt-4 text-xl font-bold text-nexo-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-nexo-800/70">{description}</p>
              <div className="absolute bottom-0 left-0 h-1 w-0 bg-nexo-400 transition-all group-hover:w-full motion-reduce:transition-none" />
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
          <div className="relative">
            <h2 className="text-3xl font-bold sm:text-4xl">Ready for a cleaner home?</h2>
            <p className="mx-auto mt-4 max-w-lg text-nexo-mint/80">
              Request home cleaning across Singapore with clear pricing and a simple flow.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <CleaningRequestLink className="inline-flex min-h-11 items-center gap-2 rounded-full bg-nexo-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-nexo-600/25 transition hover:bg-nexo-800">
                Request a cleaning
                <ArrowRight className="h-4 w-4" />
              </CleaningRequestLink>
              <Link
                to={`/providers/category/${PRIMARY_CATEGORY_SLUG}`}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/30 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Find a cleaner
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
