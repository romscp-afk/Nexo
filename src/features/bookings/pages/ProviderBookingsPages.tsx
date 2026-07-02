import { useProviderBookings, useOpenProviderRequests } from '@/features/bookings/hooks/useBookings'
import { BookingList } from '@/features/bookings/components/BookingUi'
import { QueryState } from '@/features/catalog/components/CatalogUi'
import { Link } from 'react-router-dom'

export function ProviderDashboardPage() {
  const { data: bookings, isLoading, error } = useProviderBookings()
  const { data: openRequests } = useOpenProviderRequests()
  const pending = bookings?.filter((b) => b.status === 'pending') ?? []
  const active = bookings?.filter((b) => ['confirmed', 'in_progress'].includes(b.status)) ?? []
  const cashJobs = bookings?.filter((b) => b.paymentMethod === 'cash' && b.status !== 'cancelled') ?? []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Provider dashboard</h1>
        <p className="mt-1 text-slate-600">Open category requests and your assigned jobs.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">Open requests</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">{openRequests?.length ?? 0}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Pending assigned</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{pending.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Active jobs</p>
          <p className="mt-1 text-2xl font-bold text-nexo-700">{active.length}</p>
        </div>
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-900">Cash jobs</p>
          <p className="mt-1 text-2xl font-bold text-amber-800">{cashJobs.length}</p>
        </div>
      </div>

      {(openRequests?.length ?? 0) > 0 && (
        <section>
          <h2 className="mb-4 font-semibold text-slate-900">Open requests in your categories</h2>
          <BookingList bookings={openRequests ?? []} detailPathPrefix="/provider/bookings" emptyMessage="" showPaymentMethod />
        </section>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Your bookings</h2>
          <Link to="/provider/bookings" className="text-sm text-nexo-700 hover:underline">View all</Link>
        </div>
        <QueryState loading={isLoading} error={error} empty={!bookings?.length}>
          <BookingList bookings={bookings?.slice(0, 5) ?? []} detailPathPrefix="/provider/bookings" emptyMessage="No bookings yet." showPaymentMethod />
        </QueryState>
      </section>
    </div>
  )
}

export function ProviderBookingsPage() {
  const { data: bookings, isLoading, error } = useProviderBookings()
  const { data: openRequests, isLoading: openLoading, error: openError } = useOpenProviderRequests()

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-2xl font-bold text-slate-900">Open requests</h1>
        <p className="mt-1 text-slate-600">Jobs broadcast to all providers in your service categories.</p>
        <div className="mt-6">
          <QueryState loading={openLoading} error={openError} empty={!openRequests?.length} emptyMessage="No open requests in your categories right now.">
            <BookingList bookings={openRequests ?? []} detailPathPrefix="/provider/bookings" emptyMessage="No open requests." showPaymentMethod />
          </QueryState>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-900">Assigned to you</h2>
        <div className="mt-6">
          <QueryState loading={isLoading} error={error} empty={!bookings?.length}>
            <BookingList bookings={bookings ?? []} detailPathPrefix="/provider/bookings" emptyMessage="No assigned bookings." showPaymentMethod />
          </QueryState>
        </div>
      </section>
    </div>
  )
}
