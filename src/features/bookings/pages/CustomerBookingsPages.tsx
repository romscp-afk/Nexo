import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Star } from 'lucide-react'
import { useAuth } from '@/features/auth/context/AuthProvider'
import { useCustomerBookings } from '@/features/bookings/hooks/useBookings'
import { useCustomerReviews } from '@/features/bookings/hooks/useReviews'
import { useProviders } from '@/features/providers/hooks/useProviders'
import { ProviderCard } from '@/features/providers/components/ProviderCard'
import { BookingList } from '@/features/bookings/components/BookingUi'
import { QueryState } from '@/features/catalog/components/CatalogUi'
import { useSavedProviders } from '@/features/customer/hooks/useSavedProviders'
import { useUnreadNotificationCount } from '@/features/customer/hooks/useNotifications'
import { useChatInbox, useUnreadChatCount } from '@/features/bookings/hooks/useBookingChat'
import type { Booking } from '@/shared/types/booking'

export function CustomerDashboardPage() {
  const { user } = useAuth()
  const { data: bookings, isLoading, error } = useCustomerBookings()
  const { data: reviews } = useCustomerReviews()
  const unreadNotifications = useUnreadNotificationCount()
  const { data: unreadMessages = 0 } = useUnreadChatCount('customer')
  const { data: chatThreads } = useChatInbox('customer')

  const unreadByBookingId = Object.fromEntries(
    (chatThreads ?? []).map((t) => [t.bookingId, t.unreadCount]),
  )
  const { data: savedProviders } = useSavedProviders()

  const providerFilters = user?.preferredArea ? { area: user.preferredArea } : {}
  const {
    data: nearbyProviders,
    isLoading: providersLoading,
    error: providersError,
  } = useProviders(providerFilters)
  const { data: allProviders, isLoading: allProvidersLoading } = useProviders({})

  const recommendedProviders =
    (nearbyProviders?.length ? nearbyProviders : allProviders)?.slice(0, 4) ?? []
  const showingAllAreas = Boolean(user?.preferredArea) && !nearbyProviders?.length && Boolean(allProviders?.length)

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
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-nexo-700" />
          <div>
            <p className="font-medium text-slate-900">Default service location</p>
            <p className="mt-0.5">
              {user.addressLine1}
              {user.addressLine2 && `, ${user.addressLine2}`}
              {user.postalCode && ` · ${user.postalCode}`}
            </p>
            {user.preferredArea && <p className="text-xs text-slate-500">{user.preferredArea}</p>}
            <Link to="/dashboard/profile" className="mt-1 inline-block text-xs text-nexo-700 hover:underline">
              Edit profile →
            </Link>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Active bookings</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{upcoming.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Total bookings</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{bookings?.length ?? 0}</p>
        </div>
        <Link to="/dashboard/saved-providers" className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-nexo-200">
          <p className="text-sm text-slate-500">Saved providers</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{savedProviders?.length ?? 0}</p>
        </Link>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Reviews left</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{reviews?.length ?? 0}</p>
        </div>
        <Link
          to="/dashboard/messages"
          className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-nexo-200"
        >
          <p className="text-sm text-slate-500">Messages</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{unreadMessages}</p>
          <p className="text-xs text-slate-500">unread</p>
        </Link>
        <Link
          to="/dashboard/notifications"
          className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-nexo-200"
        >
          <p className="text-sm text-slate-500">Notifications</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{unreadNotifications}</p>
          <p className="text-xs text-slate-500">unread</p>
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link
          to={user?.preferredArea ? `/providers?area=${encodeURIComponent(user.preferredArea)}` : '/providers'}
          className="rounded-xl border border-nexo-200 bg-nexo-50 p-4 text-sm font-medium text-nexo-800 hover:bg-nexo-100"
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

      {(chatThreads?.some((t) => t.unreadCount > 0) || (chatThreads?.length ?? 0) > 0) && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Recent messages</h2>
            <Link to="/dashboard/messages" className="text-sm text-nexo-700 hover:underline">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {chatThreads?.slice(0, 3).map((thread) => (
              <li key={thread.bookingId}>
                <Link
                  to={`/dashboard/bookings/${thread.bookingId}#chat`}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{thread.counterpartName}</p>
                    <p className="truncate text-sm text-slate-500">
                      {thread.lastMessageBody ?? 'No messages yet'}
                    </p>
                  </div>
                  {thread.unreadCount > 0 && (
                    <span className="shrink-0 rounded-full bg-nexo-700 px-2 py-0.5 text-xs text-white">
                      {thread.unreadCount}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">
              {user?.preferredArea && nearbyProviders?.length
                ? `Providers near ${user.preferredArea}`
                : 'Recommended providers'}
            </h2>
            <p className="text-sm text-slate-600">
              {showingAllAreas
                ? `No providers in ${user?.preferredArea} yet — showing all available providers.`
                : 'Browse verified professionals and book a service.'}
            </p>
          </div>
          <Link
            to={
              user?.preferredArea
                ? `/providers?area=${encodeURIComponent(user.preferredArea)}`
                : '/providers'
            }
            className="text-sm text-nexo-700 hover:underline"
          >
            View all
          </Link>
        </div>
        <QueryState
          loading={providersLoading || allProvidersLoading}
          error={providersError}
          empty={!recommendedProviders.length}
          emptyMessage={
            user?.preferredArea
              ? `No providers in ${user.preferredArea} yet. Try All areas on the providers page.`
              : 'No providers yet. Run supabase/seed-demo.sql in the Supabase SQL Editor.'
          }
        >
          <div className="grid gap-4 lg:grid-cols-2">
            {recommendedProviders.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </div>
        </QueryState>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Recent bookings</h2>
          <Link to="/dashboard/bookings" className="text-sm text-nexo-700 hover:underline">
            View all
          </Link>
        </div>
        <QueryState loading={isLoading} error={error} empty={recent.length === 0}>
          <BookingList
            bookings={recent}
            detailPathPrefix="/dashboard/bookings"
            emptyMessage="No bookings yet. Browse providers to schedule your first service."
            unreadByBookingId={unreadByBookingId}
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
  const { data: chatThreads } = useChatInbox('customer')
  const unreadByBookingId = Object.fromEntries(
    (chatThreads ?? []).map((t) => [t.bookingId, t.unreadCount]),
  )

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
                ? 'bg-nexo-700 text-white'
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
            unreadByBookingId={unreadByBookingId}
          />
        </QueryState>
      </div>
    </div>
  )
}
