import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { ServiceCategory } from '@/shared/types/catalog'
import { isCategoryLaunched, COMING_SOON_LABEL } from '@/shared/lib/catalogConfig'
import { cn } from '@/shared/lib/utils'

export function ComingSoonBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-slate-500',
        className,
      )}
    >
      {COMING_SOON_LABEL}
    </span>
  )
}

export function CategoryCard({ category }: { category: ServiceCategory }) {
  const launched = isCategoryLaunched(category.slug)

  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="text-3xl" aria-hidden>
          {category.icon ?? '🛠️'}
        </span>
        {!launched && <ComingSoonBadge />}
      </div>
      <h3
        className={cn(
          'mt-3 font-semibold',
          launched ? 'text-slate-900 group-hover:text-nexo-700' : 'text-slate-700',
        )}
      >
        {category.name}
      </h3>
      {category.description && (
        <p className="mt-1 line-clamp-2 text-sm text-slate-600">{category.description}</p>
      )}
      {!launched && (
        <p className="mt-2 text-xs text-slate-500">Available in a future update.</p>
      )}
    </>
  )

  if (!launched) {
    return (
      <div
        className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-5 opacity-90"
        aria-disabled
      >
        {content}
      </div>
    )
  }

  return (
    <Link
      to={`/services/${category.slug}`}
      className="group rounded-xl border border-nexo-100 bg-white p-5 transition hover:border-nexo-200 hover:bg-nexo-50/50 hover:shadow-sm"
    >
      {content}
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
