import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '@/features/auth/context/AuthProvider'
import { useCategory, useCategoryServices } from '@/features/catalog/hooks/useCategories'
import { useCreateBooking } from '@/features/bookings/hooks/useBookings'
import { PageHeader, QueryState } from '@/features/catalog/components/CatalogUi'
import { PriceBreakdownPanel } from '@/shared/components/PriceBreakdownPanel'
import { CleaningPriceLabel } from '@/shared/components/CleaningPriceLabel'
import { formatCurrency } from '@/shared/lib/utils'
import { getCleaningCatalogHourlyRate } from '@/shared/hooks/useCleaningPricing'
import { PRIMARY_CATEGORY_SLUG } from '@/shared/lib/catalogConfig'
import { buildPriceBreakdown } from '@/shared/lib/pricing'
import { appendCleaningBookingNotes } from '@/shared/lib/bookingNotes'
import { PLATFORM_FEE_SGD } from '@/shared/lib/marketplaceConfig'
import { SINGAPORE_AREAS } from '@/shared/lib/constants'
import {
  BOOKING_CONFIRMATION,
  CLEANING_SUPPLIES_SURCHARGE_SGD,
  CLEANING_TYPES,
  MIN_BOOKING_HOURS,
  PROPERTY_TYPES,
  SUPPLY_OPTIONS,
} from '@/shared/lib/cleaningContent'
import {
  buildCleaningScheduledAt,
  CLEANING_BOOKING_DURATIONS,
  formatCleaningHourLabel,
  formatCleaningScheduleSummary,
  formatCleaningTimeRange,
  getCleaningStartHours,
  isCleaningBookingDuration,
  minCleaningScheduleDate,
  parseCleaningScheduledAt,
} from '@/shared/lib/cleaningSchedule'
import {
  clearCleaningDraft,
  loadCleaningDraft,
  saveCleaningDraft,
  type CleaningRequestDraft,
} from '@/shared/lib/bookingDraft'
import { trackEvent } from '@/shared/lib/analytics'
import { recordPwaEngagement } from '@/shared/lib/pwaEngagement'
import type { BookingPaymentMethod } from '@/shared/types/booking'

const STEPS = [
  'Cleaning type',
  'Property details',
  'Schedule',
  'Location',
  'Review',
] as const

const TOTAL_STEPS = STEPS.length

function StepProgress({ step }: { step: number }) {
  return (
    <nav aria-label="Booking progress" className="mb-8">
      <ol className="flex flex-wrap gap-2">
        {STEPS.map((label, i) => {
          const n = i + 1
          const active = n === step
          const done = n < step
          return (
            <li
              key={label}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                active
                  ? 'bg-nexo-700 text-white'
                  : done
                    ? 'bg-nexo-100 text-nexo-800'
                    : 'bg-slate-100 text-slate-500'
              }`}
              aria-current={active ? 'step' : undefined}
            >
              <span className="sr-only">Step {n}:</span> {label}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export function CleaningRequestPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const createBooking = useCreateBooking()
  const confirmedRef = useRef(false)
  const startedRef = useRef(false)

  const { data: category, isLoading: catLoading, error: catError } = useCategory(PRIMARY_CATEGORY_SLUG)
  const { data: services, isLoading: svcLoading, error: svcError } = useCategoryServices(category?.id)

  const [step, setStep] = useState(1)
  const [cleaningTypeId, setCleaningTypeId] = useState('standard')
  const [propertyType, setPropertyType] = useState('')
  const [bedrooms, setBedrooms] = useState('2')
  const [bathrooms, setBathrooms] = useState('1')
  const [supplies, setSupplies] = useState<'customer' | 'cleaner'>('customer')
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleStartHour, setScheduleStartHour] = useState<number | null>(null)
  const [durationHours, setDurationHours] = useState<string>('2')
  const [serviceArea, setServiceArea] = useState('')
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [notes, setNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<BookingPaymentMethod>('paynow')
  const [fieldError, setFieldError] = useState('')
  const [submitError, setSubmitError] = useState('')

  const selectedType = CLEANING_TYPES.find((t) => t.id === cleaningTypeId)
  const selectedService = useMemo(() => {
    if (!services?.length || !selectedType?.serviceSlug) return null
    return services.find((s) => s.slug === selectedType.serviceSlug) ?? services[0]
  }, [services, selectedType])

  const duration = Number(durationHours) || MIN_BOOKING_HOURS
  const validStartHours = useMemo(() => getCleaningStartHours(duration), [duration])

  const scheduledAt = useMemo(() => {
    if (!scheduleDate || scheduleStartHour == null) return ''
    return buildCleaningScheduledAt(scheduleDate, scheduleStartHour)
  }, [scheduleDate, scheduleStartHour])

  const suppliesSurcharge = supplies === 'cleaner' ? CLEANING_SUPPLIES_SURCHARGE_SGD : 0

  const breakdown = useMemo(() => {
    if (!selectedService) return null
    const hourlyRate = getCleaningCatalogHourlyRate(selectedService.basePrice)
    const extraLines =
      suppliesSurcharge > 0
        ? [{ label: 'Cleaning supplies (cleaner brings)', amount: suppliesSurcharge }]
        : undefined
    return buildPriceBreakdown({
      pricingModel: selectedService.pricingModel,
      priceFrom: hourlyRate,
      hourlyRate,
      durationHours: duration,
      quantity: 1,
      unitPrices: {},
      extraLines,
    })
  }, [selectedService, duration, suppliesSurcharge])

  const restoreDraft = useCallback((draft: CleaningRequestDraft) => {
    setCleaningTypeId(draft.cleaningTypeId)
    setPropertyType(draft.propertyType)
    setBedrooms(String(draft.bedrooms))
    setBathrooms(String(draft.bathrooms))
    setSupplies(draft.supplies)
    const parsedSchedule = parseCleaningScheduledAt(draft.scheduledAt)
    setScheduleDate(parsedSchedule.date)
    setScheduleStartHour(parsedSchedule.startHour)
    setDurationHours(
      isCleaningBookingDuration(draft.durationHours)
        ? String(draft.durationHours)
        : String(MIN_BOOKING_HOURS),
    )
    setServiceArea(draft.serviceArea)
    setAddressLine1(draft.addressLine1)
    setAddressLine2(draft.addressLine2)
    setPostalCode(draft.postalCode)
    setNotes(draft.notes)
    setPaymentMethod(draft.paymentMethod)
    setStep(Math.min(draft.step, TOTAL_STEPS))
  }, [])

  useEffect(() => {
    const draft = loadCleaningDraft()
    if (draft) restoreDraft(draft)
    if (!startedRef.current) {
      startedRef.current = true
      trackEvent('cleaning_request_started')
    }
  }, [restoreDraft])

  useEffect(() => {
    if (!user) return
    if (user.addressLine1 && !addressLine1) setAddressLine1(user.addressLine1)
    if (user.addressLine2 && !addressLine2) setAddressLine2(user.addressLine2)
    if (user.postalCode && !postalCode) setPostalCode(user.postalCode)
    if (user.preferredArea && !serviceArea) setServiceArea(user.preferredArea)
  }, [user, addressLine1, addressLine2, postalCode, serviceArea])

  useEffect(() => {
    if (!selectedService) return
    saveCleaningDraft({
      version: 1,
      cleaningTypeId,
      serviceId: selectedService.id,
      propertyType,
      bedrooms: Number(bedrooms) || 0,
      bathrooms: Number(bathrooms) || 1,
      supplies,
      scheduledAt,
      durationHours: duration,
      serviceArea,
      addressLine1,
      addressLine2,
      postalCode,
      notes,
      paymentMethod,
      step,
      updatedAt: new Date().toISOString(),
    })
  }, [
    cleaningTypeId,
    selectedService,
    propertyType,
    bedrooms,
    bathrooms,
    supplies,
    scheduledAt,
    duration,
    serviceArea,
    addressLine1,
    addressLine2,
    postalCode,
    notes,
    paymentMethod,
    step,
  ])

  useEffect(() => {
    return () => {
      if (!confirmedRef.current && step > 1 && step < TOTAL_STEPS) {
        trackEvent('booking_flow_abandoned', { step })
      }
    }
  }, [step])

  const persistAndGoLogin = () => {
    trackEvent('cleaning_request_login_required', { step })
    navigate('/login', { state: { from: { pathname: '/services/cleaning/request' } } })
  }

  const validateStep = (s: number): boolean => {
    setFieldError('')
    if (s === 1) {
      const type = CLEANING_TYPES.find((t) => t.id === cleaningTypeId)
      if (!type?.supported) {
        setFieldError('Please select a supported cleaning type.')
        return false
      }
      return true
    }
    if (s === 2) {
      if (!propertyType) {
        setFieldError('Select a property type.')
        return false
      }
      return true
    }
    if (s === 3) {
      if (!scheduleDate) {
        setFieldError('Choose a preferred date.')
        return false
      }
      if (!isCleaningBookingDuration(duration)) {
        setFieldError('Select a booking duration (2, 3 or 4 hours).')
        return false
      }
      if (scheduleStartHour == null) {
        setFieldError('Select a start time.')
        return false
      }
      if (!scheduledAt) {
        setFieldError('Choose a valid date and time.')
        return false
      }
      if (new Date(scheduledAt) <= new Date()) {
        setFieldError('Please pick a future date and time.')
        return false
      }
      return true
    }
    if (s === 4) {
      if (!/^\d{6}$/.test(postalCode.trim())) {
        setFieldError('Enter a valid 6-digit postal code.')
        return false
      }
      if (!serviceArea) {
        setFieldError('Select your area.')
        return false
      }
      if (!addressLine1.trim()) {
        setFieldError('Enter your address.')
        return false
      }
      return true
    }
    return true
  }

  const goNext = () => {
    if (!validateStep(step)) return
    trackEvent('cleaning_request_step_completed', { step })
    setStep((s) => Math.min(s + 1, TOTAL_STEPS))
  }

  const goBack = () => {
    setFieldError('')
    setStep((s) => Math.max(s - 1, 1))
  }

  const handleConfirm = async () => {
    setSubmitError('')
    if (!validateStep(4) || !selectedService || !breakdown) {
      setSubmitError('Complete all required fields before confirming.')
      return
    }
    if (!user) {
      persistAndGoLogin()
      return
    }
    if (createBooking.isPending || confirmedRef.current) return

    try {
      const booking = await createBooking.mutateAsync({
        serviceId: selectedService.id,
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationHours: duration,
        quantity: null,
        addressLine1,
        addressLine2: addressLine2 || undefined,
        postalCode,
        paymentMethod,
        notes: appendCleaningBookingNotes({
          propertyType,
          bedrooms: Number(bedrooms) || 0,
          bathrooms: Number(bathrooms) || 1,
          supplies: supplies === 'customer' ? 'Customer provides' : 'Cleaner brings',
          serviceArea,
          notes: notes || undefined,
        }),
        totalPrice: breakdown.total,
        serviceSubtotal: breakdown.serviceSubtotal,
        platformFee: breakdown.platformFee,
        pricingSnapshot: breakdown,
      })
      confirmedRef.current = true
      clearCleaningDraft()
      recordPwaEngagement()
      trackEvent('cleaning_request_confirmed')
      navigate(`/dashboard/bookings/${booking.id}`)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Request failed')
    }
  }

  const loading = catLoading || svcLoading
  const error = catError ?? svcError

  if (!loading && !category) {
    return <Navigate to="/" replace />
  }

  return (
    <div>
      <QueryState loading={loading} error={error} empty={!category}>
        {category && (
          <>
            <PageHeader
              backTo={`/services/${PRIMARY_CATEGORY_SLUG}`}
              backLabel="Cleaning services"
              title="Request a cleaning"
              description="Tell us what you need — sign in only when you are ready to submit."
            />

            <StepProgress step={step} />

            {fieldError && (
              <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {fieldError}
              </p>
            )}
            {submitError && (
              <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {submitError}
              </p>
            )}

            <div className="grid gap-8 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                {step === 1 && (
                  <fieldset className="space-y-3">
                    <legend className="text-sm font-medium text-slate-900">Cleaning type</legend>
                    {CLEANING_TYPES.map((type) => (
                      <label
                        key={type.id}
                        className={`flex cursor-pointer flex-col rounded-xl border p-4 ${
                          cleaningTypeId === type.id
                            ? 'border-nexo-500 bg-nexo-50'
                            : 'border-slate-200 bg-white'
                        } ${!type.supported ? 'opacity-70' : ''}`}
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="cleaningType"
                            value={type.id}
                            checked={cleaningTypeId === type.id}
                            onChange={() => setCleaningTypeId(type.id)}
                            disabled={!type.supported}
                            className="text-nexo-600"
                          />
                          <span className="font-medium text-slate-900">{type.label}</span>
                          {!type.supported && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                              Coming soon
                            </span>
                          )}
                        </span>
                        <span className="mt-1 pl-6 text-sm text-slate-600">{type.description}</span>
                      </label>
                    ))}
                  </fieldset>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <label className="block text-sm">
                      <span className="font-medium text-slate-700">Property type</span>
                      <select
                        value={propertyType}
                        onChange={(e) => setPropertyType(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5"
                        required
                      >
                        <option value="">Select property type</option>
                        {PROPERTY_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block text-sm">
                        <span className="font-medium text-slate-700">Bedrooms</span>
                        <input
                          type="number"
                          min={0}
                          max={10}
                          value={bedrooms}
                          onChange={(e) => setBedrooms(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5"
                        />
                      </label>
                      <label className="block text-sm">
                        <span className="font-medium text-slate-700">Bathrooms</span>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={bathrooms}
                          onChange={(e) => setBathrooms(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5"
                        />
                      </label>
                    </div>
                    <fieldset className="space-y-2">
                      <legend className="text-sm font-medium text-slate-700">Cleaning supplies</legend>
                      {SUPPLY_OPTIONS.map((opt) => (
                        <label
                          key={opt.value}
                          className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm ${
                            supplies === opt.value ? 'border-nexo-500 bg-nexo-50' : 'border-slate-200'
                          }`}
                        >
                          <input
                            type="radio"
                            name="supplies"
                            value={opt.value}
                            checked={supplies === opt.value}
                            onChange={() => setSupplies(opt.value)}
                            className="mt-0.5"
                          />
                          <span>
                            {opt.label}
                            {opt.surcharge > 0 && (
                              <span className="mt-0.5 block text-xs font-medium text-nexo-700">
                                +{formatCurrency(opt.surcharge)} added to your estimate
                              </span>
                            )}
                          </span>
                        </label>
                      ))}
                    </fieldset>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6">
                    <fieldset className="space-y-3">
                      <legend className="text-sm font-medium text-slate-900">How long do you need?</legend>
                      <div className="grid gap-2 sm:grid-cols-3">
                        {CLEANING_BOOKING_DURATIONS.map((hours) => (
                          <label
                            key={hours}
                            className={`flex cursor-pointer flex-col items-center rounded-xl border p-4 text-center ${
                              durationHours === String(hours)
                                ? 'border-nexo-500 bg-nexo-50'
                                : 'border-slate-200 bg-white'
                            }`}
                          >
                            <input
                              type="radio"
                              name="durationHours"
                              value={hours}
                              checked={durationHours === String(hours)}
                              onChange={() => {
                                setDurationHours(String(hours))
                                setScheduleStartHour((current) => {
                                  if (current == null) return current
                                  return getCleaningStartHours(hours).includes(current) ? current : null
                                })
                              }}
                              className="sr-only"
                            />
                            <span className="text-2xl font-bold text-nexo-800">{hours}</span>
                            <span className="text-sm text-slate-600">hours</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>

                    <label className="block text-sm">
                      <span className="font-medium text-slate-700">Preferred date</span>
                      <input
                        type="date"
                        value={scheduleDate}
                        min={minCleaningScheduleDate()}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5"
                        required
                      />
                    </label>

                    {isCleaningBookingDuration(duration) && (
                      <fieldset className="space-y-3">
                        <legend className="text-sm font-medium text-slate-900">
                          Start time <span className="font-normal text-slate-500">(7 AM – 7 PM)</span>
                        </legend>
                        <p className="text-xs text-slate-500">
                          {duration}-hour booking
                          {scheduleStartHour != null
                            ? ` · finishes ${formatCleaningTimeRange(scheduleStartHour, duration).split(' – ')[1]}`
                            : ' · pick a start time below'}
                        </p>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                          {validStartHours.map((hour) => (
                            <label
                              key={hour}
                              className={`cursor-pointer rounded-lg border px-3 py-2.5 text-center text-sm ${
                                scheduleStartHour === hour
                                  ? 'border-nexo-500 bg-nexo-50 font-medium text-nexo-900'
                                  : 'border-slate-200 text-slate-700 hover:border-slate-300'
                              }`}
                            >
                              <input
                                type="radio"
                                name="scheduleStartHour"
                                value={hour}
                                checked={scheduleStartHour === hour}
                                onChange={() => setScheduleStartHour(hour)}
                                className="sr-only"
                              />
                              {formatCleaningHourLabel(hour)}
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    )}
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-4">
                    <label className="block text-sm">
                      <span className="font-medium text-slate-700">Postal code</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="\d{6}"
                        maxLength={6}
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5"
                        required
                        autoComplete="postal-code"
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="font-medium text-slate-700">Area</span>
                      <select
                        value={serviceArea}
                        onChange={(e) => setServiceArea(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5"
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
                      <span className="font-medium text-slate-700">Address</span>
                      <input
                        type="text"
                        value={addressLine1}
                        onChange={(e) => setAddressLine1(e.target.value)}
                        placeholder="Block / street"
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5"
                        required
                        autoComplete="street-address"
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="font-medium text-slate-700">Unit (optional)</span>
                      <input
                        type="text"
                        value={addressLine2}
                        onChange={(e) => setAddressLine2(e.target.value)}
                        placeholder="#08-456"
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5"
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="font-medium text-slate-700">Additional instructions</span>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5"
                        placeholder="Access codes, pets, focus areas…"
                      />
                    </label>
                  </div>
                )}

                {step === 5 && (
                  <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 text-sm">
                    <h2 className="font-semibold text-slate-900">Review your request</h2>
                    <dl className="space-y-3">
                      <div>
                        <dt className="text-slate-500">Service</dt>
                        <dd className="font-medium text-slate-900">{selectedType?.label}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Property</dt>
                        <dd className="text-slate-900">
                          {propertyType} · {bedrooms} bed · {bathrooms} bath ·{' '}
                          {supplies === 'customer'
                            ? 'You provide supplies'
                            : `Cleaner brings supplies (+${formatCurrency(CLEANING_SUPPLIES_SURCHARGE_SGD)})`}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Schedule</dt>
                        <dd className="text-slate-900">
                          {formatCleaningScheduleSummary(scheduledAt, duration)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Location</dt>
                        <dd className="text-slate-900">
                          {addressLine1}
                          {addressLine2 ? `, ${addressLine2}` : ''}, {postalCode} · {serviceArea}
                        </dd>
                      </div>
                    </dl>

                    <fieldset className="rounded-xl border border-slate-200 p-4">
                      <legend className="px-1 text-sm font-medium text-slate-700">Payment method</legend>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        <label
                          className={`cursor-pointer rounded-lg border p-3 text-sm ${
                            paymentMethod === 'paynow' ? 'border-nexo-500 bg-nexo-50' : 'border-slate-200'
                          }`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="paynow"
                            checked={paymentMethod === 'paynow'}
                            onChange={() => setPaymentMethod('paynow')}
                            className="mr-2"
                          />
                          PayNow (after acceptance)
                        </label>
                        <label
                          className={`cursor-pointer rounded-lg border p-3 text-sm ${
                            paymentMethod === 'cash' ? 'border-amber-500 bg-amber-50' : 'border-slate-200'
                          }`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="cash"
                            checked={paymentMethod === 'cash'}
                            onChange={() => setPaymentMethod('cash')}
                            className="mr-2"
                          />
                          Cash on completion
                        </label>
                      </div>
                    </fieldset>

                    <p className="rounded-lg bg-nexo-50 px-3 py-2 text-xs text-nexo-900">
                      {BOOKING_CONFIRMATION}
                    </p>

                    {!user && (
                      <p className="text-slate-600">
                        Sign in or create an account to submit. Your details above will be saved.
                      </p>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-3 pt-2">
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={goBack}
                      className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nexo-600"
                    >
                      <ChevronLeft className="h-4 w-4" aria-hidden />
                      Back
                    </button>
                  )}
                  {step < TOTAL_STEPS ? (
                    <button
                      type="button"
                      onClick={goNext}
                      className="inline-flex min-h-11 flex-1 items-center justify-center gap-1 rounded-lg bg-nexo-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-nexo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nexo-600 sm:flex-none"
                    >
                      Continue
                      <ChevronRight className="h-4 w-4" aria-hidden />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleConfirm()}
                      disabled={createBooking.isPending}
                      className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-nexo-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-nexo-800 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nexo-600 sm:flex-none"
                    >
                      {createBooking.isPending
                        ? 'Submitting…'
                        : user
                          ? 'Confirm request'
                          : 'Sign in to confirm'}
                    </button>
                  )}
                </div>
              </div>

              <aside className="h-fit rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="font-semibold text-slate-900">Price estimate</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Based on catalog rate · final price may vary by cleaner
                </p>
                <div className="mt-3">
                  <CleaningPriceLabel showDetail className="text-sm font-medium text-nexo-800" />
                </div>
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <PriceBreakdownPanel breakdown={breakdown} paymentMethod={paymentMethod} compact />
                </div>
                {paymentMethod === 'cash' && (
                  <p className="mt-2 text-xs text-amber-800">
                    Cash bookings: pay {formatCurrency(PLATFORM_FEE_SGD)} platform fee via PayNow before the job.
                    Pay the cleaner in cash on completion.
                  </p>
                )}
                <Link
                  to={`/providers/category/${PRIMARY_CATEGORY_SLUG}`}
                  className="mt-4 block text-center text-sm font-medium text-nexo-700 hover:underline"
                >
                  Or find a specific cleaner
                </Link>
              </aside>
            </div>
          </>
        )}
      </QueryState>
    </div>
  )
}
