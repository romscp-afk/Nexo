import { PLATFORM_FEE_SGD, HIGH_CEILING_SURCHARGE_SGD } from '@/shared/lib/marketplaceConfig'
import type { PricingModel, UnitPrices } from '@/shared/types/catalog'

export type CeilingHeight = 'normal' | 'high'

export type PriceLine = {
  label: string
  amount: number
}

export type PriceBreakdown = {
  pricingModel: PricingModel
  quantity: number | null
  durationHours: number | null
  ceilingHeight: CeilingHeight | null
  lines: PriceLine[]
  serviceSubtotal: number
  platformFee: number
  total: number
}

export function parseUnitPrices(raw: unknown): UnitPrices {
  if (!raw || typeof raw !== 'object') return {}
  const out: UnitPrices = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const units = Number(key)
    const price = Number(value)
    if (units >= 1 && Number.isFinite(price)) out[units] = price
  }
  return out
}

/** Price for exact unit count from tier map; falls back to priceFrom × quantity. */
export function calculateUnitSubtotal(
  quantity: number,
  unitPrices: UnitPrices,
  priceFrom: number,
): { subtotal: number; lineLabel: string } {
  const q = Math.max(1, Math.floor(quantity))
  const tierPrice = unitPrices[q]
  if (tierPrice != null) {
    return {
      subtotal: tierPrice,
      lineLabel: `${q} aircon unit${q === 1 ? '' : 's'}`,
    }
  }
  const subtotal = priceFrom * q
  return {
    subtotal,
    lineLabel: `${q} aircon unit${q === 1 ? '' : 's'} × ${priceFrom.toFixed(2)}`,
  }
}

export function calculateHourlySubtotal(
  durationHours: number,
  priceFrom: number,
  hourlyRate: number,
): { subtotal: number; lineLabel: string } {
  const hours = Math.max(0.5, durationHours)
  const hourlyTotal = hourlyRate * hours
  const subtotal = Math.max(priceFrom, hourlyTotal)
  const lineLabel =
    hourlyTotal >= priceFrom
      ? `${hours} hr${hours === 1 ? '' : 's'} × ${hourlyRate.toFixed(2)}/hr`
      : `Minimum service rate`
  return { subtotal, lineLabel }
}

export function buildPriceBreakdown(input: {
  pricingModel: PricingModel
  priceFrom: number
  hourlyRate: number
  durationHours: number
  quantity: number
  unitPrices?: UnitPrices
  ceilingHeight?: CeilingHeight
  platformFee?: number
}): PriceBreakdown {
  const platformFee = input.platformFee ?? PLATFORM_FEE_SGD
  const lines: PriceLine[] = []
  const ceilingHeight = input.pricingModel === 'per_unit' ? (input.ceilingHeight ?? 'normal') : null

  if (input.pricingModel === 'per_unit') {
    const { subtotal, lineLabel } = calculateUnitSubtotal(
      input.quantity,
      input.unitPrices ?? {},
      input.priceFrom,
    )
    lines.push({ label: lineLabel, amount: subtotal })
    let serviceSubtotal = subtotal
    if (ceilingHeight === 'high') {
      lines.push({
        label: 'High ceiling surcharge',
        amount: HIGH_CEILING_SURCHARGE_SGD,
      })
      serviceSubtotal += HIGH_CEILING_SURCHARGE_SGD
    }
    return {
      pricingModel: 'per_unit',
      quantity: input.quantity,
      durationHours: null,
      ceilingHeight,
      lines,
      serviceSubtotal,
      platformFee,
      total: serviceSubtotal + platformFee,
    }
  }

  const { subtotal, lineLabel } = calculateHourlySubtotal(
    input.durationHours,
    input.priceFrom,
    input.hourlyRate,
  )
  lines.push({ label: lineLabel, amount: subtotal })
  return {
    pricingModel: 'hourly',
    quantity: null,
    durationHours: input.durationHours,
    ceilingHeight: null,
    lines,
    serviceSubtotal: subtotal,
    platformFee,
    total: subtotal + platformFee,
  }
}

export function ceilingHeightLabel(height: CeilingHeight | null | undefined): string {
  if (height === 'high') return 'High ceiling'
  if (height === 'normal') return 'Normal ceiling'
  return '—'
}
