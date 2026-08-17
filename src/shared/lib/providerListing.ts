import type { ProviderListing } from '@/shared/types/catalog'

export type ProviderListingType = 'individual' | 'company'

export const PROVIDER_LISTING_TYPE_LABELS: Record<ProviderListingType, string> = {
  individual: 'Individual',
  company: 'Company',
}

export function isPublicProviderListing(
  provider: Pick<ProviderListing, 'listingType'>,
): boolean {
  return provider.listingType === 'company'
}

export function publicListingName(provider: Pick<ProviderListing, 'businessName' | 'listingType'>): string {
  return provider.businessName
}
