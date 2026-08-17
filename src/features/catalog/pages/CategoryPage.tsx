import { Link, Navigate, useParams } from 'react-router-dom'
import { useCategory, useCategoryServices } from '@/features/catalog/hooks/useCategories'
import { PageHeader, QueryState } from '@/features/catalog/components/CatalogUi'
import { CleaningPriceLabel, CleaningRequestLink } from '@/shared/components/CleaningPriceLabel'
import { getCleaningCatalogHourlyRate } from '@/shared/hooks/useCleaningPricing'
import { formatCurrency } from '@/shared/lib/utils'
import { isCategoryLaunched, PRIMARY_CATEGORY_SLUG } from '@/shared/lib/catalogConfig'
import { CLEANING_SERVICE_CONTENT } from '@/shared/lib/cleaningContent'
import { trackEvent } from '@/shared/lib/analytics'

export function CategoryPage() {
  const { slug = '' } = useParams()
  const { data: category, isLoading: categoryLoading, error: categoryError } = useCategory(slug)
  const {
    data: services,
    isLoading: servicesLoading,
    error: servicesError,
  } = useCategoryServices(category?.id)

  if (!slug) {
    return <Navigate to={`/services/${PRIMARY_CATEGORY_SLUG}`} replace />
  }

  if (!isCategoryLaunched(slug)) {
    return <Navigate to={`/services/${PRIMARY_CATEGORY_SLUG}`} replace />
  }

  if (categoryLoading) {
    return <QueryState loading error={null}>{null}</QueryState>
  }

  if (categoryError || !category) {
    return (
      <QueryState
        loading={false}
        error={categoryError ?? new Error('Category not found')}
        empty={false}
      >
        {null}
      </QueryState>
    )
  }

  const content = CLEANING_SERVICE_CONTENT

  return (
    <div className="pb-12">
      <PageHeader
        backTo="/"
        backLabel="Home"
        title={`${category.icon ?? ''} ${category.name}`.trim()}
        description={content.overview}
      />

      <div className="mt-6 flex flex-wrap gap-3">
        <CleaningRequestLink
          onClick={() => trackEvent('request_cleaning_clicked', { source: 'category' })}
          className="inline-flex min-h-11 items-center rounded-lg bg-nexo-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-nexo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nexo-600"
        >
          Request a cleaning
        </CleaningRequestLink>
        <Link
          to={`/providers/category/${category.slug}`}
          className="inline-flex min-h-11 items-center rounded-lg border border-nexo-200 px-5 py-2.5 text-sm font-medium text-nexo-700 hover:bg-nexo-50"
        >
          Find a cleaner
        </Link>
      </div>

      <section className="mt-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Pricing</h2>
        <p className="mt-2 text-sm text-slate-600">
          <CleaningPriceLabel showDetail className="font-medium text-nexo-800" />
        </p>
        <p className="mt-3 text-sm text-slate-600">{content.pricingNote}</p>
        <p className="mt-2 text-sm font-medium text-slate-700">{content.minDuration}</p>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">What&apos;s included</h2>
          <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-slate-600">
            {content.included.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">What&apos;s not included</h2>
          <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-slate-600">
            {content.notIncluded.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Property types supported</h2>
        <p className="mt-2 text-sm text-slate-600">{content.propertyTypes.join(' · ')}</p>
        <h3 className="mt-6 text-base font-semibold text-slate-900">Cleaning supplies</h3>
        <p className="mt-2 text-sm text-slate-600">{content.supplies}</p>
      </section>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Booking & confirmation</h2>
        <p className="mt-2 text-sm text-slate-600">{content.bookingProcess}</p>
        <h3 className="mt-6 text-base font-semibold text-slate-900">Service areas</h3>
        <p className="mt-2 text-sm text-slate-600">{content.serviceAreas}</p>
        <h3 className="mt-6 text-base font-semibold text-slate-900">Cancellation</h3>
        <p className="mt-2 text-sm text-slate-600">{content.cancellation}</p>
      </section>

      <QueryState
        loading={servicesLoading}
        error={servicesError}
        empty={!services?.length}
        emptyMessage="No cleaning services listed yet."
      >
        {services && services.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-semibold text-slate-900">Available services</h2>
            <div className="mt-3 space-y-3">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4"
                >
                  <div>
                    <h3 className="font-medium text-slate-900">{service.name}</h3>
                    {service.description && (
                      <p className="mt-0.5 text-sm text-slate-600">{service.description}</p>
                    )}
                  </div>
                  <p className="text-sm font-medium text-nexo-700">
                    from {formatCurrency(getCleaningCatalogHourlyRate(service.basePrice))}/hr
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </QueryState>

      <section className="mt-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Frequently asked questions</h2>
        <dl className="mt-4 space-y-4">
          {content.faqs.map(({ q, a }) => (
            <div key={q}>
              <dt className="font-medium text-slate-900">{q}</dt>
              <dd className="mt-1 text-sm text-slate-600">{a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-10 rounded-xl bg-nexo-50 px-5 py-6 text-center">
        <p className="text-sm text-nexo-900">Ready to book?</p>
        <CleaningRequestLink className="mt-3 inline-flex min-h-11 items-center rounded-lg bg-nexo-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-nexo-800">
          Request a cleaning →
        </CleaningRequestLink>
      </div>
    </div>
  )
}
