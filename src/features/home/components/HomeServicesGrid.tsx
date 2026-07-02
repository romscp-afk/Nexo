import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useCategories } from '@/features/catalog/hooks/useCategories'
import { QueryState } from '@/features/catalog/components/CatalogUi'
import type { ServiceCategory } from '@/shared/types/catalog'
import { cn } from '@/shared/lib/utils'

const cardStyles = [
  'from-emerald-500/90 to-teal-700',
  'from-teal-500/90 to-cyan-700',
  'from-lime-500/90 to-emerald-700',
  'from-cyan-500/90 to-teal-700',
  'from-green-500/90 to-emerald-800',
  'from-teal-600/90 to-green-800',
]

function HomeCategoryCard({
  category,
  featured,
  styleIndex,
}: {
  category: ServiceCategory
  featured?: boolean
  styleIndex: number
}) {
  const gradient = cardStyles[styleIndex % cardStyles.length]

  return (
    <Link
      to={`/services/${category.slug}`}
      className={cn(
        'group relative overflow-hidden rounded-2xl bg-gradient-to-br p-6 text-white shadow-lg transition hover:-translate-y-1 hover:shadow-xl',
        gradient,
        featured ? 'sm:col-span-2 sm:row-span-2 sm:p-8' : 'min-h-[140px]',
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10 blur-xl transition group-hover:bg-white/20"
      />
      <span className={cn('block', featured ? 'text-5xl' : 'text-3xl')} aria-hidden>
        {category.icon ?? '🛠️'}
      </span>
      <h3 className={cn('mt-3 font-bold', featured ? 'text-2xl' : 'text-lg')}>{category.name}</h3>
      {category.description && (
        <p
          className={cn(
            'mt-1.5 line-clamp-2 text-white/80',
            featured ? 'text-base' : 'text-sm',
          )}
        >
          {category.description}
        </p>
      )}
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-white/90 opacity-0 transition group-hover:opacity-100">
        Book now <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  )
}

export function HomeServicesGrid() {
  const { data: categories, isLoading, error } = useCategories()
  const items = categories?.slice(0, 6) ?? []

  return (
    <section className="py-20">
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
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-nexo-700 transition hover:text-nexo-900"
          >
            View all services
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10">
          <QueryState
            loading={isLoading}
            error={error}
            empty={!items.length}
            emptyMessage="Run supabase/seed.sql to populate service categories."
          >
            <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {items.map((category, i) => (
                <HomeCategoryCard
                  key={category.id}
                  category={category}
                  featured={i === 0}
                  styleIndex={i}
                />
              ))}
            </div>
          </QueryState>
        </div>
      </div>
    </section>
  )
}
