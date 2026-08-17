import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminService } from '@/shared/services/adminService'
import { adminProviderMessageService } from '@/shared/services/adminProviderMessageService'

export function useAdminProvider(providerId: string) {
  return useQuery({
    queryKey: ['admin', 'provider', providerId],
    queryFn: async () => {
      const { data, error } = await adminService.getProviderById(providerId)
      if (error) throw new Error(error)
      return data
    },
    enabled: Boolean(providerId),
  })
}

export function useAdminProviderMessages(providerId: string) {
  return useQuery({
    queryKey: ['admin', 'provider-messages', providerId],
    queryFn: async () => {
      const { data, error } = await adminProviderMessageService.listForProvider(providerId)
      if (error) throw new Error(error)
      return data
    },
    enabled: Boolean(providerId),
    refetchInterval: 15_000,
  })
}

export function useSendAdminProviderMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ providerId, body }: { providerId: string; body: string }) => {
      const { data, error } = await adminProviderMessageService.send(providerId, body)
      if (error) throw new Error(error)
      return data
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['admin', 'provider-messages', variables.providerId],
      })
    },
  })
}
