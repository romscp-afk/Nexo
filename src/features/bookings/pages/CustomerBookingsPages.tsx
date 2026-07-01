import { Link } from 'react-router-dom'
import { useCustomerBookings } from '@/features/bookings/hooks/useBookings'
import { BookingList } from '@/features/bookings/components/BookingUi'
import { QueryState } from '@/features/catalog/components/CatalogUi'

export function CustomerDashboardPage() {
  const { data: bookings, isLoading, error } = useCustomerBookings()
  const upcoming = bookings?.filter((b) => !['completed', 'cancelled'].includes(b.status)) ?? []
  const recent = bookings?.slice(0, 3) ?? []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My bookings</h1>
        <p className="mt-1 text-slate-600">Track and manage your home service appointments.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Active</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{upcoming.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Total</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{bookings?.length ?? 0}</p>
        </div>
        <Link
          to="/providers"
          className="flex items-center justify-center rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm font-medium text-teal-800 hover:bg-teal-100"
        >
          Book a provider →
        </Link>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Recent bookings</h2>
          <Link to="/dashboard/bookings" className="text-sm text-teal-700 hover:underline">
            View all
          </Link>
        </div>
        <QueryState loading={isLoading} error={error} empty={recent.length === 0}>
          <BookingList
            bookings={recent}
            detailPathPrefix="/dashboard/bookings"
            emptyMessage="No bookings yet. Browse providers to schedule your first service."
          />
        </QueryState>
      </section>
    </div>
  )
}

export function CustomerBookingsPage() {
  const { data: bookings, isLoading, error } = useCustomerBookings()

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">All bookings</h1>
      <p className="mt-1 text-slate-600">Your full booking history.</p>
      <div className="mt-6">
        <QueryState loading={isLoading} error={error} empty={!bookings?.length}>
          <BookingList
            bookings={bookings ?? []}
            detailPathPrefix="/dashboard/bookings"
            emptyMessage="No bookings yet."
          />
        </QueryState>
      </div>
    </div>
  )
}
