import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import {
  CLEANING_TYPES,
  MIN_BOOKING_HOURS,
  PROPERTY_TYPES,
  getCleaningHourlyRateForDuration,
} from '@/shared/lib/cleaningContent'
import { buildPriceBreakdown } from '@/shared/lib/pricing'
import { PLATFORM_FEE_SGD } from '@/shared/lib/marketplaceConfig'
import { saveCleaningDraft } from '@/shared/lib/bookingDraft'
import { buildCleaningScheduledAt, getCleaningStartHours } from '@/shared/lib/cleaningSchedule'
import { formatCurrency } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card'
import { trackEvent } from '@/shared/lib/analytics'

export function HomeHeroEstimateCard() {
  const navigate = useNavigate()
  const standardType = CLEANING_TYPES.find((t) => t.supported) ?? CLEANING_TYPES[0]
  const [propertyType, setPropertyType] = useState<string>(PROPERTY_TYPES[0])
  const [bedrooms, setBedrooms] = useState('2')
  const [bathrooms, setBathrooms] = useState('1')
  const [duration, setDuration] = useState<number>(MIN_BOOKING_HOURS)
  const [date, setDate] = useState('')
  const [startHour, setStartHour] = useState(getCleaningStartHours(MIN_BOOKING_HOURS)[4] ?? 9)

  const hourlyRate = getCleaningHourlyRateForDuration(duration)

  const breakdown = useMemo(
    () =>
      buildPriceBreakdown({
        pricingModel: 'hourly',
        priceFrom: hourlyRate * duration,
        hourlyRate,
        durationHours: duration,
        quantity: 1,
        platformFee: PLATFORM_FEE_SGD,
      }),
    [duration, hourlyRate],
  )

  const handleContinue = () => {
    const scheduledAt = date
      ? buildCleaningScheduledAt(date, startHour)
      : ''

    saveCleaningDraft({
      version: 1,
      cleaningTypeId: standardType.id,
      serviceId: '',
      propertyType,
      bedrooms: Number(bedrooms) || 2,
      bathrooms: Number(bathrooms) || 1,
      supplies: 'customer',
      scheduledAt,
      durationHours: duration,
      serviceArea: '',
      addressLine1: '',
      addressLine2: '',
      postalCode: '',
      notes: '',
      paymentMethod: 'paynow',
      step: date ? 4 : 2,
      updatedAt: new Date().toISOString(),
    })

    trackEvent('request_cleaning_clicked', { source: 'hero_estimate' })
    navigate('/services/cleaning/request')
  }

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().slice(0, 10)

  return (
    <Card className="shadow-card-hover animate-float border-0">
      <CardHeader className="border-brand-border/60 bg-brand-light/50">
        <CardTitle className="text-base">Quick estimate</CardTitle>
        <p className="text-xs text-brand-text-secondary">See pricing before you book</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-medium text-brand-text-secondary">Service</span>
          <select
            className="w-full rounded-input border border-brand-border bg-white px-3 py-2 text-sm"
            defaultValue={standardType.id}
            disabled
          >
            <option>{standardType.label}</option>
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-medium text-brand-text-secondary">Property</span>
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="w-full rounded-input border border-brand-border bg-white px-3 py-2 text-sm"
            >
              {PROPERTY_TYPES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-medium text-brand-text-secondary">Duration</span>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full rounded-input border border-brand-border bg-white px-3 py-2 text-sm"
            >
              {[2, 3, 4].map((h) => (
                <option key={h} value={h}>{h} hours · S${getCleaningHourlyRateForDuration(h)}/hr</option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-medium text-brand-text-secondary">Bedrooms</span>
            <select
              value={bedrooms}
              onChange={(e) => setBedrooms(e.target.value)}
              className="w-full rounded-input border border-brand-border bg-white px-3 py-2 text-sm"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-medium text-brand-text-secondary">Bathrooms</span>
            <select
              value={bathrooms}
              onChange={(e) => setBathrooms(e.target.value)}
              className="w-full rounded-input border border-brand-border bg-white px-3 py-2 text-sm"
            >
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-medium text-brand-text-secondary">Preferred date</span>
            <input
              type="date"
              min={minDate}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-input border border-brand-border bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-medium text-brand-text-secondary">Start time</span>
            <select
              value={startHour}
              onChange={(e) => setStartHour(Number(e.target.value))}
              className="w-full rounded-input border border-brand-border bg-white px-3 py-2 text-sm"
            >
              {getCleaningStartHours(duration).map((h) => (
                <option key={h} value={h}>{h}:00</option>
              ))}
            </select>
          </label>
        </div>

        <div className="rounded-input bg-brand-light px-4 py-3">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-brand-text-secondary">Estimated total</span>
            <span className="text-xl font-bold text-brand-primary">{formatCurrency(breakdown.total)}</span>
          </div>
          <p className="mt-1 text-xs text-brand-text-muted">
            incl. S${PLATFORM_FEE_SGD} platform fee · customer provides supplies
          </p>
        </div>

        <Button fullWidth onClick={handleContinue} className="gap-2">
          Continue booking
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
