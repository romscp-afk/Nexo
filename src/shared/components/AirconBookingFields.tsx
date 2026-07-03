import { formatCurrency } from '@/shared/lib/utils'
import { HIGH_CEILING_SURCHARGE_SGD } from '@/shared/lib/marketplaceConfig'
import type { CeilingHeight } from '@/shared/lib/pricing'

type Props = {
  quantity: string
  onQuantityChange: (value: string) => void
  ceilingHeight: CeilingHeight
  onCeilingHeightChange: (value: CeilingHeight) => void
  unitLabel?: string
}

export function AirconBookingFields({
  quantity,
  onQuantityChange,
  ceilingHeight,
  onCeilingHeightChange,
  unitLabel = 'unit',
}: Props) {
  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
      <p className="text-sm font-medium text-slate-900">Aircon job details</p>

      <label className="block text-sm">
        <span className="font-medium text-slate-700">
          How many {unitLabel}s need servicing?
        </span>
        <input
          type="number"
          min={1}
          max={10}
          step={1}
          value={quantity}
          onChange={(e) => onQuantityChange(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
          required
        />
      </label>

      <fieldset>
        <legend className="text-sm font-medium text-slate-700">Ceiling height</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <label
            className={`cursor-pointer rounded-lg border bg-white p-3 text-sm ${
              ceilingHeight === 'normal' ? 'border-nexo-500 ring-1 ring-nexo-300' : 'border-slate-200'
            }`}
          >
            <input
              type="radio"
              name="ceilingHeight"
              checked={ceilingHeight === 'normal'}
              onChange={() => onCeilingHeightChange('normal')}
              className="mr-2"
            />
            <span className="font-medium text-slate-900">Normal ceiling</span>
            <p className="mt-1 text-xs text-slate-500">Standard HDB / condo height</p>
          </label>
          <label
            className={`cursor-pointer rounded-lg border bg-white p-3 text-sm ${
              ceilingHeight === 'high' ? 'border-nexo-500 ring-1 ring-nexo-300' : 'border-slate-200'
            }`}
          >
            <input
              type="radio"
              name="ceilingHeight"
              checked={ceilingHeight === 'high'}
              onChange={() => onCeilingHeightChange('high')}
              className="mr-2"
            />
            <span className="font-medium text-slate-900">High ceiling</span>
            <p className="mt-1 text-xs text-slate-500">
              +{formatCurrency(HIGH_CEILING_SURCHARGE_SGD)} per booking
            </p>
          </label>
        </div>
      </fieldset>
    </div>
  )
}
