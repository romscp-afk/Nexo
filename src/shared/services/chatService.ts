import { supabase } from '@/shared/lib/supabase'
import type { AuthResult } from '@/shared/services/authService'
import { mapBookingMessage, type BookingMessage, type BookingMessageRow } from '@/shared/types/chat'

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
}
