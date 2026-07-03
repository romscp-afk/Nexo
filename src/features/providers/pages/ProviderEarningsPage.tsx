import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { DollarSign, TrendingUp } from 'lucide-react'
import { useProviderBookings } from '@/features/bookings/hooks/useBookings'
import { BookingList } from '@/features/bookings/components/BookingUi'
import { QueryState } from '@/features/catalog/components/CatalogUi'
import { formatCurrency } from '@/shared/lib/utils'
import { PLATFORM_FEE_SGD } from '@/shared/lib/marketplaceConfig'

function providerServiceAmount(booking: {
  serviceSubtotal: number | null
  totalPrice: number | null
  platformFee: number | null
}) {
  if (booking.serviceSubtotal != null) return booking.serviceSubtotal
  if (booking.totalPrice != null) {
    return Math.max(0, booking.totalPrice - (booking.platformFee ?? PLATFORM_FEE_SGD))
  }
  return 0
}

export function ProviderEarningsPage() {
  const { data: bookings, isLoading, error } = useProviderBookings()

  const completed = useMemo(
    () => bookings?.filter((b) => b.status === 'completed') ?? [],
    [bookings],
  )

  const inProgress = useMemo(
    () => bookings?.filter((b) => b.status === 'in_progress') ?? [],
    [bookings],
  )

  const confirmed = useMemo(
    () => bookings?.filter((b) => b.status === 'confirmed') ?? [],
    [bookings],
  )

  const totalEarned = completed.reduce((sum, b) => sum + providerServiceAmount(b), 0)
  const pendingPayout = [...inProgress, ...confirmed].reduce(
    (sum, b) => sum + providerServiceAmount(b),
    0,
  )
  const cashJobs = completed.filter((b) => b.paymentMethod === 'cash').length
  const paynowJobs = completed.filter((b) => b.paymentMethod === 'paynow').length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Earnings</h1>
        <p className="mt-1 text-slate-600">
          Track completed job revenue and upcoming work on Nexo.
        </p>
      </div>

      <QueryState loading={isLoading} error={error} empty={false}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="flex items-center gap-1.5 text-sm text-emerald-800">
              <TrendingUp className="h-4 w-4" />
              Total earned
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-900">{formatCurrency(totalEarned)}</p>
            <p className="mt-1 text-xs text-emerald-700">{completed.length} completed jobs</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="flex items-center gap-1.5 text-sm text-slate-500">
              <DollarSign className="h-4 w-4" />
              Upcoming revenue
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(pendingPayout)}</p>
            <p className="mt-1 text-xs text-slate-500">
              {confirmed.length + inProgress.length} confirmed / in progress
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">PayNow jobs</p>
            <p className="mt-1 text-2xl font-bold text-nexo-700">{paynowJobs}</p>
            <p className="text-xs text-slate-500">Customer paid in advance</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-800">Cash jobs</p>
            <p className="mt-1 text-2xl font-bold text-amber-900">{cashJobs}</p>
            <p className="text-xs text-amber-700">Collected on completion</p>
          </div>
        </div>

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Completed jobs</h2>
            <Link to="/provider/bookings" className="text-sm text-nexo-700 hover:underline">
              All bookings
            </Link>
          </div>
          {completed.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              No completed jobs yet. Earnings appear here after you mark services done.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="min-w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Service</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Payment</th>
                    <th className="px-4 py-3 font-medium text-right">You earned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {completed.map((booking) => (
                    <tr key={booking.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Link
                          to={`/provider/bookings/${booking.id}`}
                          className="font-medium text-nexo-700 hover:underline"
                        >
                          {booking.serviceName ?? 'Service'}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {booking.customerName ?? 'Customer'}
                      </td>
                      <td className="px-4 py-3 capitalize text-slate-600">{booking.paymentMethod}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900">
                        {formatCurrency(providerServiceAmount(booking))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {inProgress.length > 0 && (
          <section>
            <h2 className="mb-4 font-semibold text-slate-900">In progress</h2>
            <BookingList
              bookings={inProgress}
              detailPathPrefix="/provider/bookings"
              emptyMessage=""
              showPaymentMethod
            />
          </section>
        )}
      </QueryState>
    </div>
  )
}
