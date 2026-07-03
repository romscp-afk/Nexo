import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Phone, User } from 'lucide-react'
import { BookingStatusTimeline } from '@/features/bookings/components/BookingStatusTimeline'
import { BookingChatPanel } from '@/features/bookings/components/BookingChatPanel'
import { RescheduleBookingPanel } from '@/features/bookings/components/RescheduleBookingPanel'
import { PaymentMethodBadge } from '@/features/bookings/components/PaymentMethodBadge'
import {
  useAcceptBooking,
  useBooking,
  useBookingStatusHistory,
  useCancelBooking,
  useUpdateBookingStatus,
} from '@/features/bookings/hooks/useBookings'
import { BookingStatusBadge } from '@/features/bookings/components/BookingUi'
import { ReviewSection } from '@/features/bookings/components/ReviewSection'
import { PayNowQrPanel } from '@/features/payments/components/PayNowQrPanel'
import { ReceiptPanel } from '@/features/payments/components/ReceiptPanel'
import { useBookingPayments } from '@/features/payments/hooks/usePayments'
import { QueryState } from '@/features/catalog/components/CatalogUi'
import { formatCurrency, formatDateTime } from '@/shared/lib/utils'
import { ceilingHeightLabel } from '@/shared/lib/pricing'
import type { PriceBreakdown } from '@/shared/lib/pricing'
import { PriceBreakdownPanel } from '@/shared/components/PriceBreakdownPanel'
import type { BookingStatus } from '@/shared/types/booking'

type BookingDetailPageProps = {
  role: 'customer' | 'provider'
  backPath: string
}

export function BookingDetailPage({ role, backPath }: BookingDetailPageProps) {
  const { id = '' } = useParams()
  const { data: booking, isLoading, error } = useBooking(id)
  const { data: payments } = useBookingPayments(id)
  const { data: statusHistory } = useBookingStatusHistory(id)
  const cancelBooking = useCancelBooking()
  const updateStatus = useUpdateBookingStatus()
  const acceptBooking = useAcceptBooking()
  const [actionError, setActionError] = useState('')

  const isOpenRequest = !booking?.providerId && booking?.status === 'pending'
  const isCash = booking?.paymentMethod === 'cash'

  const canStartJob = () => {
    if (!booking || booking.status !== 'confirmed') return false
    if (booking.paymentMethod === 'paynow') {
      return payments?.customerAdvance?.status === 'paid'
    }
    return (
      payments?.providerAdminFee?.status === 'paid' && booking.customerContactShared
    )
  }

  const handleStatus = async (status: BookingStatus) => {
    setActionError('')
    try {
      await updateStatus.mutateAsync({ id, status })
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Update failed')
    }
  }

  const handleAccept = async () => {
    setActionError('')
    try {
      await acceptBooking.mutateAsync(id)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Accept failed')
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

  const isPending = updateStatus.isPending || cancelBooking.isPending || acceptBooking.isPending

  const pricingSnapshot = booking?.pricingSnapshot as PriceBreakdown | null | undefined
  const ceilingFromSnapshot = pricingSnapshot?.ceilingHeight ?? null

  return (
    <div>
      <Link to={backPath} className="text-sm text-nexo-700 hover:underline">
        ← Back to bookings
      </Link>

      <QueryState loading={isLoading} error={error} empty={!booking}>
        {booking && (
          <div className="mt-4 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold text-slate-900">
                    {booking.serviceName ?? 'Booking'}
                  </h1>
                  <PaymentMethodBadge method={booking.paymentMethod} />
                </div>
                <p className="mt-1 text-slate-600">
                  {booking.categoryName && `${booking.categoryName} · `}
                  {booking.providerName ?? 'Awaiting provider'}
                </p>
              </div>
              <BookingStatusBadge status={booking.status} />
            </div>

            {isCash && (
              <p className="rounded-lg border-2 border-amber-400 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-950">
                CASH payment — customer pays provider on completion. Provider pays platform admin fee via PayNow.
              </p>
            )}

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
                  {booking.quantity != null && (
                    <>
                      <div>
                        <dt className="text-slate-500">Aircon units</dt>
                        <dd className="font-medium">
                          {booking.quantity} unit{booking.quantity === 1 ? '' : 's'}
                        </dd>
                      </div>
                      {ceilingFromSnapshot && (
                        <div>
                          <dt className="text-slate-500">Ceiling height</dt>
                          <dd className="font-medium">{ceilingHeightLabel(ceilingFromSnapshot)}</dd>
                        </div>
                      )}
                    </>
                  )}
                  {booking.quantity == null && (
                    <div>
                      <dt className="text-slate-500">Duration</dt>
                      <dd className="font-medium">{booking.durationHours} hours</dd>
                    </div>
                  )}
                  {pricingSnapshot?.lines?.length ? (
                    <div className="border-t border-slate-100 pt-3">
                      <dt className="mb-2 text-slate-500">Price breakdown</dt>
                      <dd>
                        <PriceBreakdownPanel
                          breakdown={pricingSnapshot}
                          paymentMethod={booking.paymentMethod}
                          compact
                        />
                      </dd>
                    </div>
                  ) : (
                    <>
                  {booking.serviceSubtotal != null && (
                    <div>
                      <dt className="text-slate-500">Service subtotal</dt>
                      <dd className="font-medium">{formatCurrency(booking.serviceSubtotal)}</dd>
                    </div>
                  )}
                  {booking.platformFee != null && (
                    <div>
                      <dt className="text-slate-500">Platform fee</dt>
                      <dd className="font-medium">{formatCurrency(booking.platformFee)}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-slate-500">Total</dt>
                    <dd className="font-medium text-nexo-700">
                      {booking.totalPrice != null ? formatCurrency(booking.totalPrice) : '—'}
                    </dd>
                  </div>
                    </>
                  )}
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
                  {booking.photoUrls.length > 0 && (
                    <div>
                      <dt className="text-slate-500">Photos</dt>
                      <dd className="mt-1 flex flex-wrap gap-2">
                        {booking.photoUrls.map((url) => (
                          <a key={url} href={url} target="_blank" rel="noreferrer">
                            <img src={url} alt="" className="h-16 w-16 rounded-lg object-cover ring-1 ring-slate-200" />
                          </a>
                        ))}
                      </dd>
                    </div>
                  )}
                </dl>
              </section>
            </div>

            {role === 'customer' &&
              booking.providerId &&
              ['confirmed', 'in_progress', 'completed'].includes(booking.status) &&
              booking.providerPhone && (
              <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
                <h2 className="font-semibold text-slate-900">Provider contact</h2>
                <div className="mt-3 flex flex-wrap gap-4 text-sm">
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4 text-nexo-700" />
                    {booking.providerName}
                  </span>
                  <a href={`tel:${booking.providerPhone}`} className="flex items-center gap-2 text-nexo-800 hover:underline">
                    <Phone className="h-4 w-4" />
                    {booking.providerPhone}
                  </a>
                </div>
              </section>
            )}

            {role === 'provider' && booking.customerContactShared && booking.customerName && (
              <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
                <h2 className="font-semibold text-slate-900">Customer contact</h2>
                <div className="mt-3 flex flex-wrap gap-4 text-sm">
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4 text-nexo-700" />
                    {booking.customerName}
                  </span>
                  {booking.customerPhone && (
                    <span className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-nexo-700" />
                      {booking.customerPhone}
                    </span>
                  )}
                </div>
              </section>
            )}

            {role === 'customer' &&
              booking.paymentMethod === 'paynow' &&
              payments?.customerAdvance &&
              ['confirmed', 'in_progress'].includes(booking.status) && (
                <PayNowQrPanel payment={payments.customerAdvance} booking={booking} role="customer" />
              )}

            {role === 'provider' &&
              isCash &&
              payments?.providerAdminFee &&
              ['confirmed', 'in_progress'].includes(booking.status) && (
                <PayNowQrPanel payment={payments.providerAdminFee} booking={booking} role="provider" />
              )}

            {isCash && role === 'customer' && booking.status === 'confirmed' && (
              <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">
                Pay the provider in cash when the job is done. No online payment required.
              </p>
            )}

            {role === 'customer' && booking.providerId && (
              <RescheduleBookingPanel booking={booking} />
            )}

            {booking.providerId && (
              <BookingChatPanel bookingId={booking.id} status={booking.status} />
            )}

            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="font-semibold text-slate-900">Status timeline</h2>
              <div className="mt-4">
                <BookingStatusTimeline history={statusHistory ?? []} />
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="font-semibold text-slate-900">Actions</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {role === 'customer' && ['pending', 'confirmed'].includes(booking.status) && (
                  <button type="button" onClick={handleCancel} disabled={isPending} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50">
                    Cancel booking
                  </button>
                )}

                {role === 'provider' && isOpenRequest && (
                  <button type="button" onClick={handleAccept} disabled={isPending} className="rounded-lg bg-nexo-700 px-4 py-2 text-sm font-medium text-white hover:bg-nexo-800 disabled:opacity-50">
                    Accept this job
                  </button>
                )}

                {role === 'provider' && booking.providerId && booking.status === 'pending' && (
                  <button type="button" onClick={() => handleStatus('confirmed')} disabled={isPending} className="rounded-lg bg-nexo-700 px-4 py-2 text-sm font-medium text-white hover:bg-nexo-800 disabled:opacity-50">
                    Confirm booking
                  </button>
                )}

                {role === 'provider' && booking.status === 'confirmed' && (
                  <>
                    {!canStartJob() && (
                      <p className="w-full text-sm text-amber-800">
                        {isCash
                          ? 'Pay admin fee via PayNow and wait for admin confirmation to receive customer contact.'
                          : 'Waiting for customer PayNow payment confirmation.'}
                      </p>
                    )}
                    <button type="button" onClick={() => handleStatus('in_progress')} disabled={isPending || !canStartJob()} className="rounded-lg bg-nexo-700 px-4 py-2 text-sm font-medium text-white hover:bg-nexo-800 disabled:opacity-50">
                      Start job
                    </button>
                  </>
                )}

                {role === 'provider' && booking.status === 'in_progress' && (
                  <button type="button" onClick={() => handleStatus('completed')} disabled={isPending} className="rounded-lg bg-nexo-700 px-4 py-2 text-sm font-medium text-white hover:bg-nexo-800 disabled:opacity-50">
                    Mark service done
                  </button>
                )}

                {['completed', 'cancelled'].includes(booking.status) && (
                  <p className="text-sm text-slate-500">No actions available.</p>
                )}
              </div>
            </section>

            {(booking.status === 'completed' || payments?.customerAdvance?.status === 'paid') && (
              <ReceiptPanel bookingId={booking.id} booking={booking} />
            )}

            {role === 'customer' && booking.providerId && <ReviewSection booking={booking} />}
          </div>
        )}
      </QueryState>
    </div>
  )
}
