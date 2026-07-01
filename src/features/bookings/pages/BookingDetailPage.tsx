import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BookingStatusTimeline } from '@/features/bookings/components/BookingStatusTimeline'
import {
  useBooking,
  useBookingStatusHistory,
  useCancelBooking,
  useUpdateBookingStatus,
} from '@/features/bookings/hooks/useBookings'
import { BookingStatusBadge } from '@/features/bookings/components/BookingUi'
import { ReviewSection } from '@/features/bookings/components/ReviewSection'
import { QueryState } from '@/features/catalog/components/CatalogUi'
import { formatCurrency, formatDateTime } from '@/shared/lib/utils'
import type { BookingStatus } from '@/shared/types/booking'

type BookingDetailPageProps = {
  role: 'customer' | 'provider'
  backPath: string
}

export function BookingDetailPage({ role, backPath }: BookingDetailPageProps) {
  const { id = '' } = useParams()
  const { data: booking, isLoading, error } = useBooking(id)
  const { data: statusHistory } = useBookingStatusHistory(id)
  const cancelBooking = useCancelBooking()
  const updateStatus = useUpdateBookingStatus()
  const [actionError, setActionError] = useState('')

  const handleStatus = async (status: BookingStatus) => {
    setActionError('')
    try {
      await updateStatus.mutateAsync({ id, status })
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Update failed')
    }
  }

  const handleCancel = async () => {
    setActionError('')
    try {
      await cancelBooking.mutateAsync(id)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Cancel failed')
    }
  }

  const isPending = updateStatus.isPending || cancelBooking.isPending

  return (
    <div>
      <Link to={backPath} className="text-sm text-teal-700 hover:underline">
        ← Back to bookings
      </Link>

      <QueryState loading={isLoading} error={error} empty={!booking}>
        {booking && (
          <div className="mt-4 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {booking.serviceName ?? 'Booking'}
                </h1>
                <p className="mt-1 text-slate-600">{booking.providerName}</p>
              </div>
              <BookingStatusBadge status={booking.status} />
            </div>

            {actionError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{actionError}</p>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="font-semibold text-slate-900">Schedule</h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="text-slate-500">When</dt>
                    <dd className="font-medium">{formatDateTime(booking.scheduledAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Duration</dt>
                    <dd className="font-medium">{booking.durationHours} hours</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Estimated total</dt>
                    <dd className="font-medium text-teal-700">
                      {booking.totalPrice != null ? formatCurrency(booking.totalPrice) : '—'}
                    </dd>
                  </div>
                </dl>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="font-semibold text-slate-900">Location</h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="text-slate-500">Address</dt>
                    <dd className="font-medium">
                      {booking.addressLine1}
                      {booking.addressLine2 && `, ${booking.addressLine2}`}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Postal code</dt>
                    <dd className="font-medium">{booking.postalCode}</dd>
                  </div>
                  {booking.notes && (
                    <div>
                      <dt className="text-slate-500">Notes</dt>
                      <dd className="font-medium">{booking.notes}</dd>
                    </div>
                  )}
                </dl>
              </section>
            </div>

            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="font-semibold text-slate-900">Status timeline</h2>
              <div className="mt-4">
                <BookingStatusTimeline history={statusHistory ?? []} />
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="font-semibold text-slate-900">Actions</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {role === 'customer' && booking.status === 'pending' && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isPending}
                    className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    Cancel booking
                  </button>
                )}
                {role === 'provider' && booking.status === 'pending' && (
                  <button
                    type="button"
                    onClick={() => handleStatus('confirmed')}
                    disabled={isPending}
                    className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
                  >
                    Confirm booking
                  </button>
                )}
                {role === 'provider' && booking.status === 'confirmed' && (
                  <button
                    type="button"
                    onClick={() => handleStatus('in_progress')}
                    disabled={isPending}
                    className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
                  >
                    Start job
                  </button>
                )}
                {role === 'provider' && booking.status === 'in_progress' && (
                  <button
                    type="button"
                    onClick={() => handleStatus('completed')}
                    disabled={isPending}
                    className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
                  >
                    Mark completed
                  </button>
                )}
                {['completed', 'cancelled'].includes(booking.status) && (
                  <p className="text-sm text-slate-500">No actions available for this booking.</p>
                )}
              </div>
            </section>

            {role === 'customer' && <ReviewSection booking={booking} />}
          </div>
        )}
      </QueryState>
    </div>
  )
}
