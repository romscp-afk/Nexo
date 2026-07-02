import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { reviewService } from '@/shared/services/reviewService'
import type { CreateReviewInput } from '@/shared/types/review'

export function useReviewForBooking(bookingId: string) {
  return useQuery({
    queryKey: ['review', bookingId],
    queryFn: async () => {
      const { data, error } = await reviewService.getForBooking(bookingId)
      if (error) throw new Error(error)
      return data
    },
    enabled: Boolean(bookingId),
  })
}

export function useCreateReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateReviewInput) => {
      const { data, error } = await reviewService.create(input)
      if (error) throw new Error(error)
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['review', data.bookingId] })
      void queryClient.invalidateQueries({ queryKey: ['customer-reviews'] })
      void queryClient.invalidateQueries({ queryKey: ['provider-reviews', data.providerId] })
      void queryClient.invalidateQueries({ queryKey: ['public-reviews'] })
      void queryClient.invalidateQueries({ queryKey: ['provider', data.providerId] })
      void queryClient.invalidateQueries({ queryKey: ['providers'] })
    },
  })
}

export function useProviderReviews(providerId: string) {
  return useQuery({
    queryKey: ['provider-reviews', providerId],
    queryFn: async () => {
      const { data, error } = await reviewService.listForProvider(providerId)
      if (error) throw new Error(error)
      return data
    },
    enabled: Boolean(providerId),
  })
}

export function usePublicReviews(limit = 6) {
  return useQuery({
    queryKey: ['public-reviews', limit],
    queryFn: async () => {
      const { data, error } = await reviewService.listRecentPublic(limit)
      if (error) throw new Error(error)
      return data
    },
  })
}

export function useCustomerReviews() {
  return useQuery({
    queryKey: ['customer-reviews'],
    queryFn: async () => {
      const { data, error } = await reviewService.listForCustomer()
      if (error) throw new Error(error)
      return data
    },
  })
}
