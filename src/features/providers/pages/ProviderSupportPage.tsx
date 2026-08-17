import { AdminProviderMessagePanel } from '@/features/admin/components/AdminProviderMessagePanel'
import { useMyProvider } from '@/features/providers/hooks/useMyProvider'
import { QueryState } from '@/features/catalog/components/CatalogUi'

export function ProviderSupportPage() {
  const { data: provider, isLoading, error } = useMyProvider()

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Nexo support</h1>
      <p className="mt-1 text-slate-600">
        Message the Nexo team about verification, payments, or your provider account.
      </p>

      <div className="mt-6">
        <QueryState loading={isLoading} error={error} empty={!provider}>
          {provider && (
            <AdminProviderMessagePanel
              providerId={provider.id}
              role="provider"
              title="Message Nexo admin"
            />
          )}
        </QueryState>
      </div>
    </div>
  )
}
