import type { CeilingHeight } from '@/shared/lib/pricing'
import { ceilingHeightLabel } from '@/shared/lib/pricing'

export function appendAirconBookingNotes(input: {
  serviceArea?: string
  notes?: string
  quantity?: number
  ceilingHeight?: CeilingHeight
}): string | undefined {
  const parts: string[] = []

  if (input.serviceArea) parts.push(`Area: ${input.serviceArea}`)
  if (input.quantity != null) {
    parts.push(`${input.quantity} aircon unit${input.quantity === 1 ? '' : 's'}`)
  }
  if (input.ceilingHeight) {
    parts.push(`Ceiling: ${ceilingHeightLabel(input.ceilingHeight)}`)
  }
  if (input.notes?.trim()) parts.push(input.notes.trim())

  return parts.length > 0 ? parts.join('. ') : undefined
}
