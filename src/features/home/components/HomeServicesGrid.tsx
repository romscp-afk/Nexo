import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useCategories } from '@/features/catalog/hooks/useCategories'
import { QueryState } from '@/features/catalog/components/CatalogUi'
import type { ServiceCategory } from '@/shared/types/catalog'

function HomeCategoryCard({
  category,
  featured,
}: {
  category: ServiceCategory
  featured?: boolean
}) {
  if (featured) {
    return (
      <Link
        to={`/services/${category.slug}`}
        className="group relative col-span-1 flex min-h-[220px] flex-col justify-between overflow-hidden rounded-2xl border border-nexo-200 bg-gradient-to-br from-nexo-50 to-white p-8 shadow-sm transition hover:-translate-y-0.5 hover:border-nexo-300 hover:shadow-md sm:col-span-2 lg:col-span-3"
      >
        <div>
          <span className="text-5xl" aria-hidden>
            {category.icon ?? '🛠️'}
          </span>
          <h3 className="mt-4 text-2xl font-bold text-slate-900">{category.name}</h3>
          {category.description && (
            <p className="mt-2 max-w-xl text-base text-slate-600">{category.description}</p>
          )}
        </div>
        <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-nexo-700">
          Book now <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </span>
      </Link>
    )
  }

  return (
    <Link
      to={`/services/${category.slug}`}
      className="group flex min-h-[160px] flex-col rounded-2xl border border-nexo-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-nexo-200 hover:bg-nexo-50/50 hover:shadow-md"
    >
      <span className="text-3xl" aria-hidden>
        {category.icon ?? '🛠️'}
      </span>
      <h3 className="mt-3 text-lg font-bold text-slate-900">{category.name}</h3>
      {category.description && (
        <p className="mt-1.5 line-clamp-2 text-sm text-slate-600">{category.description}</p>
      )}
      <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-medium text-nexo-600">
        View <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  )
}

export function HomeServicesGrid() {
  const { data: categories, isLoading, error, refetch, isFetching } = useCategories()
  const items = categories ?? []

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-nexo-600">
              What we offer
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Popular services
            </h2>
            <p className="mt-2 max-w-lg text-slate-600">
              From spotless homes to cool aircon — find the right pro for every job.
            </p>
          </div>
          <Link
            to="/services"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-nexo-700 transition hover:text-nexo-800"
          >
            View all services
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10">
          <QueryState
            loading={isLoading}
            error={error}
            empty={!isLoading && !isFetching && items.length === 0}
            emptyMessage="No service categories found. Check your Supabase connection or run supabase/seed.sql."
          >
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.slice(0, 1).map((category) => (
                  <HomeCategoryCard key={category.id} category={category} featured />
                ))}
              </div>
              {items.length > 1 && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.slice(1, 7).map((category) => (
                    <HomeCategoryCard key={category.id} category={category} />
                  ))}
                </div>
              )}
            </>
          </QueryState>

          {error && (
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 text-sm font-medium text-nexo-700 hover:underline"
            >
              Retry loading services
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
