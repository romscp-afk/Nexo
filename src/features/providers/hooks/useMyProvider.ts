import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { providerService, type UpdateProviderInput } from '@/shared/services/providerService'

export function useMyProvider() {
  return useQuery({
    queryKey: ['my-provider'],
    queryFn: async () => {
      const { data, error } = await providerService.getMyProvider()
      if (error) throw new Error(error)
      return data
    },
  })
}

export function useUpdateMyProvider() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateProviderInput) => {
      const { data, error } = await providerService.updateMyProvider(input)
      if (error) throw new Error(error)
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-provider'] })
      void queryClient.invalidateQueries({ queryKey: ['providers'] })
    },
  })
}
