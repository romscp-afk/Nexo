import { Link } from 'react-router-dom'
import { ArrowRight, Users } from 'lucide-react'
import type { ServiceCategory } from '@/shared/types/catalog'

export function ProviderCategoryCard({
  category,
  providerCount,
}: {
  category: ServiceCategory
  providerCount: number
}) {
  return (
    <Link
      to={`/providers/category/${category.slug}`}
      className="group flex h-full flex-col rounded-2xl border border-nexo-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-nexo-400 hover:shadow-md"
    >
      <span className="text-4xl" aria-hidden>
        {category.icon ?? '🛠️'}
      </span>
      <h3 className="mt-4 text-lg font-semibold text-nexo-950 group-hover:text-nexo-600">
        {category.name}
      </h3>
      {category.description && (
        <p className="mt-1 line-clamp-2 flex-1 text-sm text-slate-600">{category.description}</p>
      )}
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
          <Users className="h-4 w-4" />
          {providerCount} provider{providerCount === 1 ? '' : 's'}
        </span>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-nexo-600">
          View
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  )
}
