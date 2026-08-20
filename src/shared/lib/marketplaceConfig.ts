/** Customer-facing platform fee — always 0 (fee is charged to providers). */
export const PLATFORM_FEE_SGD = 0

/** Fixed fallback if service subtotal is missing when computing provider fee. */
export const ADMIN_FEE_SGD = 5

/** Providers pay this percent of the service subtotal per accepted booking. */
export const PROVIDER_PLATFORM_FEE_PERCENT = 10

export const HIGH_CEILING_SURCHARGE_SGD = 50

/** Platform fee amount charged to the provider for a job. */
export function providerPlatformFeeFromSubtotal(serviceSubtotal: number | null | undefined): number {
  const subtotal = Number(serviceSubtotal)
  if (!Number.isFinite(subtotal) || subtotal <= 0) return ADMIN_FEE_SGD
  return Math.round(subtotal * (PROVIDER_PLATFORM_FEE_PERCENT / 100) * 100) / 100
}
