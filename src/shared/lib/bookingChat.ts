import { addHours, isAfter } from 'date-fns'
import type { Booking, BookingStatusHistoryEntry } from '@/shared/types/booking'
import type { BookingPayments } from '@/shared/services/paymentService'

export const BOOKING_CHAT_GRACE_HOURS = 6

export type BookingChatState = 'hidden' | 'locked' | 'active' | 'read_only'

export type BookingChatAccess = {
  state: BookingChatState
  /** When chat becomes read-only (ISO), only for active + completed jobs */
  closesAt?: string
  /** When chat was closed (ISO), only for read_only */
  closedAt?: string
  reason?: string
}

export function isBookingPaymentConfirmed(
  booking: Pick<Booking, 'providerId' | 'paymentMethod' | 'customerContactShared'>,
  payments: BookingPayments | null | undefined,
): boolean {
  if (!booking.providerId) return false

  if (booking.paymentMethod === 'paynow') {
    return payments?.customerAdvance?.status === 'paid'
  }

  return (
    payments?.providerAdminFee?.status === 'paid' && booking.customerContactShared
  )
}

export function getBookingCompletedAt(
  booking: Pick<Booking, 'status' | 'updatedAt'>,
  statusHistory?: BookingStatusHistoryEntry[],
): Date | null {
  if (booking.status !== 'completed') return null

  const historyEntry = statusHistory
    ?.filter((entry) => entry.newStatus === 'completed')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

  if (historyEntry) return new Date(historyEntry.createdAt)
  return new Date(booking.updatedAt)
}

export function getBookingChatAccess(input: {
  booking: Booking
  payments?: BookingPayments | null
  statusHistory?: BookingStatusHistoryEntry[]
  now?: Date
}): BookingChatAccess {
  const { booking, payments, statusHistory } = input
  const now = input.now ?? new Date()

  if (!booking.providerId || booking.status === 'cancelled') {
    return { state: 'hidden' }
  }

  const paymentConfirmed = isBookingPaymentConfirmed(booking, payments)

  if (!paymentConfirmed) {
    return {
      state: 'locked',
      reason:
        booking.paymentMethod === 'cash'
          ? 'Chat opens after the provider admin fee is confirmed and contact details are shared.'
          : 'Chat opens after your PayNow payment is confirmed.',
    }
  }

  if (booking.status === 'confirmed' || booking.status === 'in_progress') {
    return { state: 'active' }
  }

  if (booking.status === 'completed') {
    const completedAt = getBookingCompletedAt(booking, statusHistory)
    if (!completedAt) return { state: 'active' }

    const closesAt = addHours(completedAt, BOOKING_CHAT_GRACE_HOURS)
    if (isAfter(now, closesAt)) {
      return { state: 'read_only', closedAt: closesAt.toISOString() }
    }

    return { state: 'active', closesAt: closesAt.toISOString() }
  }

  return {
    state: 'locked',
    reason: 'Chat opens once the booking is confirmed and payment is verified.',
  }
}

export function canSendBookingChatMessage(access: BookingChatAccess): boolean {
  return access.state === 'active'
}

export function shouldLoadBookingChatMessages(access: BookingChatAccess): boolean {
  return access.state === 'active' || access.state === 'read_only'
}
