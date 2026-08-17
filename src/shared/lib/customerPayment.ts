import { PLATFORM_FEE_SGD } from '@/shared/lib/marketplaceConfig'
import type { PriceBreakdown } from '@/shared/lib/pricing'
import type { Booking, BookingPaymentMethod } from '@/shared/types/booking'

export function resolveBookingPlatformFee(
  booking: Pick<Booking, 'platformFee' | 'pricingSnapshot'>,
): number {
  const snapshot = booking.pricingSnapshot as PriceBreakdown | null | undefined
  return snapshot?.platformFee ?? booking.platformFee ?? PLATFORM_FEE_SGD
}

export function resolveBookingServiceSubtotal(
  booking: Pick<Booking, 'serviceSubtotal' | 'totalPrice' | 'platformFee' | 'pricingSnapshot'>,
): number | null {
  const snapshot = booking.pricingSnapshot as PriceBreakdown | null | undefined
  if (snapshot?.serviceSubtotal != null) return snapshot.serviceSubtotal
  if (booking.serviceSubtotal != null) return booking.serviceSubtotal
  if (booking.totalPrice != null) {
    return Math.max(0, booking.totalPrice - resolveBookingPlatformFee(booking))
  }
  return null
}

export type CustomerPaymentBreakdown = {
  serviceSubtotal: number | null
  platformFee: number
  /** Amount the customer pays via PayNow */
  paynowAmount: number
  /** Cash paid to provider on completion (cash bookings only) */
  cashToProvider: number | null
  paymentMethod: BookingPaymentMethod
}

export function getCustomerPaymentBreakdown(
  booking: Pick<
    Booking,
    'paymentMethod' | 'serviceSubtotal' | 'totalPrice' | 'platformFee' | 'pricingSnapshot'
  >,
): CustomerPaymentBreakdown {
  const platformFee = resolveBookingPlatformFee(booking)
  const serviceSubtotal = resolveBookingServiceSubtotal(booking)

  if (booking.paymentMethod === 'cash') {
    return {
      serviceSubtotal,
      platformFee,
      paynowAmount: platformFee,
      cashToProvider: serviceSubtotal,
      paymentMethod: 'cash',
    }
  }

  const paynowAmount =
    serviceSubtotal != null
      ? serviceSubtotal + platformFee
      : (booking.totalPrice ?? platformFee)

  return {
    serviceSubtotal,
    platformFee,
    paynowAmount,
    cashToProvider: null,
    paymentMethod: 'paynow',
  }
}
