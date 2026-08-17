import { Link } from 'react-router-dom'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { PRIMARY_CATEGORY_SLUG } from '@/shared/lib/catalogConfig'
import { cn } from '@/shared/lib/utils'

function CleanerCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-5" aria-hidden>
      <div className="flex justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-5 w-2/3 rounded bg-slate-200" />
          <div className="h-4 w-full rounded bg-slate-100" />
          <div className="h-4 w-4/5 rounded bg-slate-100" />
        </div>
        <div className="h-10 w-16 rounded bg-slate-200" />
      </div>
      <div className="mt-4 h-4 w-1/3 rounded bg-slate-100" />
    </div>
  )
}

export function ProviderListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2" role="status" aria-label="Loading cleaners">
      {Array.from({ length: count }).map((_, i) => (
        <CleanerCardSkeleton key={i} />
      ))}
    </div>
  )
}

type ProviderListStateProps = {
  variant: 'empty' | 'filtered' | 'error'
  onClearFilters?: () => void
  onRetry?: () => void
}

export function ProviderListState({ variant, onClearFilters, onRetry }: ProviderListStateProps) {
  const requestPath = `/services/${PRIMARY_CATEGORY_SLUG}/request`

  if (variant === 'error') {
    return (
      <div
        className="rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center"
        role="alert"
      >
        <AlertCircle className="mx-auto h-8 w-8 text-red-500" aria-hidden />
        <h2 className="mt-4 text-lg font-semibold text-slate-900">We couldn&apos;t load cleaners.</h2>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-2 rounded-lg bg-nexo-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-nexo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nexo-600"
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              Try again
            </button>
          )}
          <Link
            to={requestPath}
            className="rounded-lg border border-nexo-200 bg-white px-4 py-2.5 text-sm font-medium text-nexo-700 hover:bg-nexo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nexo-600"
          >
            Request a cleaner
          </Link>
        </div>
      </div>
    )
  }

  if (variant === 'empty') {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-10 text-center">
        <h2 className="text-lg font-semibold text-slate-900">
          We&apos;re onboarding cleaners in your area.
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          Tell us your cleaning requirements and Nexo will help you find an available cleaning
          professional.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to={requestPath}
            className="rounded-lg bg-nexo-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-nexo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nexo-600"
          >
            Request a cleaner
          </Link>
          <Link
            to="/register?role=provider"
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-nexo-700 underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nexo-600"
          >
            Join as a cleaning professional
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-6 py-10 text-center">
      <h2 className="text-lg font-semibold text-slate-900">No cleaners match your filters.</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
        Try changing the area, rating or price range.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className={cn(
              'rounded-lg border border-nexo-200 bg-white px-4 py-2.5 text-sm font-medium text-nexo-700 hover:bg-nexo-50',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nexo-600',
            )}
          >
            Clear filters
          </button>
        )}
        <Link
          to={requestPath}
          className="rounded-lg bg-nexo-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-nexo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nexo-600"
        >
          Request a cleaner
        </Link>
      </div>
    </div>
  )
}
