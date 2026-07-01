import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { bookingService } from '@/shared/services/bookingService'
import type { BookingStatus, CreateBookingInput } from '@/shared/types/booking'

export function useCustomerBookings() {
  return useQuery({
    queryKey: ['bookings', 'customer'],
    queryFn: async () => {
      const { data, error } = await bookingService.listForCustomer()
      if (error) throw new Error(error)
      return data
    },
  })
}

export function useProviderBookings() {
  return useQuery({
    queryKey: ['bookings', 'provider'],
    queryFn: async () => {
      const { data, error } = await bookingService.listForProvider()
      if (error) throw new Error(error)
      return data
    },
  })
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: async () => {
      const { data, error } = await bookingService.getById(id)
      if (error) throw new Error(error)
      if (!data) throw new Error('Booking not found')
      return data
    },
    enabled: Boolean(id),
  })
}

export function useCreateBooking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateBookingInput) => {
      const { data, error } = await bookingService.create(input)
      if (error) throw new Error(error)
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['bookings'] })
      void queryClient.invalidateQueries({ queryKey: ['booking', data.id] })
      void queryClient.invalidateQueries({ queryKey: ['booking-history', data.id] })
      void queryClient.invalidateQueries({ queryKey: ['payments', data.id] })
      void queryClient.invalidateQueries({ queryKey: ['payment', data.id] })
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: BookingStatus }) => {
      const { data, error } = await bookingService.updateStatus(id, status)
      if (error) throw new Error(error)
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['bookings'] })
      void queryClient.invalidateQueries({ queryKey: ['booking', data.id] })
      void queryClient.invalidateQueries({ queryKey: ['booking-history', data.id] })
      void queryClient.invalidateQueries({ queryKey: ['payments', data.id] })
      void queryClient.invalidateQueries({ queryKey: ['payment', data.id] })
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
      void queryClient.invalidateQueries({ queryKey: ['admin'] })
    },
  })
}

export function useCancelBooking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await bookingService.cancel(id)
      if (error) throw new Error(error)
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['bookings'] })
      void queryClient.invalidateQueries({ queryKey: ['booking', data.id] })
      void queryClient.invalidateQueries({ queryKey: ['booking-history', data.id] })
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useBookingStatusHistory(bookingId: string) {
  return useQuery({
    queryKey: ['booking-history', bookingId],
    queryFn: async () => {
      const { data, error } = await bookingService.getStatusHistory(bookingId)
      if (error) throw new Error(error)
      return data
    },
    enabled: Boolean(bookingId),
  })
}

export function useOpenProviderRequests() {
  return useQuery({
    queryKey: ['bookings', 'open'],
    queryFn: async () => {
      const { data, error } = await bookingService.listOpenForProvider()
      if (error) throw new Error(error)
      return data
    },
  })
}

export function useAcceptBooking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await bookingService.acceptOpenBooking(id)
      if (error) throw new Error(error)
      if (!data) throw new Error('Accept failed')
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['bookings'] })
      void queryClient.invalidateQueries({ queryKey: ['booking', data.id] })
      void queryClient.invalidateQueries({ queryKey: ['payments', data.id] })
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
      void queryClient.invalidateQueries({ queryKey: ['admin'] })
    },
  })
}
