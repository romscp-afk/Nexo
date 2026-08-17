import { Link } from 'react-router-dom'
import { ArrowRight, Users } from 'lucide-react'
import type { ServiceCategory } from '@/shared/types/catalog'
import { ComingSoonBadge } from '@/features/catalog/components/CatalogUi'
import { isCategoryLaunched } from '@/shared/lib/catalogConfig'
import { cn } from '@/shared/lib/utils'

export function ProviderCategoryCard({
  category,
  providerCount,
}: {
  category: ServiceCategory
  providerCount: number
}) {
  const launched = isCategoryLaunched(category.slug)

  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="text-4xl" aria-hidden>
          {category.icon ?? '🛠️'}
        </span>
        {!launched && <ComingSoonBadge />}
      </div>
      <h3
        className={cn(
          'mt-4 text-lg font-semibold',
          launched ? 'text-nexo-950 group-hover:text-nexo-600' : 'text-slate-600',
        )}
      >
        {category.name}
      </h3>
      {category.description && (
        <p className="mt-1 line-clamp-2 flex-1 text-sm text-slate-600">{category.description}</p>
      )}
      <div className="mt-4 flex items-center justify-between gap-3">
        {launched ? (
          <>
            <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
              <Users className="h-4 w-4" />
              {providerCount} provider{providerCount === 1 ? '' : 's'}
            </span>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-nexo-600">
              View
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
          </>
        ) : (
          <p className="text-sm text-slate-500">Launching soon on Nexo</p>
        )}
      </div>
    </>
  )

  if (!launched) {
    return (
      <div className="flex h-full flex-col rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-5 opacity-90">
        {content}
      </div>
    )
  }

  return (
    <Link
      to={`/providers/category/${category.slug}`}
      className="group flex h-full flex-col rounded-2xl border border-nexo-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-nexo-400 hover:shadow-md"
    >
      {content}
    </Link>
  )
}
