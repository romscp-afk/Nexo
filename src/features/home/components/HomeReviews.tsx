import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { usePublicReviews } from '@/features/bookings/hooks/useReviews'
import { PublicReviewList } from '@/features/reviews/components/PublicReviewList'

export function HomeReviews() {
  const { data: reviews, isLoading, error } = usePublicReviews(6)

  return (
    <section className="bg-nexo-50 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-nexo-600">
              Customer reviews
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-nexo-900 sm:text-4xl">
              Trusted by homeowners
            </h2>
            <p className="mt-2 max-w-xl text-nexo-800/70">
              Real feedback from completed bookings across Singapore.
            </p>
          </div>
          <Link
            to="/providers"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-nexo-600 transition hover:text-nexo-800"
          >
            Browse providers
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10">
          <PublicReviewList
            reviews={reviews}
            isLoading={isLoading}
            error={error}
            showProvider
            emptyMessage="Reviews will appear here once customers complete bookings."
          />
        </div>
      </div>
    </section>
  )
}
