import { Link, useParams } from 'react-router-dom'
import { Eye, MessageCircle, Shield } from 'lucide-react'
import { useAdminChatThreads, useAdminBookingMessages } from '@/features/admin/hooks/useAdminChat'
import { QueryState } from '@/features/catalog/components/CatalogUi'
import { BOOKING_STATUS_LABELS } from '@/shared/types/booking'
import type { BookingStatus } from '@/shared/types/booking'
import { formatDateTime } from '@/shared/lib/utils'

export function AdminChatsPage() {
  const { data: threads, isLoading, error } = useAdminChatThreads()

  return (
    <div>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-nexo-100 text-nexo-700">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Booking chats</h1>
          <p className="mt-1 text-slate-600">
            Read-only oversight of customer ↔ provider conversations. Admins cannot send messages.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <QueryState
          loading={isLoading}
          error={error}
          empty={!threads?.length}
          emptyMessage="No chat messages yet. Conversations appear after payment is confirmed on bookings."
        >
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {threads?.map((thread) => (
              <li key={thread.bookingId}>
                <Link
                  to={`/admin/chats/${thread.bookingId}`}
                  className="flex items-start gap-4 px-5 py-4 transition hover:bg-slate-50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-slate-900">
                          {thread.customerName} ↔ {thread.providerName ?? 'Provider'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {thread.serviceName ?? 'Service'} ·{' '}
                          {BOOKING_STATUS_LABELS[thread.bookingStatus as BookingStatus] ??
                            thread.bookingStatus}{' '}
                          · {thread.messageCount} message{thread.messageCount === 1 ? '' : 's'}
                        </p>
                      </div>
                      <p className="shrink-0 text-xs text-slate-400">
                        {formatDateTime(thread.lastMessageAt)}
                      </p>
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-600">
                      <span className="font-medium">{thread.lastSenderName}:</span>{' '}
                      {thread.lastMessageBody}
                    </p>
                  </div>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-nexo-700">
                    <Eye className="h-3.5 w-3.5" />
                    View
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </QueryState>
      </div>
    </div>
  )
}

export function AdminChatDetailPage() {
  const { bookingId = '' } = useParams()
  const { data: threads } = useAdminChatThreads()
  const { data: messages, isLoading, error } = useAdminBookingMessages(bookingId)
  const thread = threads?.find((t) => t.bookingId === bookingId)

  return (
    <div>
      <Link to="/admin/chats" className="text-sm text-nexo-700 hover:underline">
        ← All chats
      </Link>

      <div className="mt-4">
        <h1 className="text-2xl font-bold text-slate-900">Chat oversight</h1>
        {thread && (
          <p className="mt-1 text-slate-600">
            {thread.customerName}
            {thread.customerEmail ? ` (${thread.customerEmail})` : ''} ↔ {thread.providerName} ·{' '}
            {thread.serviceName}
          </p>
        )}
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Admin view only — messages are read-only for platform oversight.
        </p>
      </div>

      <div className="mt-6 max-h-[32rem] space-y-3 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4">
        <QueryState loading={isLoading} error={error} empty={!messages?.length}>
          {messages?.map((msg) => (
            <div key={msg.id} className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
              <p className="text-xs font-medium text-slate-500">{msg.senderName}</p>
              <p className="mt-1 text-sm text-slate-800">{msg.body}</p>
              <p className="mt-1 text-[10px] text-slate-400">{formatDateTime(msg.createdAt)}</p>
            </div>
          ))}
        </QueryState>
      </div>

      {thread && (
        <div className="mt-4">
          <Link
            to={`/admin/bookings`}
            className="text-sm text-nexo-700 hover:underline"
          >
            View in bookings list →
          </Link>
        </div>
      )}
    </div>
  )
}
