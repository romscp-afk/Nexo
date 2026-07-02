import { Link, useParams } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthProvider'
import { useProviderReviews } from '@/features/bookings/hooks/useReviews'
import { BadgeCheck, MapPin, Star } from 'lucide-react'
import { useProvider } from '@/features/providers/hooks/useProviders'
import { PageHeader, QueryState } from '@/features/catalog/components/CatalogUi'
import { PublicReviewList } from '@/features/reviews/components/PublicReviewList'
import { formatCurrency } from '@/shared/lib/utils'

export function ProviderDetailPage() {
  const { id = '' } = useParams()
  const { user } = useAuth()
  const { data: provider, isLoading, error } = useProvider(id)
  const {
    data: reviews,
    isLoading: reviewsLoading,
    error: reviewsError,
  } = useProviderReviews(id)
  const isCustomer = user?.role === 'customer'

  return (
    <div>
      <QueryState loading={isLoading} error={error} empty={!provider}>
        {provider && (
          <>
            <PageHeader backTo="/providers" backLabel="All providers" title={provider.businessName} />

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <section className="rounded-xl border border-slate-200 bg-white p-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1 text-amber-600">
                      <Star className="h-5 w-5 fill-current" />
                      <span className="text-lg font-semibold">{provider.ratingAvg.toFixed(1)}</span>
                      <span className="text-sm text-slate-500">({provider.ratingCount} reviews)</span>
                    </div>
                    {provider.isVerified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-nexo-50 px-2.5 py-1 text-xs font-medium text-nexo-700">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        Verified
                      </span>
                    )}
                    <span className="text-sm text-slate-500">
                      {provider.yearsExperience} years experience
                    </span>
                  </div>

                  {provider.bio && <p className="mt-4 text-slate-700">{provider.bio}</p>}

                  {provider.serviceAreas.length > 0 && (
                    <div className="mt-4 flex items-start gap-2 text-sm text-slate-600">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{provider.serviceAreas.join(' · ')}</span>
                    </div>
                  )}
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-6">
                  <h2 className="font-semibold text-slate-900">Services offered</h2>
                  {provider.services.length === 0 ? (
                    <p className="mt-2 text-sm text-slate-500">No services listed yet.</p>
                  ) : (
                    <ul className="mt-4 divide-y divide-slate-100">
                      {provider.services.map((service) => (
                        <li
                          key={service.serviceId}
                          className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                        >
                          <div>
                            <p className="font-medium text-slate-900">{service.name}</p>
                            <p className="text-xs text-slate-500">{service.categoryName}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-nexo-700">
                              from {formatCurrency(service.priceFrom)}
                            </p>
                            {isCustomer && (
                              <Link
                                to={`/providers/${id}/book?service=${service.serviceId}`}
                                className="mt-1 inline-block text-xs text-nexo-700 hover:underline"
                              >
                                Book this →
                              </Link>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="font-semibold text-slate-900">Customer reviews</h2>
                    <span className="text-sm text-slate-500">
                      {provider.ratingCount} review{provider.ratingCount === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="mt-4">
                    <PublicReviewList
                      reviews={reviews}
                      isLoading={reviewsLoading}
                      error={reviewsError}
                      layout="stack"
                      emptyMessage="No reviews yet for this provider."
                    />
                  </div>
                </section>
              </div>

              <aside className="h-fit rounded-xl border border-slate-200 bg-white p-6">
                <p className="text-sm text-slate-500">Hourly rate</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {formatCurrency(provider.hourlyRate)}
                  <span className="text-sm font-normal text-slate-500">/hr</span>
                </p>

                {isCustomer ? (
                  <Link
                    to={`/providers/${id}/book`}
                    className="mt-6 block w-full rounded-lg bg-nexo-700 py-2.5 text-center text-sm font-medium text-white hover:bg-nexo-800"
                  >
                    Book now
                  </Link>
                ) : user ? (
                  <p className="mt-6 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    Log in as a customer to book this provider.
                  </p>
                ) : (
                  <Link
                    to="/login"
                    className="mt-6 block w-full rounded-lg bg-nexo-700 py-2.5 text-center text-sm font-medium text-white hover:bg-nexo-800"
                  >
                    Log in to book
                  </Link>
                )}
              </aside>
            </div>
          </>
        )}
      </QueryState>
    </div>
  )
}
