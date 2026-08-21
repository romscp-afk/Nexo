import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { BOOKING_CONFIRMATION } from '@/shared/lib/cleaningContent'
import { PRIMARY_CATEGORY_SLUG } from '@/shared/lib/catalogConfig'
import { CleaningRequestLink } from '@/shared/components/CleaningPriceLabel'
import { PAGE_META, usePageMeta } from '@/shared/lib/pageMeta'

const steps = [
  {
    step: '01',
    title: 'Tell us what you need',
    description: 'Choose cleaning type, property details, schedule and location — no account required to start.',
  },
  {
    step: '02',
    title: 'Review and sign in',
    description: 'See a price estimate, review your request, then sign in or register to submit.',
  },
  {
    step: '03',
    title: 'Service provider accepts',
    description: BOOKING_CONFIRMATION,
  },
]

export function HowNexoWorksPage() {
  usePageMeta(PAGE_META.howItWorks)
  return (
    <div>
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900">How Nexo works</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Nexo connects you with home-cleaning service providers in Singapore.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        {steps.map(({ step, title, description }) => (
          <div
            key={step}
            className="rounded-2xl border border-nexo-200 bg-white p-8"
          >
            <span
              aria-hidden
              className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-nexo-700 text-base font-bold tracking-wide text-white shadow-sm"
            >
              {step}
            </span>
            <h2 className="mt-4 text-xl font-bold text-nexo-900">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-nexo-800/70">{description}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap gap-4">
        <CleaningRequestLink className="inline-flex items-center gap-2 rounded-lg bg-nexo-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-nexo-800">
          Request a cleaning
          <ArrowRight className="h-4 w-4" />
        </CleaningRequestLink>
        <Link
          to={`/providers/category/${PRIMARY_CATEGORY_SLUG}`}
          className="inline-flex items-center gap-2 rounded-lg border border-nexo-200 px-5 py-2.5 text-sm font-medium text-nexo-700 hover:bg-nexo-50"
        >
          Find a service provider
        </Link>
      </div>
    </div>
  )
}
