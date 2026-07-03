import { useState } from 'react'
import { MessageCircle, Send } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '@/features/auth/context/AuthProvider'
import { useBookingMessages, useSendBookingMessage } from '@/features/bookings/hooks/useBookingChat'
import {
  canSendBookingChatMessage,
  shouldLoadBookingChatMessages,
  type BookingChatAccess,
} from '@/shared/lib/bookingChat'
import { formatDateTime } from '@/shared/lib/utils'

export function BookingChatPanel({
  bookingId,
  access,
  role,
}: {
  bookingId: string
  access: BookingChatAccess
  role: 'customer' | 'provider'
}) {
  const { user } = useAuth()
  const loadMessages = shouldLoadBookingChatMessages(access)
  const { data: messages, isLoading } = useBookingMessages(bookingId, loadMessages)
  const sendMessage = useSendBookingMessage()
  const [body, setBody] = useState('')
  const [error, setError] = useState('')

  const canSend = canSendBookingChatMessage(access)
  const title = role === 'customer' ? 'Chat with provider' : 'Chat with customer'

  if (access.state === 'hidden') {
    return null
  }

  if (access.state === 'locked') {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900">
          <MessageCircle className="h-5 w-5 text-slate-400" />
          {title}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          {access.reason ?? 'Chat is not available for this booking yet.'}
        </p>
      </section>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim() || !canSend) return
    setError('')
    try {
      await sendMessage.mutateAsync({ bookingId, body: body.trim() })
      setBody('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send message')
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="flex items-center gap-2 font-semibold text-slate-900">
        <MessageCircle className="h-5 w-5 text-nexo-700" />
        {title}
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        {access.state === 'read_only'
          ? 'This chat is closed. You can still read past messages.'
          : access.closesAt
            ? `Chat closes ${formatDistanceToNow(new Date(access.closesAt), { addSuffix: true })} (6 hours after job completion).`
            : 'Coordinate job details here. Messages are saved for this booking.'}
      </p>

      <div className="mt-4 max-h-64 space-y-3 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50 p-3">
        {isLoading && <p className="text-sm text-slate-500">Loading messages…</p>}
        {!isLoading && !messages?.length && (
          <p className="text-sm text-slate-500">
            {canSend ? 'No messages yet. Start the conversation.' : 'No messages were sent in this chat.'}
          </p>
        )}
        {messages?.map((msg) => {
          const isMine = msg.senderId === user?.id
          return (
            <div
              key={msg.id}
              className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  isMine ? 'bg-nexo-700 text-white' : 'bg-white text-slate-800 ring-1 ring-slate-200'
                }`}
              >
                {!isMine && msg.senderName && (
                  <p className="mb-0.5 text-xs font-medium opacity-80">{msg.senderName}</p>
                )}
                <p>{msg.body}</p>
                {msg.imageUrl && (
                  <a href={msg.imageUrl} target="_blank" rel="noreferrer" className="mt-1 block underline">
                    View image
                  </a>
                )}
                <p className={`mt-1 text-[10px] ${isMine ? 'text-nexo-200' : 'text-slate-400'}`}>
                  {formatDateTime(msg.createdAt)}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {access.state === 'read_only' && access.closedAt && (
        <p className="mt-3 text-xs text-slate-500">
          Chat closed on {formatDateTime(access.closedAt)}.
        </p>
      )}

      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}

      {canSend && (
        <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
          <input
            type="text"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={sendMessage.isPending || !body.trim()}
            className="inline-flex items-center gap-1 rounded-lg bg-nexo-700 px-3 py-2 text-sm font-medium text-white hover:bg-nexo-800 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            Send
          </button>
        </form>
      )}
    </section>
  )
}
