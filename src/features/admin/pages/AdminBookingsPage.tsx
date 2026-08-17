import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, Trash2 } from 'lucide-react'
import { useAdminBookings, useDeleteBooking } from '@/features/admin/hooks/useAdmin'
import { BookingStatusBadge } from '@/features/bookings/components/BookingUi'
import { QueryState } from '@/features/catalog/components/CatalogUi'
import { formatCurrency, formatDateTime } from '@/shared/lib/utils'
import type { AdminBooking } from '@/shared/types/admin'

export function AdminBookingsPage() {
  const { data: bookings, isLoading, error } = useAdminBookings()
  const deleteBooking = useDeleteBooking()
  const [actionError, setActionError] = useState('')

  const handleDelete = async (booking: AdminBooking) => {
    const label = booking.serviceName ?? 'booking'
    const customer = booking.customerEmail ?? booking.customerId.slice(0, 8)
    const when = formatDateTime(booking.scheduledAt)

    if (
      !window.confirm(
        `Permanently delete this ${label} for ${customer} (${when})?\n\nThis removes payments, chat, and history. This cannot be undone.`,
      )
    ) {
      return
    }

    setActionError('')
    try {
      await deleteBooking.mutateAsync(booking.id)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">All bookings</h1>
      <p className="mt-1 text-slate-600">
        Full booking history across the platform. Delete accidental or test bookings here.
      </p>

      {actionError && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {actionError}
        </p>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <QueryState loading={isLoading} error={error} empty={!bookings?.length}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Service</th>
                  <th className="px-4 py-3 font-medium">Provider</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Scheduled</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings?.map((b) => (
                  <tr key={b.id}>
                    <td className="px-4 py-3">{b.customerEmail ?? b.customerId.slice(0, 8)}</td>
                    <td className="px-4 py-3">{b.serviceName ?? '—'}</td>
                    <td className="px-4 py-3">{b.providerName ?? '—'}</td>
                    <td className="px-4 py-3">
                      <BookingStatusBadge status={b.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDateTime(b.scheduledAt)}</td>
                    <td className="px-4 py-3">
                      {b.totalPrice != null ? formatCurrency(b.totalPrice) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-3">
                        {b.providerId && b.status !== 'cancelled' ? (
                          <Link
                            to={`/admin/chats/${b.id}`}
                            className="inline-flex items-center gap-1 text-sm font-medium text-nexo-700 hover:underline"
                          >
                            <MessageCircle className="h-4 w-4" />
                            Chat
                          </Link>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => void handleDelete(b)}
                          disabled={deleteBooking.isPending}
                          className="inline-flex items-center gap-1 text-sm font-medium text-red-700 hover:underline disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </QueryState>
      </div>
    </div>
  )
}
