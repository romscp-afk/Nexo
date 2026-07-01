import type { BookingPaymentMethod } from '@/shared/types/booking'
import type { UserRole } from '@/shared/lib/constants'

export type ReceiptRow = {
  id: string
  booking_id: string
  payment_id: string | null
  recipient_id: string
  recipient_role: UserRole
  receipt_number: string
  amount: number
  payment_method: BookingPaymentMethod
  details: Record<string, unknown>
  created_at: string
}

export type Receipt = {
  id: string
  bookingId: string
  paymentId: string | null
  recipientId: string
  recipientRole: UserRole
  receiptNumber: string
  amount: number
  paymentMethod: BookingPaymentMethod
  details: Record<string, unknown>
  createdAt: string
}

export function mapReceipt(row: ReceiptRow): Receipt {
  return {
    id: row.id,
    bookingId: row.booking_id,
    paymentId: row.payment_id,
    recipientId: row.recipient_id,
    recipientRole: row.recipient_role,
    receiptNumber: row.receipt_number,
    amount: Number(row.amount),
    paymentMethod: row.payment_method,
    details: row.details ?? {},
    createdAt: row.created_at,
  }
}
