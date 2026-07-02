import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import { QueryState } from '@/features/catalog/components/CatalogUi'
import type { Review } from '@/shared/types/review'
import { formatDateTime } from '@/shared/lib/utils'

function ReviewStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5 text-amber-500">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`h-4 w-4 ${index < rating ? 'fill-current' : 'text-slate-200'}`}
        />
      ))}
    </div>
  )
}

function ReviewCard({
  review,
  showProvider = false,
}: {
  review: Review
  showProvider?: boolean
}) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-nexo-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-nexo-950">{review.customerName ?? 'Verified customer'}</p>
          {showProvider && review.providerName && (
            <Link
              to={`/providers/${review.providerId}`}
              className="mt-0.5 inline-block text-sm text-nexo-600 hover:underline"
            >
              {review.providerName}
            </Link>
          )}
          {review.serviceName && (
            <p className="mt-0.5 text-xs text-slate-500">{review.serviceName}</p>
          )}
        </div>
        <ReviewStars rating={review.rating} />
      </div>

      {review.comment ? (
        <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-700">{review.comment}</p>
      ) : (
        <p className="mt-3 flex-1 text-sm italic text-slate-400">No written comment.</p>
      )}

      <p className="mt-4 text-xs text-slate-400">{formatDateTime(review.createdAt)}</p>
    </article>
  )
}

type PublicReviewListProps = {
  reviews?: Review[]
  isLoading?: boolean
  error?: Error | null
  emptyMessage?: string
  showProvider?: boolean
  layout?: 'grid' | 'stack'
}

export function PublicReviewList({
  reviews,
  isLoading,
  error,
  emptyMessage = 'No reviews yet.',
  showProvider = false,
  layout = 'grid',
}: PublicReviewListProps) {
  return (
    <QueryState
      loading={isLoading}
      error={error}
      empty={!reviews?.length}
      emptyMessage={emptyMessage}
    >
      <ul
        className={
          layout === 'grid'
            ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
            : 'space-y-3'
        }
      >
        {reviews?.map((review) => (
          <li key={review.id}>
            <ReviewCard review={review} showProvider={showProvider} />
          </li>
        ))}
      </ul>
    </QueryState>
  )
}

export function PublicReviewSummary({
  ratingAvg,
  ratingCount,
}: {
  ratingAvg: number
  ratingCount: number
}) {
  return (
    <div className="flex items-center gap-2 text-amber-500">
      <Star className="h-5 w-5 fill-current" />
      <span className="text-lg font-semibold text-nexo-950">{ratingAvg.toFixed(1)}</span>
      <span className="text-sm text-slate-500">
        ({ratingCount} review{ratingCount === 1 ? '' : 's'})
      </span>
    </div>
  )
}
