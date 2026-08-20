import { Link } from 'react-router-dom'
import type { Booking, BookingStatus } from '@/shared/types/booking'
import { BOOKING_STATUS_LABELS } from '@/shared/types/booking'
import { PaymentMethodBadge } from '@/features/bookings/components/PaymentMethodBadge'
import { cn, formatCurrency, formatDateTime } from '@/shared/lib/utils'

const STATUS_STYLES: Record<BookingStatus, string> = {
  pending: 'bg-amber-50 text-amber-800 ring-amber-100',
  confirmed: 'bg-brand-light text-brand-primary ring-brand-pale',
  in_progress: 'bg-indigo-50 text-indigo-800 ring-indigo-100',
  completed: 'bg-green-50 text-brand-success ring-green-100',
  cancelled: 'bg-brand-bg text-brand-text-muted ring-brand-border',
}

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset',
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
  unreadCount = 0,
}: {
  booking: Booking
  detailPath: string
  showPaymentMethod?: boolean
  unreadCount?: number
}) {
  return (
    <Link
      to={unreadCount > 0 ? `${detailPath}#chat` : detailPath}
      className={cn(
        'block rounded-card-lg border bg-brand-surface p-5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-card-hover motion-reduce:transition-none motion-reduce:hover:translate-y-0',
        booking.paymentMethod === 'cash' ? 'border-amber-200 hover:border-amber-300' : 'border-brand-border hover:border-brand-primary/20',
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
          <div className="flex items-center justify-end gap-2">
            {unreadCount > 0 && (
              <span className="rounded-full bg-nexo-700 px-2 py-0.5 text-xs font-medium text-white">
                {unreadCount} new
              </span>
            )}
            <BookingStatusBadge status={booking.status} />
          </div>
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
  unreadByBookingId,
}: {
  bookings: Booking[]
  detailPathPrefix: string
  emptyMessage: string
  showPaymentMethod?: boolean
  unreadByBookingId?: Record<string, number>
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
          unreadCount={unreadByBookingId?.[booking.id] ?? 0}
        />
      ))}
    </div>
  )
}
