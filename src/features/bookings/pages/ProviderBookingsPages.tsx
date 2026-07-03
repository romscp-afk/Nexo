import { Link } from 'react-router-dom'
import { useProviderBookings, useOpenProviderRequests } from '@/features/bookings/hooks/useBookings'
import { useChatInbox, useUnreadChatCount } from '@/features/bookings/hooks/useBookingChat'
import { useUnreadNotificationCount } from '@/features/customer/hooks/useNotifications'
import { BookingList } from '@/features/bookings/components/BookingUi'
import { QueryState } from '@/features/catalog/components/CatalogUi'
import { formatCurrency } from '@/shared/lib/utils'

export function ProviderDashboardPage() {
  const { data: bookings, isLoading, error } = useProviderBookings()
  const { data: openRequests } = useOpenProviderRequests()
  const { data: unreadMessages = 0 } = useUnreadChatCount('provider')
  const unreadNotifications = useUnreadNotificationCount()
  const { data: chatThreads } = useChatInbox('provider')
  const unreadByBookingId = Object.fromEntries(
    (chatThreads ?? []).map((t) => [t.bookingId, t.unreadCount]),
  )
  const totalEarned =
    bookings
      ?.filter((b) => b.status === 'completed')
      .reduce((sum, b) => sum + (b.serviceSubtotal ?? Math.max(0, (b.totalPrice ?? 0) - (b.platformFee ?? 3))), 0) ?? 0
  const pending = bookings?.filter((b) => b.status === 'pending') ?? []
  const active = bookings?.filter((b) => ['confirmed', 'in_progress'].includes(b.status)) ?? []
  const cashJobs = bookings?.filter((b) => b.paymentMethod === 'cash' && b.status !== 'cancelled') ?? []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Provider dashboard</h1>
        <p className="mt-1 text-slate-600">Open category requests and your assigned jobs.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
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
        <Link to="/provider/earnings" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 transition hover:border-emerald-300">
          <p className="text-sm text-emerald-800">Total earned</p>
          <p className="mt-1 text-2xl font-bold text-emerald-900">{formatCurrency(totalEarned)}</p>
          <p className="text-xs text-emerald-700">View earnings →</p>
        </Link>
        <Link to="/provider/messages" className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-nexo-200">
          <p className="text-sm text-slate-500">Messages</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{unreadMessages}</p>
          <p className="text-xs text-slate-500">unread</p>
        </Link>
        <Link to="/provider/notifications" className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-nexo-200">
          <p className="text-sm text-slate-500">Notifications</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{unreadNotifications}</p>
          <p className="text-xs text-slate-500">unread</p>
        </Link>
      </div>

      {(chatThreads?.some((t) => t.unreadCount > 0) || (chatThreads?.length ?? 0) > 0) && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Recent messages</h2>
            <Link to="/provider/messages" className="text-sm text-nexo-700 hover:underline">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {chatThreads?.slice(0, 3).map((thread) => (
              <li key={thread.bookingId}>
                <Link
                  to={`/provider/bookings/${thread.bookingId}#chat`}
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
          <BookingList bookings={bookings?.slice(0, 5) ?? []} detailPathPrefix="/provider/bookings" emptyMessage="No bookings yet." showPaymentMethod unreadByBookingId={unreadByBookingId} />
        </QueryState>
      </section>
    </div>
  )
}

export function ProviderBookingsPage() {
  const { data: bookings, isLoading, error } = useProviderBookings()
  const { data: openRequests, isLoading: openLoading, error: openError } = useOpenProviderRequests()
  const { data: chatThreads } = useChatInbox('provider')
  const unreadByBookingId = Object.fromEntries(
    (chatThreads ?? []).map((t) => [t.bookingId, t.unreadCount]),
  )

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
            <BookingList bookings={bookings ?? []} detailPathPrefix="/provider/bookings" emptyMessage="No assigned bookings." showPaymentMethod unreadByBookingId={unreadByBookingId} />
          </QueryState>
        </div>
      </section>
    </div>
  )
}
