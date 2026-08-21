import { Link } from 'react-router-dom'
import { ArrowRight, MessageSquare } from 'lucide-react'
import { usePublicReviews } from '@/features/bookings/hooks/useReviews'
import { PublicReviewList } from '@/features/reviews/components/PublicReviewList'
import { SectionHeading } from '@/shared/components/ui/SectionHeading'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { PRIMARY_CATEGORY_SLUG } from '@/shared/lib/catalogConfig'

export function HomeReviews() {
  const { data: reviews, isLoading, error } = usePublicReviews(6)

  return (
    <section className="bg-brand-bg py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            eyebrow="Testimonials"
            title="Trusted by homeowners"
            description="Real feedback from completed bookings across Singapore."
          />
          <Link
            to={`/providers/category/${PRIMARY_CATEGORY_SLUG}`}
            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-brand-primary transition hover:text-brand-primary-hover"
          >
            Browse service providers
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10">
          {!isLoading && !error && (!reviews || reviews.length === 0) ? (
            <EmptyState
              icon={<MessageSquare className="h-5 w-5" />}
              title="Reviews coming soon"
              description="Customer reviews will appear here once bookings are completed on Nexo."
            />
          ) : (
            <PublicReviewList
              reviews={reviews}
              isLoading={isLoading}
              error={error}
              showProvider
              emptyMessage="Reviews will appear here once customers complete bookings."
            />
          )}
        </div>
      </div>
    </section>
  )
}
