import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabase'

/** Keep inbox, unread counts, and notifications in sync when new chat messages arrive. */
export function useChatRealtimeSync(enabled = true) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled) return

    const channel = supabase
      .channel('chat-inbox-sync')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'booking_messages' },
        (payload) => {
          const bookingId = (payload.new as { booking_id?: string }).booking_id
          void queryClient.invalidateQueries({ queryKey: ['chat-inbox'] })
          void queryClient.invalidateQueries({ queryKey: ['chat-unread'] })
          void queryClient.invalidateQueries({ queryKey: ['notifications'] })
          if (bookingId) {
            void queryClient.invalidateQueries({ queryKey: ['booking-messages', bookingId] })
          }
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [enabled, queryClient])
}

/** Instant message updates for an open booking chat thread. */
export function useBookingChatRealtime(bookingId: string, enabled = true) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled || !bookingId) return

    const channel = supabase
      .channel(`booking-chat:${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'booking_messages',
          filter: `booking_id=eq.${bookingId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['booking-messages', bookingId] })
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [bookingId, enabled, queryClient])
}
