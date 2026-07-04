import { Link } from 'react-router-dom'
import { BarChart3, Star, TrendingUp, Users } from 'lucide-react'
import { useAdminReports, useAdminStats } from '@/features/admin/hooks/useAdmin'
import { QueryState } from '@/features/catalog/components/CatalogUi'
import { BOOKING_STATUS_LABELS } from '@/shared/types/booking'
import type { BookingStatus } from '@/shared/types/booking'
import { formatCurrency } from '@/shared/lib/utils'

function BarRow({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-slate-700">{label}</span>
        <span className="font-medium text-slate-900">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-nexo-600" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  )
}

export function AdminReportsPage() {
  const { data: stats } = useAdminStats()
  const { data: reports, isLoading, error } = useAdminReports()

  const maxStatus = Math.max(...(reports?.bookingsByStatus.map((s) => s.count) ?? [1]), 1)
  const maxService = Math.max(...(reports?.topServices.map((s) => s.count) ?? [1]), 1)
  const maxTrend = Math.max(...(reports?.bookingsLast30Days.map((d) => d.count) ?? [1]), 1)

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <BarChart3 className="h-7 w-7 text-nexo-700" />
            Analytics & reports
          </h1>
          <p className="mt-1 text-slate-600">Platform performance overview for Nexo.</p>
        </div>
        <Link to="/admin/activity" className="text-sm text-nexo-700 hover:underline">
          View activity log →
        </Link>
      </div>

      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total revenue" value={formatCurrency(stats.totalRevenue)} sub="PayNow confirmed" />
          <StatCard label="Bookings" value={stats.totalBookings} sub={`${stats.completedBookings} completed`} />
          <StatCard label="Users" value={stats.totalUsers} sub={`${stats.totalProviders} providers`} />
          <StatCard
            label="Avg rating"
            value={reports?.averageRating.toFixed(1) ?? '—'}
            sub={`${reports?.totalReviews ?? 0} reviews`}
          />
        </div>
      )}

      <QueryState loading={isLoading} error={error} empty={!reports}>
        {reports && (
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="flex items-center gap-2 font-semibold text-slate-900">
                <Users className="h-5 w-5 text-nexo-700" />
                Users by role
              </h2>
              <div className="mt-4 space-y-3">
                {reports.usersByRole.map((row) => (
                  <BarRow
                    key={row.role}
                    label={row.role}
                    value={row.count}
                    max={Math.max(...reports.usersByRole.map((r) => r.count), 1)}
                  />
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="font-semibold text-slate-900">Bookings by status</h2>
              <div className="mt-4 space-y-3">
                {reports.bookingsByStatus.map((row) => (
                  <BarRow
                    key={row.status}
                    label={BOOKING_STATUS_LABELS[row.status as BookingStatus] ?? row.status}
                    value={row.count}
                    max={maxStatus}
                  />
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="font-semibold text-slate-900">Payment methods</h2>
              <div className="mt-4 space-y-3">
                {reports.bookingsByPaymentMethod.map((row) => (
                  <BarRow
                    key={row.method}
                    label={row.method === 'paynow' ? 'PayNow' : row.method === 'cash' ? 'Cash' : row.method}
                    value={row.count}
                    max={Math.max(...reports.bookingsByPaymentMethod.map((r) => r.count), 1)}
                  />
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="flex items-center gap-2 font-semibold text-slate-900">
                <Star className="h-5 w-5 text-amber-500" />
                Top services
              </h2>
              <div className="mt-4 space-y-3">
                {reports.topServices.length === 0 ? (
                  <p className="text-sm text-slate-500">No bookings yet.</p>
                ) : (
                  reports.topServices.map((row) => (
                    <BarRow key={row.name} label={row.name} value={row.count} max={maxService} />
                  ))
                )}
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-2">
              <h2 className="flex items-center gap-2 font-semibold text-slate-900">
                <TrendingUp className="h-5 w-5 text-nexo-700" />
                Revenue by month
              </h2>
              {reports.revenueByMonth.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">No paid payments yet.</p>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  {reports.revenueByMonth.map((row) => (
                    <div key={row.month} className="rounded-lg bg-slate-50 p-3 text-center">
                      <p className="text-xs text-slate-500">{row.month}</p>
                      <p className="mt-1 font-semibold text-nexo-800">{formatCurrency(row.amount)}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-2">
              <h2 className="font-semibold text-slate-900">New bookings (last 30 days)</h2>
              {reports.bookingsLast30Days.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">No recent bookings.</p>
              ) : (
                <div className="mt-4 space-y-2">
                  {reports.bookingsLast30Days.map((row) => (
                    <BarRow key={row.date} label={row.date} value={row.count} max={maxTrend} />
                  ))}
                </div>
              )}
              <p className="mt-4 text-xs text-slate-500">
                {reports.recentActivityCount} total actions logged in activity log.
              </p>
            </section>
          </div>
        )}
      </QueryState>
    </div>
  )
}
