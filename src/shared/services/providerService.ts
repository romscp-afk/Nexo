import { supabase } from '@/shared/lib/supabase'
import {
  mapProviderListing,
  type ProviderFilters,
  type ProviderListing,
  type ProviderRow,
  type ProviderServiceSummary,
} from '@/shared/types/catalog'
import type { AuthResult } from '@/shared/services/authService'

type ProviderServiceJoin = {
  price_from: number
  services: {
    id: string
    name: string
    slug: string
    service_categories: {
      slug: string
      name: string
    } | null
  } | null
}

type ProviderWithServices = ProviderRow & {
  provider_services: ProviderServiceJoin[] | null
}

function mapProviderServices(rows: ProviderServiceJoin[] | null): ProviderServiceSummary[] {
  if (!rows) return []
  return rows
    .filter((row) => row.services?.service_categories)
    .map((row) => ({
      serviceId: row.services!.id,
      name: row.services!.name,
      slug: row.services!.slug,
      categorySlug: row.services!.service_categories!.slug,
      categoryName: row.services!.service_categories!.name,
      priceFrom: Number(row.price_from),
    }))
}

function applyFilters(providers: ProviderListing[], filters: ProviderFilters): ProviderListing[] {
  return providers.filter((provider) => {
    if (filters.verifiedOnly && !provider.isVerified) return false
    if (filters.area) {
      const area = filters.area.toLowerCase()
      const matches = provider.serviceAreas.some((a) => a.toLowerCase().includes(area))
      if (!matches) return false
    }
    if (filters.categorySlug) {
      const matches = provider.services.some((s) => s.categorySlug === filters.categorySlug)
      if (!matches) return false
    }
    return true
  })
}

export type UpdateProviderInput = {
  businessName: string
  bio?: string
  yearsExperience: number
  hourlyRate: number
  serviceAreas: string[]
}

async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}

export const providerService = {
  async listProviders(filters: ProviderFilters = {}): Promise<AuthResult<ProviderListing[]>> {
    const { data, error } = await supabase
      .from('providers')
      .select(
        `
        *,
        provider_services (
          price_from,
          services (
            id,
            name,
            slug,
            service_categories ( slug, name )
          )
        )
      `,
      )
      .eq('is_active', true)
      .order('rating_avg', { ascending: false })

    if (error) return { data: [], error: error.message }

    const listings = (data as ProviderWithServices[]).map((row) => {
      const { provider_services, ...provider } = row
      return mapProviderListing(provider, mapProviderServices(provider_services))
    })

    return {
      data: applyFilters(listings, filters),
      error: null,
    }
  },

  async getProviderById(id: string): Promise<AuthResult<ProviderListing | null>> {
    const { data, error } = await supabase
      .from('providers')
      .select(
        `
        *,
        provider_services (
          price_from,
          services (
            id,
            name,
            slug,
            service_categories ( slug, name )
          )
        )
      `,
      )
      .eq('id', id)
      .eq('is_active', true)
      .maybeSingle()

    if (error) return { data: null, error: error.message }
    if (!data) return { data: null, error: null }

    const row = data as ProviderWithServices
    const { provider_services, ...provider } = row
    return {
      data: mapProviderListing(provider, mapProviderServices(provider_services)),
      error: null,
    }
  },

  async getMyProvider(): Promise<AuthResult<ProviderListing | null>> {
    const userId = await getCurrentUserId()
    if (!userId) return { data: null, error: 'Not authenticated' }

    const { data, error } = await supabase
      .from('providers')
      .select(
        `
        *,
        provider_services (
          price_from,
          services (
            id,
            name,
            slug,
            service_categories ( slug, name )
          )
        )
      `,
      )
      .eq('user_id', userId)
      .maybeSingle()

    if (error) return { data: null, error: error.message }
    if (!data) return { data: null, error: null }

    const row = data as ProviderWithServices
    const { provider_services, ...provider } = row
    return {
      data: mapProviderListing(provider, mapProviderServices(provider_services)),
      error: null,
    }
  },

  async updateMyProvider(input: UpdateProviderInput): Promise<AuthResult<ProviderListing>> {
    const userId = await getCurrentUserId()
    if (!userId) return { data: null as unknown as ProviderListing, error: 'Not authenticated' }

    const { data, error } = await supabase
      .from('providers')
      .update({
        business_name: input.businessName,
        bio: input.bio ?? null,
        years_experience: input.yearsExperience,
        hourly_rate: input.hourlyRate,
        service_areas: input.serviceAreas,
      })
      .eq('user_id', userId)
      .select('*')
      .single()

    if (error) return { data: null as unknown as ProviderListing, error: error.message }
    return { data: mapProviderListing(data as ProviderRow), error: null }
  },
}
