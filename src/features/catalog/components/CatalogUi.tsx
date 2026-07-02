import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { ServiceCategory } from '@/shared/types/catalog'
import { cn } from '@/shared/lib/utils'

export function CategoryCard({ category }: { category: ServiceCategory }) {
  return (
    <Link
      to={`/services/${category.slug}`}
      className="group rounded-xl border border-nexo-100 bg-white p-5 transition hover:border-nexo-200 hover:bg-nexo-50/50 hover:shadow-sm"
    >
      <span className="text-3xl" aria-hidden>
        {category.icon ?? '🛠️'}
      </span>
      <h3 className="mt-3 font-semibold text-slate-900 group-hover:text-nexo-700">
        {category.name}
      </h3>
      {category.description && (
        <p className="mt-1 line-clamp-2 text-sm text-slate-600">{category.description}</p>
      )}
    </Link>
  )
}

export function LoadingGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-36 animate-pulse rounded-xl bg-slate-200" />
      ))}
    </div>
  )
}

export function QueryState({
  loading,
  error,
  empty,
  emptyMessage,
  children,
}: {
  loading: boolean
  error: Error | null
  empty?: boolean
  emptyMessage?: string
  children: ReactNode
}) {
  if (loading) return <LoadingGrid />
  if (error) {
    return (
      <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
        {error.message}
      </div>
    )
  }
  if (empty) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        {emptyMessage ?? 'Nothing to show yet.'}
      </div>
    )
  }
  return children
}

export function PageHeader({
  title,
  description,
  backTo,
  backLabel,
}: {
  title: string
  description?: string
  backTo?: string
  backLabel?: string
}) {
  return (
    <div className="mb-8">
      {backTo && (
        <Link to={backTo} className="text-sm text-nexo-700 hover:underline">
          ← {backLabel ?? 'Back'}
        </Link>
      )}
      <h1 className={cn('text-2xl font-bold text-slate-900', backTo && 'mt-2')}>{title}</h1>
      {description && <p className="mt-1 text-slate-600">{description}</p>}
    </div>
  )
}
