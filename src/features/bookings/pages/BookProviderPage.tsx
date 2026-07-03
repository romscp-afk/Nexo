import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthProvider'
import { useProvider } from '@/features/providers/hooks/useProviders'
import { useCreateBooking } from '@/features/bookings/hooks/useBookings'
import { PageHeader, QueryState } from '@/features/catalog/components/CatalogUi'
import { PriceBreakdownPanel } from '@/shared/components/PriceBreakdownPanel'
import { AirconBookingFields } from '@/shared/components/AirconBookingFields'
import { formatCurrency } from '@/shared/lib/utils'
import { buildPriceBreakdown, type CeilingHeight } from '@/shared/lib/pricing'
import { appendAirconBookingNotes } from '@/shared/lib/bookingNotes'
import { uploadBookingPhotos } from '@/shared/lib/bookingPhotos'
import { bookingService } from '@/shared/services/bookingService'
import { providerAvailabilityService } from '@/shared/services/providerAvailabilityService'
import { ADMIN_FEE_SGD } from '@/shared/lib/marketplaceConfig'
import { SINGAPORE_AREAS } from '@/shared/lib/constants'
import type { BookingPaymentMethod } from '@/shared/types/booking'

export function BookProviderPage() {
  const { id = '' } = useParams()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { data: provider, isLoading, error } = useProvider(id)
  const createBooking = useCreateBooking()

  const preselectedService = searchParams.get('service') ?? ''

  const [serviceId, setServiceId] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [durationHours, setDurationHours] = useState('2')
  const [quantity, setQuantity] = useState('1')
  const [ceilingHeight, setCeilingHeight] = useState<CeilingHeight>('normal')
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [serviceArea, setServiceArea] = useState('')
  const [notes, setNotes] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [paymentMethod, setPaymentMethod] = useState<BookingPaymentMethod>('paynow')
  const [formError, setFormError] = useState('')
  const [prefilled, setPrefilled] = useState(false)

  useEffect(() => {
    if (!user || prefilled) return
    if (user.addressLine1) setAddressLine1(user.addressLine1)
    if (user.addressLine2) setAddressLine2(user.addressLine2)
    if (user.postalCode) setPostalCode(user.postalCode)
    if (user.preferredArea) setServiceArea(user.preferredArea)
    setPrefilled(true)
  }, [user, prefilled])

  const selectedServiceId = serviceId || preselectedService
  const selectedService = provider?.services.find((s) => s.serviceId === selectedServiceId)
  const isPerUnit = selectedService?.pricingModel === 'per_unit'

  const duration = Number(durationHours) || 1
  const unitCount = Math.max(1, Number(quantity) || 1)

  const breakdown = useMemo(() => {
    if (!selectedService || !provider) return null
    return buildPriceBreakdown({
      pricingModel: selectedService.pricingModel,
      priceFrom: selectedService.priceFrom,
      hourlyRate: provider.hourlyRate,
      durationHours: duration,
      quantity: unitCount,
      unitPrices: selectedService.unitPrices,
      ceilingHeight: isPerUnit ? ceilingHeight : undefined,
    })
  }, [selectedService, provider, duration, unitCount, ceilingHeight, isPerUnit])

  useEffect(() => {
    if (preselectedService && !serviceId) {
      setServiceId(preselectedService)
    }
  }, [preselectedService, serviceId])

  useEffect(() => {
    if (!isPerUnit) {
      setCeilingHeight('normal')
      setQuantity('1')
    }
  }, [selectedServiceId, isPerUnit])

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
    if (!breakdown) {
      setFormError('Unable to calculate price.')
      return
    }

    const slotCheck = await providerAvailabilityService.checkSlot(
      id,
      new Date(scheduledAt).toISOString(),
      isPerUnit ? 1 : duration,
    )
    if (slotCheck.error || !slotCheck.data?.ok) {
      setFormError(slotCheck.data?.reason ?? slotCheck.error ?? 'Time slot not available.')
      return
    }

    try {
      const booking = await createBooking.mutateAsync({
        providerId: id,
        serviceId: selectedServiceId,
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationHours: isPerUnit ? 1 : duration,
        quantity: isPerUnit ? unitCount : null,
        addressLine1,
        addressLine2: addressLine2 || undefined,
        postalCode,
        paymentMethod,
        notes: appendAirconBookingNotes({
          serviceArea: serviceArea || undefined,
          notes: notes || undefined,
          quantity: isPerUnit ? unitCount : undefined,
          ceilingHeight: isPerUnit ? ceilingHeight : undefined,
        }),
        totalPrice: breakdown.total,
        serviceSubtotal: breakdown.serviceSubtotal,
        platformFee: breakdown.platformFee,
        pricingSnapshot: breakdown,
      })
      if (photos.length > 0) {
        try {
          const urls = await uploadBookingPhotos(photos, booking.id)
          await bookingService.addPhotos(booking.id, urls)
        } catch {
          // Photos optional — booking still created
        }
      }
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
                        {s.pricingModel === 'per_unit' ? '/unit' : ''}
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
                  {!isPerUnit && (
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
                  )}
                </div>

                {isPerUnit && (
                  <AirconBookingFields
                    quantity={quantity}
                    onQuantityChange={setQuantity}
                    ceilingHeight={ceilingHeight}
                    onCeilingHeightChange={setCeilingHeight}
                    unitLabel={selectedService?.unitLabel ?? 'unit'}
                  />
                )}

                <fieldset className="rounded-xl border border-slate-200 p-4">
                  <legend className="px-1 text-sm font-medium text-slate-700">Payment</legend>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <label className={`cursor-pointer rounded-lg border p-3 text-sm ${paymentMethod === 'paynow' ? 'border-nexo-500 bg-nexo-50' : ''}`}>
                      <input type="radio" checked={paymentMethod === 'paynow'} onChange={() => setPaymentMethod('paynow')} className="mr-2" />
                      PayNow in advance
                    </label>
                    <label className={`cursor-pointer rounded-lg border p-3 text-sm ${paymentMethod === 'cash' ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-300' : ''}`}>
                      <input type="radio" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} className="mr-2" />
                      <span className="font-bold text-amber-900">Cash</span>
                    </label>
                  </div>
                </fieldset>

                <label className="block text-sm">
                  <span className="font-medium text-slate-700">Service area</span>
                  <select
                    value={serviceArea}
                    onChange={(e) => setServiceArea(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                    required
                  >
                    <option value="">Select area</option>
                    {SINGAPORE_AREAS.map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm">
                  <span className="font-medium text-slate-700">Block / street address</span>
                  <input
                    type="text"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    placeholder="Blk 123 Tampines Street 11"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                    required
                  />
                </label>

                <label className="block text-sm">
                  <span className="font-medium text-slate-700">Unit number</span>
                  <input
                    type="text"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    placeholder="#08-456"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                    required
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
                  <span className="font-medium text-slate-700">Photos (optional)</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setPhotos(Array.from(e.target.files ?? []))}
                    className="mt-1 w-full text-sm text-slate-600"
                  />
                  <p className="mt-1 text-xs text-slate-500">Upload photos of the job site or units (e.g. aircon).</p>
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
                <h2 className="font-semibold text-slate-900">Price breakdown</h2>
                <dl className="mt-3 space-y-2 text-sm">
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
                </dl>
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <PriceBreakdownPanel breakdown={breakdown} paymentMethod={paymentMethod} compact />
                </div>
                {paymentMethod === 'cash' && (
                  <p className="mt-3 text-xs text-slate-500">
                    Provider pays {formatCurrency(ADMIN_FEE_SGD)} platform fee on cash jobs.
                  </p>
                )}
                <button
                  type="submit"
                  disabled={createBooking.isPending || provider.services.length === 0}
                  className="mt-4 w-full rounded-lg bg-nexo-700 py-2.5 text-sm font-medium text-white hover:bg-nexo-800 disabled:opacity-50"
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
