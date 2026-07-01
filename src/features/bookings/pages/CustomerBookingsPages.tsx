import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Star } from 'lucide-react'
import { useAuth } from '@/features/auth/context/AuthProvider'
import { useCustomerBookings } from '@/features/bookings/hooks/useBookings'
import { useCustomerReviews } from '@/features/bookings/hooks/useReviews'
import { BookingList } from '@/features/bookings/components/BookingUi'
import { QueryState } from '@/features/catalog/components/CatalogUi'
import { useUnreadNotificationCount } from '@/features/customer/hooks/useNotifications'
import type { Booking } from '@/shared/types/booking'

export function CustomerDashboardPage() {
  const { user } = useAuth()
  const { data: bookings, isLoading, error } = useCustomerBookings()
  const { data: reviews } = useCustomerReviews()
  const unreadNotifications = useUnreadNotificationCount()

  const upcoming = bookings?.filter((b) => !['completed', 'cancelled'].includes(b.status)) ?? []
  const pendingReview = Math.max(
    0,
    (bookings?.filter((b) => b.status === 'completed').length ?? 0) - (reviews?.length ?? 0),
  )
  const recent = bookings?.slice(0, 3) ?? []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}
        </h1>
        <p className="mt-1 text-slate-600">Your home services hub — book, track, and review.</p>
      </div>

      {(user?.preferredArea || user?.addressLine1) && (
        <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
          <div>
            <p className="font-medium text-slate-900">Default service location</p>
            <p className="mt-0.5">
              {user.addressLine1}
              {user.addressLine2 && `, ${user.addressLine2}`}
              {user.postalCode && ` · ${user.postalCode}`}
            </p>
            {user.preferredArea && <p className="text-xs text-slate-500">{user.preferredArea}</p>}
            <Link to="/dashboard/profile" className="mt-1 inline-block text-xs text-teal-700 hover:underline">
              Edit profile →
            </Link>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Active bookings</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{upcoming.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Total bookings</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{bookings?.length ?? 0}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Reviews left</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{reviews?.length ?? 0}</p>
        </div>
        <Link
          to="/dashboard/notifications"
          className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-teal-200"
        >
          <p className="text-sm text-slate-500">Notifications</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{unreadNotifications}</p>
          <p className="text-xs text-slate-500">unread</p>
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link
          to="/providers"
          className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm font-medium text-teal-800 hover:bg-teal-100"
        >
          Book a provider →
        </Link>
        <Link
          to="/dashboard/profile"
          className="rounded-xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Update my profile
        </Link>
        <Link
          to="/dashboard/reviews"
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <Star className="h-4 w-4 text-amber-500" />
          My reviews
        </Link>
      </div>

      {pendingReview > 0 && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          You have completed bookings that may be ready for a review. Check your{' '}
          <Link to="/dashboard/bookings" className="font-medium underline">
            bookings
          </Link>
          .
        </p>
      )}

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

const BOOKING_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
] as const

type BookingFilter = (typeof BOOKING_FILTERS)[number]['id']

function filterBookings(bookings: Booking[] | undefined, filter: BookingFilter) {
  if (!bookings) return []
  switch (filter) {
    case 'active':
      return bookings.filter((b) => !['completed', 'cancelled'].includes(b.status))
    case 'completed':
      return bookings.filter((b) => b.status === 'completed')
    case 'cancelled':
      return bookings.filter((b) => b.status === 'cancelled')
    default:
      return bookings
  }
}

export function CustomerBookingsPage() {
  const { data: bookings, isLoading, error } = useCustomerBookings()
  const [filter, setFilter] = useState<BookingFilter>('all')

  const filtered = filterBookings(bookings, filter)

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">My bookings</h1>
      <p className="mt-1 text-slate-600">Track upcoming jobs and past service history.</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {BOOKING_FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              filter === item.id
                ? 'bg-teal-700 text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <QueryState loading={isLoading} error={error} empty={filtered.length === 0}>
          <BookingList
            bookings={filtered}
            detailPathPrefix="/dashboard/bookings"
            emptyMessage={
              filter === 'all'
                ? 'No bookings yet.'
                : `No ${filter} bookings.`
            }
          />
        </QueryState>
      </div>
    </div>
  )
}
