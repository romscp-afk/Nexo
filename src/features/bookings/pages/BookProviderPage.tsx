import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useProvider } from '@/features/providers/hooks/useProviders'
import { useCreateBooking } from '@/features/bookings/hooks/useBookings'
import { PageHeader, QueryState } from '@/features/catalog/components/CatalogUi'
import { formatCurrency } from '@/shared/lib/utils'

export function BookProviderPage() {
  const { id = '' } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { data: provider, isLoading, error } = useProvider(id)
  const createBooking = useCreateBooking()

  const preselectedService = searchParams.get('service') ?? ''

  const [serviceId, setServiceId] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [durationHours, setDurationHours] = useState('2')
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState('')

  const selectedServiceId = serviceId || preselectedService
  const selectedService = provider?.services.find((s) => s.serviceId === selectedServiceId)

  const duration = Number(durationHours) || 1
  const totalPrice = selectedService
    ? Math.max(selectedService.priceFrom, (provider?.hourlyRate ?? 0) * duration)
    : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!selectedServiceId) {
      setFormError('Please select a service.')
      return
    }
    if (!scheduledAt) {
      setFormError('Please choose a date and time.')
      return
    }

    try {
      const booking = await createBooking.mutateAsync({
        providerId: id,
        serviceId: selectedServiceId,
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationHours: duration,
        addressLine1,
        addressLine2: addressLine2 || undefined,
        postalCode,
        notes: notes || undefined,
        totalPrice,
      })
      navigate(`/dashboard/bookings/${booking.id}`)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Booking failed')
    }
  }

  return (
    <div>
      <QueryState loading={isLoading} error={error} empty={!provider}>
        {provider && (
          <>
            <PageHeader
              backTo={`/providers/${id}`}
              backLabel={provider.businessName}
              title="Book a service"
              description="Fill in the details below. The provider will confirm your booking."
            />

            <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                {formError && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                    {formError}
                  </p>
                )}

                <label className="block text-sm">
                  <span className="font-medium text-slate-700">Service</span>
                  <select
                    value={selectedServiceId}
                    onChange={(e) => setServiceId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                    required
                  >
                    <option value="">Select a service</option>
                    {provider.services.map((s) => (
                      <option key={s.serviceId} value={s.serviceId}>
                        {s.name} — from {formatCurrency(s.priceFrom)}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm">
                    <span className="font-medium text-slate-700">Date & time</span>
                    <input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                      required
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="font-medium text-slate-700">Duration (hours)</span>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      step={0.5}
                      value={durationHours}
                      onChange={(e) => setDurationHours(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                      required
                    />
                  </label>
                </div>

                <label className="block text-sm">
                  <span className="font-medium text-slate-700">Address line 1</span>
                  <input
                    type="text"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    placeholder="Block / street name"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                    required
                  />
                </label>

                <label className="block text-sm">
                  <span className="font-medium text-slate-700">Address line 2 (optional)</span>
                  <input
                    type="text"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    placeholder="Unit number"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  />
                </label>

                <label className="block text-sm">
                  <span className="font-medium text-slate-700">Postal code</span>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    pattern="\d{6}"
                    placeholder="123456"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                    required
                  />
                </label>

                <label className="block text-sm">
                  <span className="font-medium text-slate-700">Notes (optional)</span>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Access instructions, special requests…"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  />
                </label>
              </div>

              <aside className="h-fit rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="font-semibold text-slate-900">Summary</h2>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Provider</dt>
                    <dd className="font-medium">{provider.businessName}</dd>
                  </div>
                  {selectedService && (
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Service</dt>
                      <dd className="font-medium">{selectedService.name}</dd>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-100 pt-2">
                    <dt className="text-slate-500">Estimated total</dt>
                    <dd className="text-lg font-bold text-teal-700">
                      {formatCurrency(totalPrice)}
                    </dd>
                  </div>
                </dl>
                <p className="mt-3 text-xs text-slate-500">
                  Payment collection is not enabled in this MVP.
                </p>
                <button
                  type="submit"
                  disabled={createBooking.isPending || provider.services.length === 0}
                  className="mt-4 w-full rounded-lg bg-teal-700 py-2.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
                >
                  {createBooking.isPending ? 'Submitting…' : 'Request booking'}
                </button>
                {provider.services.length === 0 && (
                  <p className="mt-2 text-xs text-amber-700">
                    This provider has no services listed yet.
                  </p>
                )}
              </aside>
            </form>
          </>
        )}
      </QueryState>
    </div>
  )
}
