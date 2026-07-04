import { Link } from 'react-router-dom'
import { useAdminStats, useAdminBookings } from '@/features/admin/hooks/useAdmin'
import { QueryState } from '@/features/catalog/components/CatalogUi'
import { BookingStatusBadge } from '@/features/bookings/components/BookingUi'
import { formatCurrency, formatDateTime } from '@/shared/lib/utils'

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  )
}

export function AdminDashboardPage() {
  const { data: stats, isLoading, error } = useAdminStats()
  const { data: bookings } = useAdminBookings()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin dashboard</h1>
        <p className="mt-1 text-slate-600">Platform overview and recent activity.</p>
      </div>

      <QueryState loading={isLoading} error={error} empty={!stats}>
        {stats && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard label="Total users" value={stats.totalUsers} />
            <StatCard label="Providers" value={stats.totalProviders} />
            <StatCard label="Total bookings" value={stats.totalBookings} />
            <StatCard label="Pending bookings" value={stats.pendingBookings} />
            <StatCard label="Completed" value={stats.completedBookings} />
            <StatCard label="PayNow received" value={formatCurrency(stats.totalRevenue)} />
            <StatCard label="Pending payments" value={stats.pendingPayments} />
            <StatCard label="Paid bookings" value={stats.paidPayments} />
          </div>
        )}
      </QueryState>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Recent bookings</h2>
          <div className="flex gap-3 text-sm">
            <Link to="/admin/chats" className="text-nexo-700 hover:underline">
              Booking chats
            </Link>
            <Link to="/admin/bookings" className="text-nexo-700 hover:underline">
              View all
            </Link>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium">Provider</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Scheduled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings?.slice(0, 5).map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-3">{b.serviceName ?? '—'}</td>
                  <td className="px-4 py-3">{b.providerName ?? '—'}</td>
                  <td className="px-4 py-3">
                    <BookingStatusBadge status={b.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatDateTime(b.scheduledAt)}</td>
                </tr>
              ))}
              {!bookings?.length && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    No bookings yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          to="/admin/payments"
          className="rounded-xl border border-nexo-200 bg-nexo-50 p-4 text-sm font-medium text-nexo-800 hover:bg-nexo-100"
        >
          PayNow payments →
        </Link>
        <Link
          to="/admin/reports"
          className="rounded-xl border border-nexo-200 bg-nexo-50 p-4 text-sm font-medium text-nexo-800 hover:bg-nexo-100"
        >
          Analytics & reports →
        </Link>
        <Link
          to="/admin/activity"
          className="rounded-xl border border-slate-200 bg-white p-4 text-sm font-medium text-nexo-700 hover:border-nexo-200"
        >
          Activity log →
        </Link>
        <Link
          to="/admin/users"
          className="rounded-xl border border-slate-200 bg-white p-4 text-sm font-medium text-nexo-700 hover:border-nexo-200"
        >
          Manage users →
        </Link>
        <Link
          to="/admin/providers"
          className="rounded-xl border border-slate-200 bg-white p-4 text-sm font-medium text-nexo-700 hover:border-nexo-200"
        >
          Manage providers →
        </Link>
      </div>
    </div>
  )
}
