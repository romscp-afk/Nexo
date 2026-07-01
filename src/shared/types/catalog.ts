export type ServiceCategoryRow = {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  is_active: boolean
  sort_order: number
  created_at: string
}

export type ServiceRow = {
  id: string
  category_id: string
  name: string
  slug: string
  description: string | null
  base_price: number
  is_active: boolean
  sort_order: number
  created_at: string
}

export type ProviderRow = {
  id: string
  user_id: string
  business_name: string
  bio: string | null
  years_experience: number
  hourly_rate: number
  service_areas: string[]
  is_verified: boolean
  is_active: boolean
  rating_avg: number
  rating_count: number
  created_at: string
  updated_at: string
}

export type ServiceCategory = {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  sortOrder: number
}

export type CatalogService = {
  id: string
  categoryId: string
  name: string
  slug: string
  description: string | null
  basePrice: number
  sortOrder: number
}

export type ProviderServiceSummary = {
  serviceId: string
  name: string
  slug: string
  categorySlug: string
  categoryName: string
  priceFrom: number
}

export type ProviderListing = {
  id: string
  userId: string
  businessName: string
  bio: string | null
  yearsExperience: number
  hourlyRate: number
  serviceAreas: string[]
  isVerified: boolean
  ratingAvg: number
  ratingCount: number
  services: ProviderServiceSummary[]
}

export type ProviderFilters = {
  categorySlug?: string
  verifiedOnly?: boolean
  area?: string
}

export function mapCategory(row: ServiceCategoryRow): ServiceCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    icon: row.icon,
    sortOrder: row.sort_order,
  }
}

export function mapService(row: ServiceRow): CatalogService {
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    basePrice: Number(row.base_price),
    sortOrder: row.sort_order,
  }
}

export function mapProviderListing(
  row: ProviderRow,
  services: ProviderServiceSummary[] = [],
): ProviderListing {
  return {
    id: row.id,
    userId: row.user_id,
    businessName: row.business_name,
    bio: row.bio,
    yearsExperience: row.years_experience,
    hourlyRate: Number(row.hourly_rate),
    serviceAreas: row.service_areas ?? [],
    isVerified: row.is_verified,
    ratingAvg: Number(row.rating_avg),
    ratingCount: row.rating_count,
    services,
  }
}
