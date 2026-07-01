import { supabase } from '@/shared/lib/supabase'
import {
  mapCategory,
  mapService,
  type CatalogService,
  type ServiceCategory,
  type ServiceCategoryRow,
  type ServiceRow,
} from '@/shared/types/catalog'
import type { AuthResult } from '@/shared/services/authService'

export const categoryService = {
  async listCategories(): Promise<AuthResult<ServiceCategory[]>> {
    const { data, error } = await supabase
      .from('service_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) return { data: [], error: error.message }
    return {
      data: (data as ServiceCategoryRow[]).map(mapCategory),
      error: null,
    }
  },

  async getCategoryBySlug(slug: string): Promise<AuthResult<ServiceCategory | null>> {
    const { data, error } = await supabase
      .from('service_categories')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle()

    if (error) return { data: null, error: error.message }
    return {
      data: data ? mapCategory(data as ServiceCategoryRow) : null,
      error: null,
    }
  },

  async listServicesByCategory(categoryId: string): Promise<AuthResult<CatalogService[]>> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) return { data: [], error: error.message }
    return {
      data: (data as ServiceRow[]).map(mapService),
      error: null,
    }
  },

  async listAllServices(): Promise<AuthResult<CatalogService[]>> {
    const { data, error } = await supabase
      .from('services')
      .select('*, service_categories ( name, slug )')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) return { data: [], error: error.message }

    return {
      data: (data as (ServiceRow & { service_categories: { name: string; slug: string } | null })[]).map(
        (row) => ({
          ...mapService(row),
          categoryName: row.service_categories?.name ?? '',
          categorySlug: row.service_categories?.slug ?? '',
        }),
      ),
      error: null,
    }
  },
}
