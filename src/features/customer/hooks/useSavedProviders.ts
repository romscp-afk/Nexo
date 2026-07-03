import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { savedProviderService } from '@/shared/services/savedProviderService'

export function useSavedProviders() {
  return useQuery({
    queryKey: ['saved-providers'],
    queryFn: async () => {
      const { data, error } = await savedProviderService.list()
      if (error) throw new Error(error)
      return data
    },
  })
}

export function useIsProviderSaved(providerId: string) {
  return useQuery({
    queryKey: ['saved-providers', providerId],
    queryFn: () => savedProviderService.isSaved(providerId),
    enabled: Boolean(providerId),
  })
}

export function useToggleSavedProvider() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ providerId, saved }: { providerId: string; saved: boolean }) => {
      const result = saved
        ? await savedProviderService.remove(providerId)
        : await savedProviderService.save(providerId)
      if (result.error) throw new Error(result.error)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['saved-providers'] })
    },
  })
}
