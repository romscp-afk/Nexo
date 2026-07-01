import { useAdminBookings } from '@/features/admin/hooks/useAdmin'
import { BookingStatusBadge } from '@/features/bookings/components/BookingUi'
import { QueryState } from '@/features/catalog/components/CatalogUi'
import { formatCurrency, formatDateTime } from '@/shared/lib/utils'

export function AdminBookingsPage() {
  const { data: bookings, isLoading, error } = useAdminBookings()

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">All bookings</h1>
      <p className="mt-1 text-slate-600">Full booking history across the platform.</p>

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
