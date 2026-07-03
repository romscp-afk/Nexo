import { Link } from 'react-router-dom'
import { Lock, MessageCircle } from 'lucide-react'
import { useChatInbox } from '@/features/bookings/hooks/useBookingChat'
import { QueryState } from '@/features/catalog/components/CatalogUi'
import { BOOKING_STATUS_LABELS } from '@/shared/types/booking'
import type { BookingStatus } from '@/shared/types/booking'
import { formatDateTime } from '@/shared/lib/utils'

type Props = {
  role: 'customer' | 'provider'
}

export function BookingChatsPage({ role }: Props) {
  const { data: threads, isLoading, error } = useChatInbox(role)
  const detailPrefix = role === 'customer' ? '/dashboard/bookings' : '/provider/bookings'

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
      <p className="mt-1 text-slate-600">
        {role === 'customer'
          ? 'Chat with your providers after payment is confirmed.'
          : 'Chat with customers on confirmed bookings.'}
      </p>

      <div className="mt-6">
        <QueryState
          loading={isLoading}
          error={error}
          empty={!threads?.length}
          emptyMessage="No conversations yet. Messages appear once you have a booking with a provider and payment is confirmed."
        >
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {threads?.map((thread) => (
              <li key={thread.bookingId}>
                <Link
                  to={`${detailPrefix}/${thread.bookingId}#chat`}
                  className="flex items-start gap-4 px-5 py-4 transition hover:bg-slate-50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-nexo-100 text-nexo-700">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">{thread.counterpartName}</p>
                        <p className="truncate text-xs text-slate-500">
                          {thread.serviceName ?? 'Service'} ·{' '}
                          {BOOKING_STATUS_LABELS[thread.bookingStatus as BookingStatus] ??
                            thread.bookingStatus}
                        </p>
                      </div>
                      {thread.lastMessageAt && (
                        <p className="shrink-0 text-xs text-slate-400">
                          {formatDateTime(thread.lastMessageAt)}
                        </p>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      {thread.chatState === 'locked' && (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                          <Lock className="h-3 w-3" />
                          Awaiting payment
                        </span>
                      )}
                      {thread.chatState === 'read_only' && (
                        <span className="text-xs text-slate-500">Chat closed</span>
                      )}
                      {thread.lastMessageBody ? (
                        <p className="truncate text-sm text-slate-600">{thread.lastMessageBody}</p>
                      ) : (
                        <p className="text-sm text-slate-400 italic">No messages yet</p>
                      )}
                    </div>
                  </div>
                  {thread.unreadCount > 0 && (
                    <span className="mt-1 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-nexo-700 px-1.5 text-xs font-medium text-white">
                      {thread.unreadCount > 99 ? '99+' : thread.unreadCount}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </QueryState>
      </div>
    </div>
  )
}
