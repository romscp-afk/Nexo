import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  useDeleteProvider,
  useSetProviderVerified,
} from '@/features/admin/hooks/useAdmin'
import { useAdminProvider } from '@/features/admin/hooks/useAdminProviderMessages'
import {
  AdminContactCell,
  AdminProviderPaymentStatus,
} from '@/features/admin/components/AdminProviderGridCells'
import { AdminProviderMessagePanel } from '@/features/admin/components/AdminProviderMessagePanel'
import { ProviderAvatar } from '@/features/providers/components/ProviderAvatar'
import { QueryState } from '@/features/catalog/components/CatalogUi'
import { PROVIDER_LISTING_TYPE_LABELS } from '@/shared/lib/providerListing'
import { formatCurrency, formatDateTime } from '@/shared/lib/utils'

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="font-semibold text-slate-900">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

export function AdminProviderDetailPage() {
  const { id = '' } = useParams()
  const { data: provider, isLoading, error } = useAdminProvider(id)
  const setVerified = useSetProviderVerified()
  const deleteProvider = useDeleteProvider()
  const [actionError, setActionError] = useState('')

  const toggleVerified = async () => {
    if (!provider) return
    const hasPhoto = Boolean(provider.avatarUrl)
    if (!provider.isVerified && !hasPhoto) {
      const proceed = window.confirm(
        `${provider.businessName} has not uploaded a profile photo yet. Verify anyway?`,
      )
      if (!proceed) return
    }
    setActionError('')
    try {
      await setVerified.mutateAsync({
        providerId: provider.id,
        isVerified: !provider.isVerified,
      })
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Update failed')
    }
  }

  const removeProvider = async () => {
    if (!provider) return
    if (
      !window.confirm(
        `Remove ${provider.businessName} from Nexo? Their listing will be deleted. Their account stays as a customer.`,
      )
    ) {
      return
    }
    setActionError('')
    try {
      await deleteProvider.mutateAsync(provider.id)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Remove failed')
    }
  }

  const actionPending = setVerified.isPending || deleteProvider.isPending

  return (
    <div>
      <Link to="/admin/providers" className="text-sm text-nexo-700 hover:underline">
        ← Back to providers
      </Link>

      <QueryState loading={isLoading} error={error} empty={!provider}>
        {provider && (
          <div className="mt-4 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                {provider.avatarUrl ? (
                  <a href={provider.avatarUrl} target="_blank" rel="noopener noreferrer">
                    <ProviderAvatar
                      name={provider.businessName}
                      avatarUrl={provider.avatarUrl}
                      size="lg"
                    />
                  </a>
                ) : (
                  <ProviderAvatar name={provider.businessName} avatarUrl={null} size="lg" />
                )}
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">{provider.businessName}</h1>
                  <p className="mt-1 text-slate-600">{provider.fullName}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {PROVIDER_LISTING_TYPE_LABELS[provider.listingType]}
                    {provider.listingType === 'individual' && ' · Hidden publicly'}
                    {' · '}
                    {provider.isVerified ? 'Verified' : 'Not verified'}
                    {!provider.isActive && ' · Account inactive'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  to={`/admin/users`}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Find in users
                </Link>
                <button
                  type="button"
                  onClick={() => void toggleVerified()}
                  disabled={actionPending}
                  className="rounded-lg bg-nexo-700 px-3 py-2 text-sm font-medium text-white hover:bg-nexo-800 disabled:opacity-50"
                >
                  {provider.isVerified ? 'Remove verification' : 'Verify provider'}
                </button>
                <button
                  type="button"
                  onClick={() => void removeProvider()}
                  disabled={actionPending}
                  className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  Remove listing
                </button>
              </div>
            </div>

            {actionError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{actionError}</p>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <DetailSection title="Contact">
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-slate-500">Email</dt>
                    <dd className="font-medium">{provider.email || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Phone</dt>
                    <dd>
                      <AdminContactCell value={provider.phone} kind="phone" />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">WhatsApp</dt>
                    <dd>
                      <AdminContactCell value={provider.whatsApp} kind="whatsapp" />
                    </dd>
                  </div>
                </dl>
              </DetailSection>

              <DetailSection title="Profile">
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-slate-500">Bio</dt>
                    <dd className="text-slate-800">{provider.bio?.trim() || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Experience</dt>
                    <dd>{provider.yearsExperience} years</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Hourly rate</dt>
                    <dd>{formatCurrency(provider.hourlyRate)}/hr</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Service areas</dt>
                    <dd>
                      {provider.serviceAreas.length
                        ? provider.serviceAreas.join(', ')
                        : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Address</dt>
                    <dd>
                      {[provider.addressLine1, provider.addressLine2, provider.postalCode]
                        .filter(Boolean)
                        .join(', ') || '—'}
                      {provider.preferredArea ? ` · ${provider.preferredArea}` : ''}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Joined</dt>
                    <dd>{formatDateTime(provider.createdAt)}</dd>
                  </div>
                </dl>
              </DetailSection>

              <DetailSection title="Performance">
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-slate-500">Rating</dt>
                    <dd className="font-medium">
                      {provider.ratingAvg.toFixed(1)} ({provider.ratingCount} reviews)
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Completed jobs</dt>
                    <dd className="font-medium">{provider.completedBookings}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Open bookings</dt>
                    <dd className="font-medium">{provider.openBookings}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Payments</dt>
                    <dd>
                      <AdminProviderPaymentStatus summary={provider.paymentSummary} />
                    </dd>
                  </div>
                </dl>
              </DetailSection>

              <DetailSection title="Services & pricing">
                {provider.services.length ? (
                  <ul className="space-y-2 text-sm">
                    {provider.services.map((service) => (
                      <li
                        key={service.serviceId}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                      >
                        <span>
                          {service.name}
                          <span className="text-slate-500"> · {service.categoryName}</span>
                        </span>
                        <span className="font-medium">
                          {service.pricingModel === 'per_unit'
                            ? `From ${formatCurrency(service.priceFrom)}/unit`
                            : `${formatCurrency(service.priceFrom)}/hr`}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">No services configured.</p>
                )}
              </DetailSection>
            </div>

            <AdminProviderMessagePanel providerId={provider.id} role="admin" />
          </div>
        )}
      </QueryState>
    </div>
  )
}
