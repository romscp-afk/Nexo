import {
  CLEANING_DURATION_HOURLY_RATES,
  CLEANING_EXTRA_HOUR_RATE_SGD,
  MIN_BOOKING_HOURS,
} from '@/shared/lib/cleaningContent'
import { Link } from 'react-router-dom'
import { formatCurrency } from '@/shared/lib/utils'
import { SectionHeading } from '@/shared/components/ui/SectionHeading'
import { CleaningRequestLink } from '@/shared/components/CleaningPriceLabel'

const tiers = [
  { hours: 2, rate: CLEANING_DURATION_HOURLY_RATES[2] },
  { hours: 3, rate: CLEANING_DURATION_HOURLY_RATES[3] },
  { hours: 4, rate: CLEANING_DURATION_HOURLY_RATES[4] },
]

export function HomePricing() {
  return (
    <section id="pricing" className="bg-brand-surface py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Pricing"
          title="Clear, transparent rates"
          description="Hourly pricing based on booking duration. Final amount depends on your selected duration and supplies."
          align="center"
          className="mx-auto text-center"
        />

        <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-3">
          {tiers.map(({ hours, rate }) => (
            <div
              key={hours}
              className="rounded-card-lg border border-brand-border bg-brand-bg p-6 text-center transition hover:border-brand-primary/30 hover:shadow-card"
            >
              <p className="text-sm font-medium text-brand-text-secondary">{hours} hours</p>
              <p className="mt-2 text-3xl font-bold text-brand-primary">{formatCurrency(rate)}</p>
              <p className="text-sm text-brand-text-muted">per hour</p>
              <p className="mt-3 text-xs text-brand-text-secondary">
                from {formatCurrency(rate * hours)} total
              </p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-8 max-w-2xl rounded-card border border-brand-border bg-brand-light/50 p-6">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-brand-text-secondary">Additional hours</dt>
              <dd className="font-medium text-brand-text">{formatCurrency(CLEANING_EXTRA_HOUR_RATE_SGD)}/hour</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-brand-text-secondary">Service provider–provided supplies</dt>
              <dd className="font-medium text-brand-text">
                <Link to="/support?subject=Other" className="text-brand-primary hover:underline">
                  Contact us
                </Link>
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-brand-border pt-3">
              <dt className="text-brand-text-secondary">Minimum booking</dt>
              <dd className="font-medium text-brand-text">{MIN_BOOKING_HOURS} hours</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-brand-text-muted">
            Pay via PayNow or cash on completion. You only pay the service amount — no platform fee.
          </p>
        </div>

        <div className="mt-10 text-center">
          <CleaningRequestLink className="inline-flex min-h-11 items-center rounded-full bg-cta-gradient px-8 py-3 text-sm font-semibold text-white shadow-brand transition hover:opacity-95">
            Get your estimate
          </CleaningRequestLink>
        </div>
      </div>
    </section>
  )
}
