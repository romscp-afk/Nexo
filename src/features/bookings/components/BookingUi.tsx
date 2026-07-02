import { Link } from 'react-router-dom'
import type { Booking, BookingStatus } from '@/shared/types/booking'
import { BOOKING_STATUS_LABELS } from '@/shared/types/booking'
import { PaymentMethodBadge } from '@/features/bookings/components/PaymentMethodBadge'
import { cn, formatCurrency, formatDateTime } from '@/shared/lib/utils'

const STATUS_STYLES: Record<BookingStatus, string> = {
  pending: 'bg-amber-50 text-amber-800',
  confirmed: 'bg-blue-50 text-blue-800',
  in_progress: 'bg-indigo-50 text-indigo-800',
  completed: 'bg-emerald-50 text-emerald-800',
  cancelled: 'bg-slate-100 text-slate-600',
}

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
        STATUS_STYLES[status],
      )}
    >
      {BOOKING_STATUS_LABELS[status]}
    </span>
  )
}

export function BookingCard({
  booking,
  detailPath,
  showPaymentMethod,
}: {
  booking: Booking
  detailPath: string
  showPaymentMethod?: boolean
}) {
  return (
    <Link
      to={detailPath}
      className={cn(
        'block rounded-xl border bg-white p-5 transition hover:shadow-sm',
        booking.paymentMethod === 'cash' ? 'border-amber-300 hover:border-amber-400' : 'border-slate-200 hover:border-nexo-200',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-slate-900">
              {booking.serviceName ?? 'Service'} · {booking.providerName ?? 'Open request'}
            </p>
            {showPaymentMethod && <PaymentMethodBadge method={booking.paymentMethod} />}
          </div>
          <p className="mt-1 text-sm text-slate-600">{formatDateTime(booking.scheduledAt)}</p>
          <p className="mt-1 text-xs text-slate-500">
            {booking.addressLine1}, {booking.postalCode}
          </p>
        </div>
        <div className="text-right">
          <BookingStatusBadge status={booking.status} />
          {booking.totalPrice != null && (
            <p className="mt-2 text-sm font-medium text-slate-900">
              {formatCurrency(booking.totalPrice)}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}

export function BookingList({
  bookings,
  detailPathPrefix,
  emptyMessage,
  showPaymentMethod,
}: {
  bookings: Booking[]
  detailPathPrefix: string
  emptyMessage: string
  showPaymentMethod?: boolean
}) {
  if (bookings.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {bookings.map((booking) => (
        <BookingCard
          key={booking.id}
          booking={booking}
          detailPath={`${detailPathPrefix}/${booking.id}`}
          showPaymentMethod={showPaymentMethod}
        />
      ))}
    </div>
  )
}
