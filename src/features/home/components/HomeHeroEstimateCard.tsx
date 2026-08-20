import { useMemo, useState } from 'react'
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

function BookField({
  icon: Icon,
  children,
  className,
}: {
  icon: typeof Sparkles
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex h-12 items-center gap-3 rounded-xl border border-brand-border bg-white px-3',
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
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-border text-brand-text-secondary transition hover:bg-brand-bg disabled:opacity-40"
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
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-border text-brand-text-secondary transition hover:bg-brand-bg disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export function HomeHeroEstimateCard() {
  const navigate = useNavigate()
  const standardType = CLEANING_TYPES.find((t) => t.supported) ?? CLEANING_TYPES[0]
  const [bedrooms, setBedrooms] = useState(2)
  const [bathrooms, setBathrooms] = useState(2)
  const [duration, setDuration] = useState<number>(MIN_BOOKING_HOURS)
  const [date, setDate] = useState('')
  const [startHour, setStartHour] = useState(getCleaningStartHours(MIN_BOOKING_HOURS)[3] ?? 10)

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

  const handleContinue = () => {
    const scheduledAt = date ? buildCleaningScheduledAt(date, startHour) : ''

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
      step: date ? 3 : 2,
      updatedAt: new Date().toISOString(),
    })

    trackEvent('request_cleaning_clicked', { source: 'hero_estimate' })
    navigate('/services/cleaning/request')
  }

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().slice(0, 10)

  return (
    <div className="rounded-card-lg border border-brand-border/80 bg-white p-5 shadow-[0_8px_40px_-12px_rgba(37,99,235,0.25)] sm:p-6">
      <h2 className="text-lg font-bold text-brand-navy">Book a Cleaning</h2>

      <div className="mt-5 space-y-3">
        {/* Service type */}
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

        {/* Duration */}
        <BookField icon={Clock}>
          <div className="relative flex items-center">
            <select
              value={duration}
              onChange={(e) => {
                const next = Number(e.target.value)
                setDuration(next)
                const hours = getCleaningStartHours(next)
                if (!hours.includes(startHour)) {
                  setStartHour(hours[Math.min(3, hours.length - 1)] ?? hours[0])
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

        {/* Date */}
        <BookField icon={Calendar}>
          <input
            type="date"
            min={minDate}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={cn(
              'w-full bg-transparent text-sm font-medium text-brand-text focus:outline-none',
              '[&::-webkit-calendar-picker-indicator]:cursor-pointer',
              !date && 'text-brand-text-muted',
            )}
            aria-label="Preferred date"
          />
        </BookField>

        {/* Time range */}
        <BookField icon={Clock}>
          <div className="relative flex items-center">
            <select
              value={startHour}
              onChange={(e) => setStartHour(Number(e.target.value))}
              className="w-full appearance-none bg-transparent pr-6 text-sm font-medium text-brand-text focus:outline-none"
              aria-label="Start time"
            >
              {getCleaningStartHours(duration).map((h) => (
                <option key={h} value={h}>
                  {formatCleaningTimeRange(h, duration)}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-0 h-4 w-4 text-brand-text-muted" />
          </div>
        </BookField>

        {/* Bedrooms & bathrooms steppers */}
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

        {/* Total price */}
        <div className="flex items-center justify-between border-t border-brand-border pt-4">
          <span className="text-sm font-medium text-brand-text-secondary">Total Price</span>
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
