import { useQuery } from '@tanstack/react-query'
import { categoryService } from '@/shared/services/categoryService'

export function useAllServices() {
  return useQuery({
    queryKey: ['catalog', 'all-services'],
    queryFn: async () => {
      const { data, error } = await categoryService.listAllServices()
      if (error) throw new Error(error)
      return data
    },
  })
}
