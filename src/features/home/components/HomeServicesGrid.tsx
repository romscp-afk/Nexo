import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'
import { useCategories } from '@/features/catalog/hooks/useCategories'
import { ComingSoonBadge, QueryState } from '@/features/catalog/components/CatalogUi'
import type { ServiceCategory } from '@/shared/types/catalog'
import {
  isCategoryLaunched,
  PRIMARY_CATEGORY_SLUG,
} from '@/shared/lib/catalogConfig'
import {
  CLEANING_TYPES,
  CLEANING_CATALOG_HOURLY_RATE,
  MIN_BOOKING_HOURS,
} from '@/shared/lib/cleaningContent'
import { formatCurrency } from '@/shared/lib/utils'
import { SectionHeading } from '@/shared/components/ui/SectionHeading'
import { Badge } from '@/shared/components/ui/Badge'

function FeaturedCleaningCard({ category }: { category: ServiceCategory }) {
  const standard = CLEANING_TYPES.find((t) => t.supported)
  const comingSoon = CLEANING_TYPES.filter((t) => !t.supported)

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="relative overflow-hidden rounded-card-lg bg-hero-gradient p-8 text-white shadow-brand lg:col-span-2">
        <div aria-hidden className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-electric/10 blur-3xl" />
        <Badge className="relative mb-4 bg-white/15 text-white ring-white/20">Featured service</Badge>
        <span className="relative text-5xl" aria-hidden>{category.icon ?? '🧹'}</span>
        <h3 className="relative mt-4 text-2xl font-bold">{category.name}</h3>
        <p className="relative mt-2 max-w-xl text-brand-pale/90">
          {category.description ?? 'Regular upkeep for HDB, condominium and landed homes across Singapore.'}
        </p>
        <ul className="relative mt-6 space-y-2 text-sm text-brand-pale/85">
          <li>· HDB, condo and landed-home support</li>
          <li>· Starting from {formatCurrency(CLEANING_CATALOG_HOURLY_RATE)}/hour</li>
          <li>· Minimum {MIN_BOOKING_HOURS}-hour booking</li>
          <li>· {standard?.description}</li>
        </ul>
        <Link
          to={`/services/${category.slug}/request`}
          className="relative mt-8 inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-navy shadow-brand transition hover:bg-brand-light"
        >
          Request Cleaning
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="space-y-4">
        {comingSoon.map((type) => (
          <div
            key={type.id}
            className="relative rounded-card border border-dashed border-brand-border bg-brand-bg/80 p-5 opacity-75"
            aria-disabled
          >
            <ComingSoonBadge className="absolute right-4 top-4" />
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 shrink-0 text-brand-text-muted" />
              <div>
                <h4 className="font-semibold text-brand-text-secondary">{type.label}</h4>
                <p className="mt-1 text-sm text-brand-text-muted">{type.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function HomeServicesGrid() {
  const { data: categories, isLoading, error, refetch, isFetching } = useCategories()
  const cleaning = categories?.find((c) => c.slug === PRIMARY_CATEGORY_SLUG)

  return (
    <section className="bg-brand-bg py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Home cleaning"
          title="Professional cleaning for every home"
          description="Request home cleaning across Singapore with clear pricing and flexible scheduling."
        />

        <div className="mt-10">
          <QueryState
            loading={isLoading}
            error={error}
            empty={!isLoading && !isFetching && !cleaning}
            emptyMessage="No service categories found. Please try again later."
          >
            {cleaning && isCategoryLaunched(cleaning.slug) && (
              <FeaturedCleaningCard category={cleaning} />
            )}
          </QueryState>

          {error && (
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 text-sm font-medium text-brand-primary hover:underline"
            >
              Retry loading services
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
