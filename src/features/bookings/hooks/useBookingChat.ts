import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { chatService } from '@/shared/services/chatService'

export function useBookingMessages(bookingId: string, enabled = true) {
  return useQuery({
    queryKey: ['booking-messages', bookingId],
    queryFn: async () => {
      const { data, error } = await chatService.listForBooking(bookingId)
      if (error) throw new Error(error)
      return data
    },
    enabled: Boolean(bookingId) && enabled,
    refetchInterval: enabled ? 8000 : false,
  })
}

export function useSendBookingMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { bookingId: string; body: string; imageUrl?: string }) => {
      const { data, error } = await chatService.send(input)
      if (error) throw new Error(error)
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['booking-messages', data.bookingId] })
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
