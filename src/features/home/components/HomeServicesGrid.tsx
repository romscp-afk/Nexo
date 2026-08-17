import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useCategories } from '@/features/catalog/hooks/useCategories'
import { ComingSoonBadge, QueryState } from '@/features/catalog/components/CatalogUi'
import type { ServiceCategory } from '@/shared/types/catalog'
import {
  isCategoryLaunched,
  PRIMARY_CATEGORY_SLUG,
} from '@/shared/lib/catalogConfig'
import { cn } from '@/shared/lib/utils'

function HomeCategoryCard({
  category,
  featured,
  styleIndex,
}: {
  category: ServiceCategory
  featured?: boolean
  styleIndex: number
}) {
  const launched = isCategoryLaunched(category.slug)
  const cardStyles = [
    'from-nexo-900 to-nexo-deep',
    'from-nexo-800 to-nexo-950',
    'from-nexo-deep to-nexo-800',
  ]
  const gradient = cardStyles[styleIndex % cardStyles.length]

  if (featured && launched) {
    return (
      <Link
        to={`/services/${category.slug}`}
        className={cn(
          'group relative col-span-1 flex min-h-[220px] flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br p-8 text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl sm:col-span-2 lg:col-span-3',
          gradient,
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-nexo-400/15 blur-2xl"
        />
        <div>
          <span className="text-5xl" aria-hidden>
            {category.icon ?? '🧹'}
          </span>
          <h3 className="mt-4 text-2xl font-bold">{category.name}</h3>
          {category.description && (
            <p className="mt-2 max-w-xl text-base text-nexo-mint/90">{category.description}</p>
          )}
        </div>
        <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-nexo-400">
          Book now <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </span>
      </Link>
    )
  }

  if (!launched) {
    return (
      <div className="relative flex min-h-[120px] flex-col rounded-2xl border border-dashed border-slate-200 bg-slate-50/90 p-5">
        <ComingSoonBadge className="absolute right-4 top-4" />
        <span className="text-2xl opacity-60" aria-hidden>
          {category.icon ?? '🛠️'}
        </span>
        <h3 className="mt-2 text-base font-semibold text-slate-600">{category.name}</h3>
      </div>
    )
  }

  return (
    <Link
      to={`/services/${category.slug}`}
      className="group relative flex min-h-[160px] flex-col overflow-hidden rounded-2xl border border-nexo-200 bg-gradient-to-br from-white to-nexo-50 p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-nexo-400 hover:shadow-md"
    >
      <span className="relative text-3xl" aria-hidden>
        {category.icon ?? '🛠️'}
      </span>
      <h3 className="relative mt-3 text-lg font-bold text-nexo-900">{category.name}</h3>
      {category.description && (
        <p className="relative mt-1.5 line-clamp-2 text-sm text-nexo-800/70">{category.description}</p>
      )}
      <span className="relative mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-nexo-600">
        View <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  )
}

export function HomeServicesGrid() {
  const { data: categories, isLoading, error, refetch, isFetching } = useCategories()
  const cleaning = categories?.find((c) => c.slug === PRIMARY_CATEGORY_SLUG)

  return (
    <section className="bg-nexo-50 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-nexo-900 sm:text-4xl">
              Home cleaning
            </h2>
            <p className="mt-2 max-w-lg text-nexo-800/70">
              Book verified cleaners across Singapore.
            </p>
          </div>
          <Link
            to={`/services/${PRIMARY_CATEGORY_SLUG}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-nexo-600 transition hover:text-nexo-800"
          >
            Book cleaning
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10">
          <QueryState
            loading={isLoading}
            error={error}
            empty={!isLoading && !isFetching && !cleaning}
            emptyMessage="No service categories found. Please try again later."
          >
            <>
              {cleaning && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <HomeCategoryCard category={cleaning} featured styleIndex={0} />
                </div>
              )}
            </>
          </QueryState>

          {error && (
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 text-sm font-medium text-nexo-600 hover:underline"
            >
              Retry loading services
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
