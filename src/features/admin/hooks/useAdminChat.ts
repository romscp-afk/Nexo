import { useQuery } from '@tanstack/react-query'
import { adminChatService } from '@/shared/services/adminChatService'

export function useAdminChatThreads() {
  return useQuery({
    queryKey: ['admin', 'chat-threads'],
    queryFn: async () => {
      const { data, error } = await adminChatService.listThreads()
      if (error) throw new Error(error)
      return data
    },
    refetchInterval: 20000,
  })
}

export function useAdminBookingMessages(bookingId: string) {
  return useQuery({
    queryKey: ['admin', 'chat-messages', bookingId],
    queryFn: async () => {
      const { data, error } = await adminChatService.listMessagesForBooking(bookingId)
      if (error) throw new Error(error)
      return data
    },
    enabled: Boolean(bookingId),
    refetchInterval: 15000,
  })
}
