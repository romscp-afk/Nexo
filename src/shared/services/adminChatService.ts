import { supabase } from '@/shared/lib/supabase'
import type { AuthResult } from '@/shared/services/authService'
import { mapBookingMessage, type BookingMessage, type BookingMessageRow } from '@/shared/types/chat'
import type { AdminChatThread } from '@/shared/types/admin'

export const adminChatService = {
  async listThreads(): Promise<AuthResult<AdminChatThread[]>> {
    const { data: messages, error } = await supabase
      .from('booking_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) return { data: [], error: error.message }

    const rows = messages as BookingMessageRow[]
    const bookingIds = [...new Set(rows.map((r) => r.booking_id))]
    if (!bookingIds.length) return { data: [], error: null }

    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(
        `
        id,
        status,
        customer_id,
        provider_id,
        services ( name ),
        providers ( business_name )
      `,
      )
      .in('id', bookingIds)

    if (bookingsError) return { data: [], error: bookingsError.message }

    const customerIds = [...new Set((bookings ?? []).map((b) => b.customer_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, email, role')
      .in('user_id', [
        ...customerIds,
        ...rows.map((r) => r.sender_id),
      ])

    const profileMap = new Map(
      (profiles ?? []).map((p) => [
        p.user_id as string,
        { name: p.full_name as string, email: p.email as string },
      ]),
    )

    const bookingMap = new Map(
      (bookings ?? []).map((b) => [
        b.id as string,
        {
          status: b.status as string,
          serviceName: (b.services as { name: string } | null)?.name ?? null,
          providerName: (b.providers as { business_name: string } | null)?.business_name ?? null,
          customerName: profileMap.get(b.customer_id as string)?.name ?? 'Customer',
          customerEmail: profileMap.get(b.customer_id as string)?.email ?? null,
        },
      ]),
    )

    const threadMap = new Map<string, AdminChatThread>()
    for (const row of rows) {
      const existing = threadMap.get(row.booking_id)
      const booking = bookingMap.get(row.booking_id)
      const sender = profileMap.get(row.sender_id)
      if (!existing) {
        threadMap.set(row.booking_id, {
          bookingId: row.booking_id,
          messageCount: 1,
          lastMessageBody: row.body,
          lastMessageAt: row.created_at,
          lastSenderName: sender?.name ?? 'User',
          bookingStatus: booking?.status ?? 'unknown',
          serviceName: booking?.serviceName ?? null,
          providerName: booking?.providerName ?? null,
          customerName: booking?.customerName ?? 'Customer',
          customerEmail: booking?.customerEmail ?? null,
        })
      } else {
        existing.messageCount += 1
      }
    }

    return {
      data: [...threadMap.values()].sort(
        (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
      ),
      error: null,
    }
  },

  async listMessagesForBooking(bookingId: string): Promise<AuthResult<BookingMessage[]>> {
    const { data, error } = await supabase
      .from('booking_messages')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true })

    if (error) return { data: [], error: error.message }

    const rows = data as BookingMessageRow[]
    const senderIds = [...new Set(rows.map((r) => r.sender_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, role')
      .in('user_id', senderIds)

    const names = new Map(
      (profiles ?? []).map((p) => [p.user_id as string, p.full_name as string]),
    )
    const roles = new Map(
      (profiles ?? []).map((p) => [p.user_id as string, p.role as string]),
    )

    return {
      data: rows.map((row) =>
        mapBookingMessage(row, {
          senderName: `${names.get(row.sender_id) ?? 'User'}${roles.get(row.sender_id) ? ` (${roles.get(row.sender_id)})` : ''}`,
        }),
      ),
      error: null,
    }
  },
}
