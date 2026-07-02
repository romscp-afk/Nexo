import type { BookingPaymentMethod } from '@/shared/types/booking'

export function PaymentMethodBadge({ method }: { method: BookingPaymentMethod }) {
  if (method === 'cash') {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-amber-900 ring-2 ring-amber-400">
        Cash
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-nexo-100 px-2.5 py-0.5 text-xs font-medium text-nexo-800">
      PayNow
    </span>
  )
}
