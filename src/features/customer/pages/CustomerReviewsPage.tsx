import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import { useCustomerReviews } from '@/features/bookings/hooks/useReviews'
import { QueryState } from '@/features/catalog/components/CatalogUi'
import { formatDateTime } from '@/shared/lib/utils'

export function CustomerReviewsPage() {
  const { data: reviews, isLoading, error } = useCustomerReviews()

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">My reviews</h1>
      <p className="mt-1 text-slate-600">Reviews you've left for completed bookings.</p>

      <div className="mt-6">
        <QueryState
          loading={isLoading}
          error={error}
          empty={!reviews?.length}
          emptyMessage="No reviews yet. Complete a booking to leave feedback for your provider."
        >
          <ul className="space-y-3">
            {reviews?.map((review) => (
              <li
                key={review.id}
                className="rounded-xl border border-slate-200 bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">
                      {review.providerName ?? 'Provider'}
                      {review.serviceName && (
                        <span className="font-normal text-slate-500"> · {review.serviceName}</span>
                      )}
                    </p>
                    <div className="mt-1 flex items-center gap-1 text-amber-600">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < review.rating ? 'fill-current' : 'text-slate-200'}`}
                        />
                      ))}
                      <span className="ml-1 text-sm text-slate-600">{review.rating}/5</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">{formatDateTime(review.createdAt)}</p>
                </div>
                {review.comment && (
                  <p className="mt-3 text-sm text-slate-700">{review.comment}</p>
                )}
                <Link
                  to={`/dashboard/bookings/${review.bookingId}`}
                  className="mt-3 inline-block text-sm font-medium text-nexo-700 hover:underline"
                >
                  View booking
                </Link>
              </li>
            ))}
          </ul>
        </QueryState>
      </div>
    </div>
  )
}
