export type PaymentStatus = 'pending' | 'submitted' | 'paid' | 'failed' | 'refunded'

export type PaymentKind = 'customer_advance' | 'provider_admin_fee'

export type PaymentRow = {
  id: string
  booking_id: string
  customer_id: string
  amount: number
  currency: string
  status: PaymentStatus
  method: string
  paynow_mobile: string
  reference: string
  payment_kind: PaymentKind
  booking_details: Record<string, unknown>
  customer_note: string | null
  paid_at: string | null
  confirmed_by: string | null
  created_at: string
  updated_at: string
}

export type Payment = {
  id: string
  bookingId: string
  customerId: string
  amount: number
  currency: string
  status: PaymentStatus
  method: string
  paynowMobile: string
  reference: string
  paymentKind: PaymentKind
  bookingDetails: Record<string, unknown>
  customerNote: string | null
  paidAt: string | null
  confirmedBy: string | null
  createdAt: string
  updatedAt: string
}

export type AdminPayment = Payment & {
  customerEmail?: string
  providerName?: string
  serviceName?: string
  bookingStatus?: string
  bookingPaymentMethod?: string
}

export const PAYMENT_KIND_LABELS: Record<PaymentKind, string> = {
  customer_advance: 'Customer PayNow',
  provider_admin_fee: 'Provider admin fee',
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Awaiting payment',
  submitted: 'Payment sent — pending verification',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
}

export function mapPayment(row: PaymentRow): Payment {
  return {
    id: row.id,
    bookingId: row.booking_id,
    customerId: row.customer_id,
    amount: Number(row.amount),
    currency: row.currency,
    status: row.status,
    method: row.method,
    paynowMobile: row.paynow_mobile,
    reference: row.reference,
    paymentKind: row.payment_kind ?? 'customer_advance',
    bookingDetails: row.booking_details ?? {},
    customerNote: row.customer_note,
    paidAt: row.paid_at,
    confirmedBy: row.confirmed_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
