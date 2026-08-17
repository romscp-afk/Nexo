import { useState } from 'react'
import {
  useAdminProviders,
  useDeleteProvider,
  useSetProviderVerified,
} from '@/features/admin/hooks/useAdmin'
import {
  AdminContactCell,
  AdminProviderPaymentStatus,
} from '@/features/admin/components/AdminProviderGridCells'
import { ProviderAvatar } from '@/features/providers/components/ProviderAvatar'
import { QueryState } from '@/features/catalog/components/CatalogUi'
import { formatCurrency } from '@/shared/lib/utils'

export function AdminProvidersPage() {
  const { data: providers, isLoading, error } = useAdminProviders()
  const setVerified = useSetProviderVerified()
  const deleteProvider = useDeleteProvider()
  const [actionError, setActionError] = useState('')

  const toggleVerified = async (providerId: string, isVerified: boolean, hasPhoto: boolean) => {
    if (!isVerified && !hasPhoto) {
      setActionError('Provider must upload a profile photo before you can verify them.')
      return
    }

    setActionError('')
    try {
      await setVerified.mutateAsync({ providerId, isVerified: !isVerified })
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Update failed')
    }
  }

  const removeProvider = async (providerId: string, businessName: string) => {
    if (
      !window.confirm(
        `Remove ${businessName} from Nexo? Their listing and provider bookings will be deleted. Their login account stays active as a customer.`,
      )
    ) {
      return
    }

    setActionError('')
    try {
      await deleteProvider.mutateAsync(providerId)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Remove failed')
    }
  }

  const actionPending = setVerified.isPending || deleteProvider.isPending

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Providers</h1>
      <p className="mt-1 text-slate-600">
        Review profile photos, contact details, payments, and verification status.
      </p>

      {actionError && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{actionError}</p>
      )}

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <QueryState loading={isLoading} error={error} empty={!providers?.length}>
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Photo</th>
                <th className="px-4 py-3 font-medium">Business</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">WhatsApp</th>
                <th className="px-4 py-3 font-medium">Payment status</th>
                <th className="px-4 py-3 font-medium">Rating</th>
                <th className="px-4 py-3 font-medium">Hourly rate</th>
                <th className="px-4 py-3 font-medium">Verified</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {providers?.map((p) => {
                const hasPhoto = Boolean(p.avatarUrl)
                const canVerify = p.isVerified || hasPhoto

                return (
                  <tr key={p.id}>
                    <td className="px-4 py-3">
                      {hasPhoto ? (
                        <a
                          href={p.avatarUrl!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nexo-600"
                          title={`View ${p.businessName}'s profile photo`}
                        >
                          <ProviderAvatar name={p.businessName} avatarUrl={p.avatarUrl} size="lg" />
                        </a>
                      ) : (
                        <div className="flex items-center gap-2">
                          <ProviderAvatar name={p.businessName} avatarUrl={null} size="lg" />
                          <span className="text-xs text-amber-700">No photo</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">{p.businessName}</td>
                    <td className="px-4 py-3">
                      <AdminContactCell value={p.phone} kind="phone" />
                    </td>
                    <td className="px-4 py-3">
                      <AdminContactCell value={p.whatsApp} kind="whatsapp" />
                    </td>
                    <td className="px-4 py-3">
                      <AdminProviderPaymentStatus summary={p.paymentSummary} />
                    </td>
                    <td className="px-4 py-3">
                      {p.ratingAvg.toFixed(1)} ({p.ratingCount})
                    </td>
                    <td className="px-4 py-3">{formatCurrency(p.hourlyRate)}/hr</td>
                    <td className="px-4 py-3">{p.isVerified ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggleVerified(p.id, p.isVerified, hasPhoto)}
                          disabled={actionPending || (!p.isVerified && !canVerify)}
                          title={
                            !p.isVerified && !hasPhoto
                              ? 'Provider must upload a profile photo first'
                              : undefined
                          }
                          className="text-nexo-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {p.isVerified ? 'Remove verification' : 'Verify'}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeProvider(p.id, p.businessName)}
                          disabled={actionPending}
                          className="text-red-600 hover:underline disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </QueryState>
      </div>
    </div>
  )
}
