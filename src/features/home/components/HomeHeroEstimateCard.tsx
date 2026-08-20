import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  ChevronDown,
  Clock,
  Minus,
  Plus,
  Sparkles,
} from 'lucide-react'
import {
  CLEANING_TYPES,
  MIN_BOOKING_HOURS,
  getCleaningHourlyRateForDuration,
} from '@/shared/lib/cleaningContent'
import { buildPriceBreakdown } from '@/shared/lib/pricing'
import { saveCleaningDraft } from '@/shared/lib/bookingDraft'
import {
  buildCleaningScheduledAt,
  formatCleaningTimeRange,
  getCleaningStartHours,
} from '@/shared/lib/cleaningSchedule'
import { formatCurrency, cn } from '@/shared/lib/utils'
import { trackEvent } from '@/shared/lib/analytics'

/** Minimum selectable date = tomorrow in Asia/Singapore. */
function singaporeTomorrowIso(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Singapore',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const y = Number(parts.find((p) => p.type === 'year')?.value)
  const m = Number(parts.find((p) => p.type === 'month')?.value)
  const d = Number(parts.find((p) => p.type === 'day')?.value)
  const tomorrow = new Date(Date.UTC(y, m - 1, d + 1))
  const yy = tomorrow.getUTCFullYear()
  const mm = String(tomorrow.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(tomorrow.getUTCDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

function BookField({
  icon: Icon,
  children,
  className,
  invalid,
}: {
  icon: typeof Sparkles
  children: React.ReactNode
  className?: string
  invalid?: boolean
}) {
  return (
    <div
      className={cn(
        'flex h-12 items-center gap-3 rounded-xl border bg-white px-3',
        invalid ? 'border-red-400' : 'border-brand-border',
        className,
      )}
    >
      <Icon className="h-[18px] w-[18px] shrink-0 text-brand-primary" strokeWidth={2} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

function CounterRow({
  label,
  value,
  onDecrease,
  onIncrease,
  min = 1,
  max = 5,
}: {
  label: string
  value: number
  onDecrease: () => void
  onIncrease: () => void
  min?: number
  max?: number
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-brand-border bg-white px-4 py-3">
      <span className="text-sm font-medium text-brand-text">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onDecrease}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-brand-border text-brand-text-secondary transition hover:bg-brand-bg disabled:opacity-40"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="min-w-[1.25rem] text-center text-sm font-semibold text-brand-text">
          {value}
        </span>
        <button
          type="button"
          onClick={onIncrease}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-brand-border text-brand-text-secondary transition hover:bg-brand-bg disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

type FieldErrors = {
  date?: string
  startHour?: string
}

export function HomeHeroEstimateCard() {
  const navigate = useNavigate()
  const standardType = CLEANING_TYPES.find((t) => t.supported) ?? CLEANING_TYPES[0]
  const [bedrooms, setBedrooms] = useState(2)
  const [bathrooms, setBathrooms] = useState(2)
  const [duration, setDuration] = useState<number>(MIN_BOOKING_HOURS)
  const [date, setDate] = useState('')
  const [startHour, setStartHour] = useState<number | null>(null)
  const [errors, setErrors] = useState<FieldErrors>({})
  const dateRef = useRef<HTMLInputElement>(null)
  const timeRef = useRef<HTMLSelectElement>(null)
  const alertRef = useRef<HTMLDivElement>(null)

  const minDate = singaporeTomorrowIso()
  const hourlyRate = getCleaningHourlyRateForDuration(duration)

  const breakdown = useMemo(
    () =>
      buildPriceBreakdown({
        pricingModel: 'hourly',
        priceFrom: hourlyRate * duration,
        hourlyRate,
        durationHours: duration,
        quantity: 1,
      }),
    [duration, hourlyRate],
  )

  const validate = (): FieldErrors => {
    const next: FieldErrors = {}
    if (!date) {
      next.date = 'Select your preferred cleaning date.'
    } else if (date < minDate) {
      next.date = 'Choose a future date.'
    }
    if (startHour == null) {
      next.startHour = 'Select your preferred start time.'
    }
    return next
  }

  const handleContinue = () => {
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      const first = nextErrors.date ? dateRef.current : timeRef.current
      first?.focus()
      alertRef.current?.focus()
      return
    }

    const scheduledAt = buildCleaningScheduledAt(date, startHour as number)

    saveCleaningDraft({
      version: 1,
      cleaningTypeId: standardType.id,
      serviceId: '',
      propertyType: 'HDB',
      bedrooms,
      bathrooms,
      supplies: 'customer',
      scheduledAt,
      durationHours: duration,
      serviceArea: '',
      addressLine1: '',
      addressLine2: '',
      postalCode: '',
      notes: '',
      paymentMethod: 'paynow',
      step: 3,
      updatedAt: new Date().toISOString(),
    })

    trackEvent('request_cleaning_clicked', { source: 'hero_estimate' })
    navigate('/services/cleaning/request')
  }

  const alertMessage = [errors.date, errors.startHour].filter(Boolean).join(' ')

  return (
    <div className="rounded-card-lg border border-brand-border/80 bg-white p-5 shadow-[0_8px_40px_-12px_rgba(37,99,235,0.25)] sm:p-6">
      <h2 className="text-lg font-bold text-brand-navy">Book a Cleaning</h2>

      <div
        ref={alertRef}
        tabIndex={-1}
        role="alert"
        aria-live="assertive"
        className={cn('mt-3 text-sm text-red-700', !alertMessage && 'sr-only')}
      >
        {alertMessage || ''}
      </div>

      <div className="mt-5 space-y-3">
        <BookField icon={Sparkles}>
          <div className="relative flex items-center">
            <select
              className="w-full appearance-none bg-transparent pr-6 text-sm font-medium text-brand-text focus:outline-none"
              defaultValue={standardType.id}
              aria-label="Service type"
            >
              <option value={standardType.id}>{standardType.label}</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-0 h-4 w-4 text-brand-text-muted" />
          </div>
        </BookField>

        <BookField icon={Clock}>
          <div className="relative flex items-center">
            <select
              value={duration}
              onChange={(e) => {
                const next = Number(e.target.value)
                setDuration(next)
                const hours = getCleaningStartHours(next)
                if (startHour != null && !hours.includes(startHour)) {
                  setStartHour(null)
                }
              }}
              className="w-full appearance-none bg-transparent pr-6 text-sm font-medium text-brand-text focus:outline-none"
              aria-label="Duration"
            >
              {[2, 3, 4].map((h) => (
                <option key={h} value={h}>
                  {h} hours · {formatCurrency(getCleaningHourlyRateForDuration(h))}/hr
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-0 h-4 w-4 text-brand-text-muted" />
          </div>
        </BookField>

        <div>
          <BookField icon={Calendar} invalid={Boolean(errors.date)}>
            <input
              ref={dateRef}
              id="hero-preferred-date"
              type="date"
              min={minDate}
              value={date}
              onChange={(e) => {
                setDate(e.target.value)
                setErrors((prev) => ({ ...prev, date: undefined }))
              }}
              className={cn(
                'w-full bg-transparent text-sm font-medium text-brand-text focus:outline-none',
                '[&::-webkit-calendar-picker-indicator]:cursor-pointer',
                !date && 'text-brand-text-muted',
              )}
              aria-label="Preferred date"
              aria-invalid={Boolean(errors.date)}
              aria-describedby={errors.date ? 'hero-date-error' : undefined}
              required
            />
          </BookField>
          {errors.date && (
            <p id="hero-date-error" className="mt-1 px-1 text-xs text-red-600">
              {errors.date}
            </p>
          )}
        </div>

        <div>
          <BookField icon={Clock} invalid={Boolean(errors.startHour)}>
            <div className="relative flex items-center">
              <select
                ref={timeRef}
                id="hero-start-time"
                value={startHour ?? ''}
                onChange={(e) => {
                  const v = e.target.value
                  setStartHour(v === '' ? null : Number(v))
                  setErrors((prev) => ({ ...prev, startHour: undefined }))
                }}
                className="w-full appearance-none bg-transparent pr-6 text-sm font-medium text-brand-text focus:outline-none"
                aria-label="Start time"
                aria-invalid={Boolean(errors.startHour)}
                aria-describedby={errors.startHour ? 'hero-time-error' : undefined}
                required
              >
                <option value="">Select start time</option>
                {getCleaningStartHours(duration).map((h) => (
                  <option key={h} value={h}>
                    {formatCleaningTimeRange(h, duration)}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-0 h-4 w-4 text-brand-text-muted" />
            </div>
          </BookField>
          {errors.startHour && (
            <p id="hero-time-error" className="mt-1 px-1 text-xs text-red-600">
              {errors.startHour}
            </p>
          )}
        </div>

        <CounterRow
          label="Bedrooms"
          value={bedrooms}
          onDecrease={() => setBedrooms((n) => Math.max(1, n - 1))}
          onIncrease={() => setBedrooms((n) => Math.min(5, n + 1))}
          max={5}
        />
        <CounterRow
          label="Bathrooms"
          value={bathrooms}
          onDecrease={() => setBathrooms((n) => Math.max(1, n - 1))}
          onIncrease={() => setBathrooms((n) => Math.min(4, n + 1))}
          max={4}
        />

        <div className="flex items-center justify-between border-t border-brand-border pt-4">
          <span className="text-sm font-medium text-brand-text-secondary">Estimated total</span>
          <span className="text-xl font-bold text-brand-primary">{formatCurrency(breakdown.total)}</span>
        </div>

        <button
          type="button"
          onClick={handleContinue}
          className="flex h-12 w-full items-center justify-center rounded-xl bg-brand-primary text-sm font-semibold text-white transition hover:bg-brand-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
        >
          Book Now
        </button>
      </div>
    </div>
  )
}
