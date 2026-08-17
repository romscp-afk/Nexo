/** Parse service area stored in booking notes (legacy). */
export function parseBookingServiceArea(notes: string | null | undefined): string | null {
  if (!notes) return null
  const match = notes.match(/Area:\s*([^.\n]+)/i)
  return match?.[1]?.trim() ?? null
}

function normalizeArea(area: string): string {
  return area.trim().toLowerCase()
}

/** Whether a provider's coverage includes the booking area. */
export function matchesServiceArea(
  providerAreas: string[] | null | undefined,
  bookingArea: string | null | undefined,
): boolean {
  const target = bookingArea?.trim()
  if (!target) return true
  if (!providerAreas?.length) return false

  const normalizedTarget = normalizeArea(target)
  return providerAreas.some((area) => {
    const normalized = normalizeArea(area)
    if (!normalized) return false
    return (
      normalized === normalizedTarget ||
      normalized.includes(normalizedTarget) ||
      normalizedTarget.includes(normalized)
    )
  })
}

export function resolveBookingServiceArea(input: {
  serviceArea?: string | null
  notes?: string | null
}): string | null {
  return input.serviceArea?.trim() || parseBookingServiceArea(input.notes) || null
}

export function normalizeServiceAreas(areas: string[]): string[] {
  return [...new Set(areas.map((area) => area.trim()).filter(Boolean))]
}
