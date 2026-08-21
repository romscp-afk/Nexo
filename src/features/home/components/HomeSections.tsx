import { ShieldCheck, BadgeDollarSign, Lock, HeadphonesIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { CleaningRequestLink } from '@/shared/components/CleaningPriceLabel'
import { PRIMARY_CATEGORY_SLUG } from '@/shared/lib/catalogConfig'

const items = [
  {
    icon: ShieldCheck,
    title: 'Provider profiles reviewed',
    description: 'Provider information is reviewed before account activation.',
  },
  {
    icon: BadgeDollarSign,
    title: 'Clear pricing',
    description: 'Review your estimated service cost before submitting.',
  },
  {
    icon: Lock,
    title: 'Trackable bookings',
    description: 'View booking details, status and communication in one place.',
  },
  {
    icon: HeadphonesIcon,
    title: 'Customer support',
    description: 'Contact Nexo if you need assistance with a booking.',
  },
]

export function HomeTrustBar() {
  return (
    <section className="border-y border-brand-border bg-brand-surface">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-px bg-brand-border sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="flex flex-col items-center gap-4 bg-brand-surface px-5 py-10 text-center sm:px-6 sm:py-12"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-light sm:h-[4.5rem] sm:w-[4.5rem]">
              <Icon className="h-7 w-7 text-brand-primary sm:h-8 sm:w-8" strokeWidth={1.75} />
            </div>
            <div className="max-w-[16rem]">
              <p className="text-base font-semibold text-brand-text sm:text-lg">{title}</p>
              <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary sm:text-[0.9375rem]">
                {description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

const steps = [
  {
    step: '01',
    title: 'Tell us what you need',
    description: 'Choose your cleaning type, property details, schedule and location.',
  },
  {
    step: '02',
    title: 'Review pricing and submit',
    description: 'Review the estimated cost and sign in only when you are ready to submit.',
  },
  {
    step: '03',
    title: 'Get connected',
    description: 'An available cleaning professional accepts your request and completes the service.',
  },
]

export function HomeHowItWorks() {
  return (
    <section className="bg-brand-surface py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-primary">
            How Nexo works
          </p>
          <h2 className="mt-2 text-section font-bold tracking-tight text-brand-text">
            Three simple steps
          </h2>
        </div>

        <div className="relative mt-14 grid gap-6 md:grid-cols-3">
          <div
            aria-hidden
            className="absolute left-[16.67%] right-[16.67%] top-12 hidden h-px bg-brand-border md:block"
          />
          {steps.map(({ step, title, description }) => (
            <div
              key={step}
              className="relative rounded-card-lg border border-brand-border bg-brand-bg p-8 transition duration-200 hover:-translate-y-0.5 hover:shadow-card-hover motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              <span className="text-4xl font-black text-brand-pale">{step}</span>
              <h3 className="mt-4 text-xl font-bold text-brand-text">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function HomeCta() {
  return (
    <section className="bg-brand-bg py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-card-lg bg-hero-gradient px-8 py-16 text-center text-white shadow-brand sm:px-16">
          <h2 className="text-section font-bold">Ready for a cleaner home?</h2>
          <p className="mx-auto mt-4 max-w-lg text-brand-pale/90">
            Request reliable home cleaning across Singapore with clear pricing and a simple booking process.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <CleaningRequestLink className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-brand-navy shadow-brand transition hover:bg-brand-light">
              Request a Cleaning
              <ArrowRight className="h-4 w-4" />
            </CleaningRequestLink>
            <Link
              to={`/providers/category/${PRIMARY_CATEGORY_SLUG}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/30 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Browse Cleaners
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
