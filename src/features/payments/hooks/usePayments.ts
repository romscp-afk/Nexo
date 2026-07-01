import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { paymentService } from '@/shared/services/paymentService'
import type { PaymentKind } from '@/shared/types/payment'

export function useBookingPayments(bookingId: string) {
  return useQuery({
    queryKey: ['payments', bookingId],
    queryFn: async () => {
      const { data, error } = await paymentService.getForBooking(bookingId)
      if (error) throw new Error(error)
      return data
    },
    enabled: Boolean(bookingId),
  })
}

export function useBookingPayment(bookingId: string, kind: PaymentKind = 'customer_advance') {
  return useQuery({
    queryKey: ['payment', bookingId, kind],
    queryFn: async () => {
      const { data, error } = await paymentService.getByBookingId(bookingId, kind)
      if (error) throw new Error(error)
      return data
    },
    enabled: Boolean(bookingId),
  })
}

export function useSubmitPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ paymentId, note }: { paymentId: string; note?: string }) => {
      const { data, error } = await paymentService.submitPayment(paymentId, note)
      if (error) throw new Error(error)
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['payments', data.bookingId] })
      void queryClient.invalidateQueries({ queryKey: ['payment', data.bookingId] })
      void queryClient.invalidateQueries({ queryKey: ['admin'] })
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useSubmitProviderAdminFee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ paymentId, note }: { paymentId: string; note?: string }) => {
      const { data, error } = await paymentService.submitProviderAdminFee(paymentId, note)
      if (error) throw new Error(error)
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['payments', data.bookingId] })
      void queryClient.invalidateQueries({ queryKey: ['payment', data.bookingId] })
      void queryClient.invalidateQueries({ queryKey: ['admin'] })
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useAdminPayments() {
  return useQuery({
    queryKey: ['admin', 'payments'],
    queryFn: async () => {
      const { data, error } = await paymentService.listForAdmin()
      if (error) throw new Error(error)
      return data
    },
  })
}

export function useConfirmPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (paymentId: string) => {
      const { data, error } = await paymentService.confirmPayment(paymentId)
      if (error) throw new Error(error)
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['payments', data.bookingId] })
      void queryClient.invalidateQueries({ queryKey: ['payment', data.bookingId] })
      void queryClient.invalidateQueries({ queryKey: ['booking', data.bookingId] })
      void queryClient.invalidateQueries({ queryKey: ['receipts', data.bookingId] })
      void queryClient.invalidateQueries({ queryKey: ['admin'] })
      void queryClient.invalidateQueries({ queryKey: ['bookings'] })
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
