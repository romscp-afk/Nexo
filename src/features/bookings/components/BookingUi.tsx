import { Link } from 'react-router-dom'
import type { Booking, BookingStatus } from '@/shared/types/booking'
import { BOOKING_STATUS_LABELS } from '@/shared/types/booking'
import { cn, formatCurrency, formatDateTime } from '@/shared/lib/utils'

const STATUS_STYLES: Record<BookingStatus, string> = {
  pending: 'bg-amber-50 text-amber-800',
  confirmed: 'bg-blue-50 text-blue-800',
  in_progress: 'bg-violet-50 text-violet-800',
  completed: 'bg-green-50 text-green-800',
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
}: {
  booking: Booking
  detailPath: string
}) {
  return (
    <Link
      to={detailPath}
      className="block rounded-xl border border-slate-200 bg-white p-5 transition hover:border-teal-200 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-slate-900">
            {booking.serviceName ?? 'Service'} · {booking.providerName ?? 'Provider'}
          </p>
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
}: {
  bookings: Booking[]
  detailPathPrefix: string
  emptyMessage: string
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
        />
      ))}
    </div>
  )
}
