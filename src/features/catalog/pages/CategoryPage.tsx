import { Link, Navigate, useParams } from 'react-router-dom'
import { useCategory, useCategoryServices } from '@/features/catalog/hooks/useCategories'
import { QueryState } from '@/features/catalog/components/CatalogUi'
import { CleaningPriceLabel, CleaningRequestLink } from '@/shared/components/CleaningPriceLabel'
import { CleaningServicePlansSection } from '@/shared/components/CleaningServicePlansSection'
import { getCleaningCatalogHourlyRate } from '@/shared/hooks/useCleaningPricing'
import { formatCurrency } from '@/shared/lib/utils'
import { isCategoryLaunched, PRIMARY_CATEGORY_SLUG } from '@/shared/lib/catalogConfig'
import { CLEANING_SERVICE_CONTENT } from '@/shared/lib/cleaningContent'
import { trackEvent } from '@/shared/lib/analytics'
import { PAGE_META, usePageMeta } from '@/shared/lib/pageMeta'
import { useEffect, useRef } from 'react'

function CategoryStaticContent({
  categoryName,
  categorySlug,
  categoryIcon,
}: {
  categoryName: string
  categorySlug: string
  categoryIcon?: string | null
}) {
  const content = CLEANING_SERVICE_CONTENT
  return (
    <>
      <header className="mb-2">
        <Link to="/" className="text-sm font-medium text-nexo-700 hover:underline">
          ← Home
        </Link>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">
          {`${categoryIcon ?? ''} ${categoryName}`.trim()}
        </h1>
        <p className="mt-2 max-w-2xl text-slate-600">{content.overview}</p>
      </header>

      <div className="mt-6 flex flex-wrap gap-3">
        <CleaningRequestLink
          onClick={() => trackEvent('request_cleaning_clicked', { source: 'category' })}
          className="inline-flex min-h-11 items-center rounded-lg bg-nexo-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-nexo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nexo-600"
        >
          Request a cleaning
        </CleaningRequestLink>
        <Link
          to={`/providers/category/${categorySlug}`}
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

      <CleaningServicePlansSection className="mt-8" />

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
    </>
  )
}

export function CategoryPage() {
  usePageMeta(PAGE_META.cleaningService)
  const { slug = '' } = useParams()
  const loadStarted = useRef(
    typeof performance !== 'undefined' ? performance.now() : 0,
  )
  const { data: category, isLoading: categoryLoading, error: categoryError } = useCategory(slug)
  const {
    data: services,
    isLoading: servicesLoading,
    error: servicesError,
  } = useCategoryServices(category?.id)

  useEffect(() => {
    if (categoryLoading || servicesLoading) return
    if (typeof performance === 'undefined') return
    const duration = Math.round(performance.now() - loadStarted.current)
    // Dev-facing performance signal for LCP/CLS investigation of this route.
    console.info('[perf] cleaning-category-load-ms', duration)
  }, [categoryLoading, servicesLoading])

  if (!slug) {
    return <Navigate to={`/services/${PRIMARY_CATEGORY_SLUG}`} replace />
  }

  if (!isCategoryLaunched(slug)) {
    return <Navigate to={`/services/${PRIMARY_CATEGORY_SLUG}`} replace />
  }

  const displayName = category?.name ?? 'Home Cleaning'
  const displaySlug = category?.slug ?? slug
  const displayIcon = category?.icon

  return (
    <div className="pb-12">
      <CategoryStaticContent
        categoryName={displayName}
        categorySlug={displaySlug}
        categoryIcon={displayIcon}
      />

      {categoryError && !category ? (
        <p className="mt-8 text-sm text-red-700" role="alert">
          Unable to load live service catalogue details. Static pricing and FAQs above remain
          available.
        </p>
      ) : null}

      <div className="mt-8 min-h-[4.5rem]">
        {(servicesLoading || (categoryLoading && !category)) && (
          <div className="space-y-3" aria-busy="true" aria-label="Loading services">
            <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
            <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
          </div>
        )}
        {!servicesLoading && !(categoryLoading && !category) && (
          <QueryState
            loading={false}
            error={servicesError}
            empty={!services?.length}
            emptyMessage="No cleaning services listed yet."
          >
            {services && services.length > 0 && (
              <section>
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
        )}
      </div>

      <section className="mt-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Frequently asked questions</h2>
        <dl className="mt-4 space-y-4">
          {CLEANING_SERVICE_CONTENT.faqs.map((faq) => (
            <div key={faq.q}>
              <dt className="font-medium text-slate-900">{faq.q}</dt>
              <dd className="mt-1 text-sm text-slate-600">{faq.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}
