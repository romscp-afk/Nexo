import { supabase } from '@/shared/lib/supabase'
import { parseUnitPrices } from '@/shared/lib/pricing'
import {
  mapProviderListing,
  type ProviderFilters,
  type ProviderListing,
  type ProviderRow,
  type ProviderServiceSummary,
  type PricingModel,
  type UnitPrices,
} from '@/shared/types/catalog'
import type { AuthResult } from '@/shared/services/authService'

type ProviderServiceJoin = {
  price_from: number
  unit_prices: Record<string, number> | null
  services: {
    id: string
    name: string
    slug: string
    pricing_model: PricingModel | null
    unit_label: string | null
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
      pricingModel: row.services!.pricing_model ?? 'hourly',
      unitLabel: row.services!.unit_label,
      unitPrices: parseUnitPrices(row.unit_prices),
    }))
}

function applyFilters(providers: ProviderListing[], filters: ProviderFilters): ProviderListing[] {
  return providers.filter((provider) => {
    if (filters.verifiedOnly && !provider.isVerified) return false
    if (filters.minRating != null && provider.ratingAvg < filters.minRating) return false
    if (filters.area) {
      const area = filters.area.toLowerCase().trim()
      const matches = provider.serviceAreas.some((a) => {
        const normalized = a.toLowerCase().trim()
        return normalized === area || normalized.includes(area) || area.includes(normalized)
      })
      if (!matches) return false
    }
    if (filters.categorySlug) {
      const matches = provider.services.some((s) => s.categorySlug === filters.categorySlug)
      if (!matches) return false
    }
    const minPrice = provider.services.length
      ? Math.min(...provider.services.map((s) => s.priceFrom))
      : provider.hourlyRate
    if (filters.minPrice != null && minPrice < filters.minPrice) return false
    if (filters.maxPrice != null && minPrice > filters.maxPrice) return false
    return true
  })
}

async function enrichProviders(providers: ProviderListing[]): Promise<ProviderListing[]> {
  if (!providers.length) return providers

  const userIds = providers.map((p) => p.userId)
  const providerIds = providers.map((p) => p.id)

  const [{ data: profiles }, { data: completed }] = await Promise.all([
    supabase.from('profiles').select('user_id, avatar_url').in('user_id', userIds),
    supabase
      .from('bookings')
      .select('provider_id')
      .in('provider_id', providerIds)
      .eq('status', 'completed'),
  ])

  const avatarByUser = new Map(
    (profiles ?? []).map((p) => [p.user_id as string, (p.avatar_url as string | null) ?? null]),
  )
  const completedByProvider = new Map<string, number>()
  for (const row of completed ?? []) {
    const pid = row.provider_id as string
    completedByProvider.set(pid, (completedByProvider.get(pid) ?? 0) + 1)
  }

  return providers.map((provider) => ({
    ...provider,
    avatarUrl: avatarByUser.get(provider.userId) ?? null,
    completedJobs: completedByProvider.get(provider.id) ?? 0,
  }))
}

export type UpdateProviderInput = {
  businessName: string
  bio?: string
  yearsExperience: number
  hourlyRate: number
  serviceAreas: string[]
}

export type ProviderServicePriceInput = {
  serviceId: string
  priceFrom: number
  unitPrices?: UnitPrices
}

function unitPricesToJson(prices: UnitPrices | undefined): Record<string, number> {
  if (!prices) return {}
  const out: Record<string, number> = {}
  for (const [units, price] of Object.entries(prices)) {
    const n = Number(units)
    if (n >= 1 && price > 0) out[String(n)] = price
  }
  return out
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
          unit_prices,
          services (
            id,
            name,
            slug,
            pricing_model,
            unit_label,
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
      data: await enrichProviders(applyFilters(listings, filters)),
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
          unit_prices,
          services (
            id,
            name,
            slug,
            pricing_model,
            unit_label,
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
    const listing = mapProviderListing(provider, mapProviderServices(provider_services))
    const [enriched] = await enrichProviders([listing])
    return {
      data: enriched ?? listing,
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
          unit_prices,
          services (
            id,
            name,
            slug,
            pricing_model,
            unit_label,
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
    const listing = mapProviderListing(provider, mapProviderServices(provider_services))
    const [enriched] = await enrichProviders([listing])
    return {
      data: enriched ?? listing,
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

  async updateMyProviderServices(
    services: ProviderServicePriceInput[],
  ): Promise<AuthResult<ProviderListing>> {
    const userId = await getCurrentUserId()
    if (!userId) return { data: null as unknown as ProviderListing, error: 'Not authenticated' }

    const { data: providerRow, error: providerError } = await supabase
      .from('providers')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (providerError || !providerRow) {
      return { data: null as unknown as ProviderListing, error: providerError?.message ?? 'Provider not found' }
    }

    const providerId = providerRow.id as string

    const { error: deleteError } = await supabase
      .from('provider_services')
      .delete()
      .eq('provider_id', providerId)
    if (deleteError) return { data: null as unknown as ProviderListing, error: deleteError.message }

    if (services.length > 0) {
      const { error: insertError } = await supabase.from('provider_services').insert(
        services.map((s) => ({
          provider_id: providerId,
          service_id: s.serviceId,
          price_from: s.priceFrom,
          unit_prices: unitPricesToJson(s.unitPrices),
        })),
      )
      if (insertError) return { data: null as unknown as ProviderListing, error: insertError.message }
    }

    return providerService.getMyProvider() as Promise<AuthResult<ProviderListing>>
  },
}
