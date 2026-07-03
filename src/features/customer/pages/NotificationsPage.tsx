import { Link, useNavigate } from 'react-router-dom'
import { Bell, MessageCircle } from 'lucide-react'
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/features/customer/hooks/useNotifications'
import { QueryState } from '@/features/catalog/components/CatalogUi'
import { formatDateTime } from '@/shared/lib/utils'

type Props = {
  role: 'customer' | 'provider'
}

export function NotificationsPage({ role }: Props) {
  const navigate = useNavigate()
  const { data: notifications, isLoading, error } = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()

  const bookingDetailPrefix = role === 'customer' ? '/dashboard/bookings' : '/provider/bookings'
  const unread = notifications?.filter((n) => !n.readAt).length ?? 0

  const handleOpen = (id: string, readAt: string | null, bookingId?: string, isChat?: boolean) => {
    if (!readAt) void markRead.mutate(id)
    if (bookingId) {
      navigate(isChat ? `${bookingDetailPrefix}/${bookingId}#chat` : `${bookingDetailPrefix}/${bookingId}`)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="mt-1 text-slate-600">Booking updates, payments, and chat messages.</p>
        </div>
        {unread > 0 && (
          <button
            type="button"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="mt-6">
        <QueryState
          loading={isLoading}
          error={error}
          empty={!notifications?.length}
          emptyMessage="No notifications yet. You'll see booking and chat updates here."
        >
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {notifications?.map((notification) => {
              const bookingId =
                typeof notification.metadata.booking_id === 'string'
                  ? notification.metadata.booking_id
                  : undefined
              const isChat = notification.metadata.kind === 'chat_message'

              return (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() =>
                      handleOpen(notification.id, notification.readAt, bookingId, isChat)
                    }
                    className={`w-full px-5 py-4 text-left transition hover:bg-slate-50 ${
                      notification.readAt ? '' : 'bg-nexo-50/40'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          isChat ? 'bg-nexo-100 text-nexo-700' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {isChat ? (
                          <MessageCircle className="h-4 w-4" />
                        ) : (
                          <Bell className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-slate-900">{notification.title}</p>
                            <p className="mt-1 text-sm text-slate-600">{notification.body}</p>
                            <p className="mt-2 text-xs text-slate-400">
                              {formatDateTime(notification.createdAt)}
                            </p>
                          </div>
                          {!notification.readAt && (
                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-nexo-600" />
                          )}
                        </div>
                        {bookingId && (
                          <span className="mt-2 inline-block text-xs font-medium text-nexo-700">
                            {isChat ? 'Open chat →' : 'View booking →'}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </QueryState>
      </div>

      {role === 'customer' && (
        <p className="mt-6 text-sm text-slate-500">
          Need a new service?{' '}
          <Link to="/providers" className="font-medium text-nexo-700 hover:underline">
            Browse providers
          </Link>
        </p>
      )}
    </div>
  )
}
