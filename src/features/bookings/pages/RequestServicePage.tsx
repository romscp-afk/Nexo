import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthProvider'
import { useCategory, useCategoryServices } from '@/features/catalog/hooks/useCategories'
import { useCreateBooking } from '@/features/bookings/hooks/useBookings'
import { PageHeader, QueryState } from '@/features/catalog/components/CatalogUi'
import { formatCurrency } from '@/shared/lib/utils'
import { SINGAPORE_AREAS } from '@/shared/lib/constants'
import { ADMIN_FEE_SGD } from '@/shared/lib/marketplaceConfig'
import type { BookingPaymentMethod } from '@/shared/types/booking'

export function RequestServicePage() {
  const { slug = '' } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: category, isLoading: catLoading, error: catError } = useCategory(slug)
  const { data: services, isLoading: svcLoading, error: svcError } = useCategoryServices(category?.id)
  const createBooking = useCreateBooking()

  const [serviceId, setServiceId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<BookingPaymentMethod>('paynow')
  const [scheduledAt, setScheduledAt] = useState('')
  const [durationHours, setDurationHours] = useState('2')
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [serviceArea, setServiceArea] = useState('')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (!user) return
    if (user.addressLine1) setAddressLine1(user.addressLine1)
    if (user.addressLine2) setAddressLine2(user.addressLine2)
    if (user.postalCode) setPostalCode(user.postalCode)
    if (user.preferredArea) setServiceArea(user.preferredArea)
  }, [user])

  const selectedService = services?.find((s) => s.id === serviceId)
  const duration = Number(durationHours) || 1
  const totalPrice = selectedService ? Math.max(selectedService.basePrice, selectedService.basePrice * (duration / 2)) : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!serviceId || !scheduledAt) {
      setFormError('Please select a service and time.')
      return
    }
    try {
      const booking = await createBooking.mutateAsync({
        serviceId,
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationHours: duration,
        addressLine1,
        addressLine2: addressLine2 || undefined,
        postalCode,
        paymentMethod,
        notes: notes
          ? serviceArea
            ? `Area: ${serviceArea}. ${notes}`
            : notes
          : serviceArea
            ? `Area: ${serviceArea}`
            : undefined,
        totalPrice,
      })
      navigate(`/dashboard/bookings/${booking.id}`)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Request failed')
    }
  }

  const loading = catLoading || svcLoading
  const error = catError ?? svcError

  return (
    <div>
      <QueryState loading={loading} error={error} empty={!category}>
        {category && (
          <>
            <PageHeader
              backTo={`/services/${slug}`}
              backLabel={category.name}
              title="Request a service"
              description={`Your request will be sent to all ${category.name.toLowerCase()} providers in your area.`}
            />

            <form onSubmit={handleSubmit} className="mt-6 grid gap-6 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                {formError && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>
                )}

                <label className="block text-sm">
                  <span className="font-medium text-slate-700">Service</span>
                  <select
                    value={serviceId}
                    onChange={(e) => setServiceId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                    required
                  >
                    <option value="">Select service</option>
                    {services?.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} — from {formatCurrency(s.basePrice)}
                      </option>
                    ))}
                  </select>
                </label>

                <fieldset className="rounded-xl border border-slate-200 p-4">
                  <legend className="px-1 text-sm font-medium text-slate-700">Payment method</legend>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <label className={`cursor-pointer rounded-lg border p-3 text-sm ${paymentMethod === 'paynow' ? 'border-nexo-500 bg-nexo-50' : 'border-slate-200'}`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="paynow"
                        checked={paymentMethod === 'paynow'}
                        onChange={() => setPaymentMethod('paynow')}
                        className="mr-2"
                      />
                      <span className="font-medium">PayNow (in advance)</span>
                      <p className="mt-1 text-xs text-slate-500">Pay online after a provider accepts.</p>
                    </label>
                    <label className={`cursor-pointer rounded-lg border p-3 text-sm ${paymentMethod === 'cash' ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-300' : 'border-slate-200'}`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash"
                        checked={paymentMethod === 'cash'}
                        onChange={() => setPaymentMethod('cash')}
                        className="mr-2"
                      />
                      <span className="font-bold text-amber-900">Cash on completion</span>
                      <p className="mt-1 text-xs text-amber-800">Provider pays {formatCurrency(ADMIN_FEE_SGD)} admin fee via PayNow.</p>
                    </label>
                  </div>
                </fieldset>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm">
                    <span className="font-medium text-slate-700">Date & time</span>
                    <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" required />
                  </label>
                  <label className="block text-sm">
                    <span className="font-medium text-slate-700">Duration (hours)</span>
                    <input type="number" min={1} max={12} step={0.5} value={durationHours} onChange={(e) => setDurationHours(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" required />
                  </label>
                </div>

                <label className="block text-sm">
                  <span className="font-medium text-slate-700">Area</span>
                  <select value={serviceArea} onChange={(e) => setServiceArea(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" required>
                    <option value="">Select area</option>
                    {SINGAPORE_AREAS.map((area) => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm">
                  <span className="font-medium text-slate-700">Address</span>
                  <input type="text" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" required />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-slate-700">Unit</span>
                  <input type="text" value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" required />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-slate-700">Postal code</span>
                  <input type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} pattern="\d{6}" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" required />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-slate-700">Notes</span>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
                </label>
              </div>

              <aside className="h-fit rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="font-semibold text-slate-900">Summary</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Broadcast to all <strong>{category.name}</strong> providers.
                </p>
                {selectedService && (
                  <p className="mt-3 text-sm">
                    Est. {formatCurrency(totalPrice)} · {paymentMethod === 'cash' ? 'Cash' : 'PayNow'}
                  </p>
                )}
                <button type="submit" disabled={createBooking.isPending} className="mt-4 w-full rounded-lg bg-nexo-700 py-2.5 text-sm font-medium text-white hover:bg-nexo-800 disabled:opacity-50">
                  {createBooking.isPending ? 'Sending…' : 'Send request to providers'}
                </button>
              </aside>
            </form>
          </>
        )}
      </QueryState>
    </div>
  )
}
