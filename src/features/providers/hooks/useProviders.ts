import { useQuery } from '@tanstack/react-query'
import { providerService } from '@/shared/services/providerService'
import type { ProviderFilters } from '@/shared/types/catalog'

export function useProviders(filters: ProviderFilters = {}) {
  return useQuery({
    queryKey: ['providers', filters],
    queryFn: async () => {
      const { data, error } = await providerService.listProviders(filters)
      if (error) throw new Error(error)
      return data
    },
  })
}

export function useProvider(id: string) {
  return useQuery({
    queryKey: ['provider', id],
    queryFn: async () => {
      const { data, error } = await providerService.getProviderById(id)
      if (error) throw new Error(error)
      if (!data) throw new Error('Provider not found')
      return data
    },
    enabled: Boolean(id),
  })
}
