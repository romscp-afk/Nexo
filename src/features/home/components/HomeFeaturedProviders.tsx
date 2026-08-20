import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useProviders } from '@/features/providers/hooks/useProviders'
import { ProviderCard } from '@/features/providers/components/ProviderCard'
import { QueryState } from '@/features/catalog/components/CatalogUi'
import { SectionHeading } from '@/shared/components/ui/SectionHeading'
import { SkeletonCard } from '@/shared/components/ui/Skeleton'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { PRIMARY_CATEGORY_SLUG } from '@/shared/lib/catalogConfig'
import { Users } from 'lucide-react'

export function HomeFeaturedProviders() {
  const { data: providers, isLoading, error } = useProviders({})

  return (
    <section className="bg-section-light py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            eyebrow="Featured cleaners"
            title="Trusted professionals near you"
            description="Browse verified home-cleaning providers available on Nexo."
          />
          <Link
            to={`/providers/category/${PRIMARY_CATEGORY_SLUG}`}
            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-brand-primary transition hover:text-brand-primary-hover"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10">
          <QueryState
            loading={isLoading}
            error={error}
            empty={!isLoading && !providers?.length}
            emptyMessage="No cleaners are listed yet. Check back soon or request a cleaning and we'll match you."
          >
            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : providers && providers.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {providers.slice(0, 4).map((provider) => (
                  <ProviderCard key={provider.id} provider={provider} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Users className="h-5 w-5" />}
                title="Cleaners coming soon"
                description="Request a cleaning and we'll notify available professionals in your area."
                action={
                  <Link
                    to="/services/cleaning/request"
                    className="inline-flex min-h-11 items-center rounded-full bg-brand-primary px-6 py-2.5 text-sm font-semibold text-white"
                  >
                    Request a Cleaning
                  </Link>
                }
              />
            )}
          </QueryState>
        </div>
      </div>
    </section>
  )
}
