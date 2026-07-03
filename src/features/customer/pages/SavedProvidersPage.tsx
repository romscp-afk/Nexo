import { Link } from 'react-router-dom'
import { useSavedProviders } from '@/features/customer/hooks/useSavedProviders'
import { ProviderCard } from '@/features/providers/components/ProviderCard'
import { QueryState } from '@/features/catalog/components/CatalogUi'

export function SavedProvidersPage() {
  const { data: providers, isLoading, error } = useSavedProviders()

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Saved providers</h1>
      <p className="mt-1 text-slate-600">Your favourite service professionals for quick rebooking.</p>

      <QueryState
        loading={isLoading}
        error={error}
        empty={!providers?.length}
        emptyMessage="No saved providers yet. Tap the heart on a provider profile to save them."
      >
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {providers?.map((provider) => (
            <ProviderCard key={provider.id} provider={provider} />
          ))}
        </div>
      </QueryState>

      {!providers?.length && !isLoading && (
        <Link
          to="/providers"
          className="mt-4 inline-block text-sm font-medium text-nexo-700 hover:underline"
        >
          Browse providers →
        </Link>
      )}
    </div>
  )
}
