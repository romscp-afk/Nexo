import { useQuery } from '@tanstack/react-query'
import { categoryService } from '@/shared/services/categoryService'

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await categoryService.listCategories()
      if (error) throw new Error(error)
      return data
    },
  })
}

export function useCategory(slug: string) {
  return useQuery({
    queryKey: ['category', slug],
    queryFn: async () => {
      const { data, error } = await categoryService.getCategoryBySlug(slug)
      if (error) throw new Error(error)
      if (!data) throw new Error('Category not found')
      return data
    },
    enabled: Boolean(slug),
  })
}

export function useCategoryServices(categoryId: string | undefined) {
  return useQuery({
    queryKey: ['services', categoryId],
    queryFn: async () => {
      const { data, error } = await categoryService.listServicesByCategory(categoryId!)
      if (error) throw new Error(error)
      return data
    },
    enabled: Boolean(categoryId),
  })
}
