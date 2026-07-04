import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { providerAvailabilityService } from '@/shared/services/providerAvailabilityService'
import type { WeeklyHourInput } from '@/shared/types/availability'

export function useProviderWeeklyHours(providerId: string) {
  return useQuery({
    queryKey: ['provider-weekly-hours', providerId],
    queryFn: async () => {
      const { data, error } = await providerAvailabilityService.getWeeklyHours(providerId)
      if (error) throw new Error(error)
      return data
    },
    enabled: Boolean(providerId),
  })
}

export function useMyWeeklyHours() {
  return useQuery({
    queryKey: ['provider-weekly-hours', 'mine'],
    queryFn: async () => {
      const { data, error } = await providerAvailabilityService.getMyWeeklyHours()
      if (error) throw new Error(error)
      return data
    },
  })
}

export function useUpdateMyWeeklyHours() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (hours: WeeklyHourInput[]) => {
      const { data, error } = await providerAvailabilityService.updateMyWeeklyHours(hours)
      if (error) throw new Error(error)
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['provider-weekly-hours'] })
    },
  })
}

export function useCheckProviderSlot() {
  return useMutation({
    mutationFn: async ({
      providerId,
      scheduledAt,
      durationHours,
      excludeBookingId,
    }: {
      providerId: string
      scheduledAt: string
      durationHours: number
      excludeBookingId?: string
    }) => {
      const { data, error } = await providerAvailabilityService.checkSlot(
        providerId,
        scheduledAt,
        durationHours,
        excludeBookingId,
      )
      if (error) throw new Error(error)
      return data
    },
  })
}

export function useMyTimeOff() {
  return useQuery({
    queryKey: ['provider-time-off', 'mine'],
    queryFn: async () => {
      const { data, error } = await providerAvailabilityService.listMyTimeOff()
      if (error) throw new Error(error)
      return data
    },
  })
}

export function useAddTimeOff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { startAt: string; endAt: string; label?: string }) => {
      const { data, error } = await providerAvailabilityService.addTimeOff(input)
      if (error) throw new Error(error)
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['provider-time-off'] })
    },
  })
}

export function useDeleteTimeOff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await providerAvailabilityService.deleteTimeOff(id)
      if (error) throw new Error(error)
      return id
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['provider-time-off'] })
    },
  })
}
