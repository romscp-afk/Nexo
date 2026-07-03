import { supabase } from '@/shared/lib/supabase'
import type { AuthResult } from '@/shared/services/authService'
import { paymentService, type BookingPayments } from '@/shared/services/paymentService'
import { bookingService } from '@/shared/services/bookingService'
import { getBookingChatAccess } from '@/shared/lib/bookingChat'
import {
  mapBookingMessage,
  type BookingMessage,
  type BookingMessageRow,
  type ChatThread,
} from '@/shared/types/chat'

async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}

function mapChatState(access: ReturnType<typeof getBookingChatAccess>): ChatThread['chatState'] {
  if (access.state === 'active') return 'active'
  if (access.state === 'read_only') return 'read_only'
  return 'locked'
}

export const chatService = {
  async listForBooking(bookingId: string): Promise<AuthResult<BookingMessage[]>> {
    const { data, error } = await supabase
      .from('booking_messages')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true })

    if (error) {
      if (error.message.includes('booking_messages')) {
        return { data: [], error: null }
      }
      return { data: [], error: error.message }
    }

    const rows = data as BookingMessageRow[]
    const senderIds = [...new Set(rows.map((r) => r.sender_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .in('user_id', senderIds)

    const names = new Map(
      (profiles ?? []).map((p) => [p.user_id as string, p.full_name as string]),
    )

    return {
      data: rows.map((row) =>
        mapBookingMessage(row, { senderName: names.get(row.sender_id) }),
      ),
      error: null,
    }
  },

  async send(input: {
    bookingId: string
    body: string
    imageUrl?: string
  }): Promise<AuthResult<BookingMessage>> {
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id
    if (!userId) return { data: null as unknown as BookingMessage, error: 'Not authenticated' }

    const { data, error } = await supabase
      .from('booking_messages')
      .insert({
        booking_id: input.bookingId,
        sender_id: userId,
        body: input.body.trim(),
        image_url: input.imageUrl ?? null,
      })
      .select('*')
      .single()

    if (error) return { data: null as unknown as BookingMessage, error: error.message }
    return { data: mapBookingMessage(data as BookingMessageRow), error: null }
  },

  async markBookingRead(bookingId: string): Promise<AuthResult<void>> {
    const userId = await getCurrentUserId()
    if (!userId) return { data: undefined, error: 'Not authenticated' }

    const now = new Date().toISOString()
    const { error } = await supabase.from('booking_message_reads').upsert(
      {
        booking_id: bookingId,
        user_id: userId,
        last_read_at: now,
      },
      { onConflict: 'booking_id,user_id' },
    )

    if (error?.message?.includes('booking_message_reads')) {
      return { data: undefined, error: null }
    }
    return { data: undefined, error: error?.message ?? null }
  },

  async getUnreadCounts(bookingIds: string[]): Promise<AuthResult<Record<string, number>>> {
    const userId = await getCurrentUserId()
    if (!userId || bookingIds.length === 0) return { data: {}, error: null }

    const { data: reads, error: readsError } = await supabase
      .from('booking_message_reads')
      .select('booking_id, last_read_at')
      .eq('user_id', userId)
      .in('booking_id', bookingIds)

    if (readsError?.message?.includes('booking_message_reads')) {
      return { data: {}, error: null }
    }
    if (readsError) return { data: {}, error: readsError.message }

    const readMap = new Map(
      (reads ?? []).map((row) => [row.booking_id as string, row.last_read_at as string]),
    )

    const { data: messages, error: messagesError } = await supabase
      .from('booking_messages')
      .select('booking_id, sender_id, created_at')
      .in('booking_id', bookingIds)

    if (messagesError) return { data: {}, error: messagesError.message }

    const counts: Record<string, number> = {}
    for (const id of bookingIds) counts[id] = 0

    for (const msg of messages ?? []) {
      const bookingId = msg.booking_id as string
      if (msg.sender_id === userId) continue
      const lastRead = readMap.get(bookingId)
      if (!lastRead || new Date(msg.created_at as string) > new Date(lastRead)) {
        counts[bookingId] = (counts[bookingId] ?? 0) + 1
      }
    }

    return { data: counts, error: null }
  },

  async listInbox(role: 'customer' | 'provider'): Promise<AuthResult<ChatThread[]>> {
    const userId = await getCurrentUserId()
    if (!userId) return { data: [], error: 'Not authenticated' }

    const bookingsResult =
      role === 'customer'
        ? await bookingService.listForCustomer()
        : await bookingService.listForProvider()

    if (bookingsResult.error) return { data: [], error: bookingsResult.error }

    const bookings = (bookingsResult.data ?? []).filter(
      (b) => b.providerId && b.status !== 'cancelled',
    )

    if (!bookings.length) return { data: [], error: null }

    const bookingIds = bookings.map((b) => b.id)
    const paymentsByBooking = new Map<string, BookingPayments>()

    await Promise.all(
      bookingIds.map(async (id) => {
        const { data } = await paymentService.getForBooking(id)
        if (data) paymentsByBooking.set(id, data)
      }),
    )

    const { data: allMessages, error: messagesError } = await supabase
      .from('booking_messages')
      .select('id, booking_id, sender_id, body, created_at')
      .in('booking_id', bookingIds)
      .order('created_at', { ascending: false })

    if (messagesError && !messagesError.message.includes('booking_messages')) {
      return { data: [], error: messagesError.message }
    }

    const lastByBooking = new Map<string, BookingMessageRow>()
    for (const row of (allMessages ?? []) as BookingMessageRow[]) {
      if (!lastByBooking.has(row.booking_id)) {
        lastByBooking.set(row.booking_id, row)
      }
    }

    const { data: unreadCounts } = await chatService.getUnreadCounts(bookingIds)

    const customerNames = new Map<string, string>()
    if (role === 'provider') {
      const customerIds = [...new Set(bookings.map((b) => b.customerId))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', customerIds)
      for (const p of profiles ?? []) {
        customerNames.set(p.user_id as string, p.full_name as string)
      }
    }

    const threads: ChatThread[] = bookings.map((booking) => {
      const payments = paymentsByBooking.get(booking.id) ?? null
      const access = getBookingChatAccess({ booking, payments })
      const last = lastByBooking.get(booking.id)
      const counterpartName =
        role === 'customer'
          ? (booking.providerName ?? 'Provider')
          : (booking.customerName ?? customerNames.get(booking.customerId) ?? 'Customer')

      return {
        bookingId: booking.id,
        counterpartName,
        serviceName: booking.serviceName ?? null,
        bookingStatus: booking.status,
        lastMessageBody: last?.body ?? null,
        lastMessageAt: last?.created_at ?? null,
        lastSenderId: last?.sender_id ?? null,
        unreadCount: unreadCounts?.[booking.id] ?? 0,
        chatState: mapChatState(access),
      }
    })

    threads.sort((a, b) => {
      if (a.unreadCount !== b.unreadCount) return b.unreadCount - a.unreadCount
      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
      return bTime - aTime
    })

    return { data: threads, error: null }
  },

  async getTotalUnreadCount(role: 'customer' | 'provider'): Promise<AuthResult<number>> {
    const { data, error } = await chatService.listInbox(role)
    if (error) return { data: 0, error }
    const total = (data ?? []).reduce((sum, thread) => sum + thread.unreadCount, 0)
    return { data: total, error: null }
  },
}
