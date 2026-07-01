import { useProviderBookings } from '@/features/bookings/hooks/useBookings'
import { BookingList } from '@/features/bookings/components/BookingUi'
import { QueryState } from '@/features/catalog/components/CatalogUi'

export function ProviderDashboardPage() {
  const { data: bookings, isLoading, error } = useProviderBookings()
  const pending = bookings?.filter((b) => b.status === 'pending') ?? []
  const active = bookings?.filter((b) => ['confirmed', 'in_progress'].includes(b.status)) ?? []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Provider dashboard</h1>
        <p className="mt-1 text-slate-600">Manage incoming jobs and update booking status.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Pending requests</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{pending.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Active jobs</p>
          <p className="mt-1 text-2xl font-bold text-teal-700">{active.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Total bookings</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{bookings?.length ?? 0}</p>
        </div>
      </div>

      <section>
        <h2 className="mb-4 font-semibold text-slate-900">Recent bookings</h2>
        <QueryState loading={isLoading} error={error} empty={!bookings?.length}>
          <BookingList
            bookings={bookings?.slice(0, 5) ?? []}
            detailPathPrefix="/provider/bookings"
            emptyMessage="No bookings assigned yet. Customers will appear here when they book your services."
          />
        </QueryState>
      </section>
    </div>
  )
}

export function ProviderBookingsPage() {
  const { data: bookings, isLoading, error } = useProviderBookings()

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">All bookings</h1>
      <p className="mt-1 text-slate-600">Jobs assigned to your business.</p>
      <div className="mt-6">
        <QueryState loading={isLoading} error={error} empty={!bookings?.length}>
          <BookingList
            bookings={bookings ?? []}
            detailPathPrefix="/provider/bookings"
            emptyMessage="No bookings yet."
          />
        </QueryState>
      </div>
    </div>
  )
}
