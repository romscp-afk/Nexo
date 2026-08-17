import { useMemo } from 'react'
import { useCategory, useCategoryServices } from '@/features/catalog/hooks/useCategories'
import { useProviders } from '@/features/providers/hooks/useProviders'
import { PRIMARY_CATEGORY_SLUG } from '@/shared/lib/catalogConfig'
import {
  CLEANING_CATALOG_HOURLY_RATE,
  CLEANING_DURATION_HOURLY_RATES,
  MIN_BOOKING_HOURS,
} from '@/shared/lib/cleaningContent'
import { formatCurrency } from '@/shared/lib/utils'

export type CleaningPricingDisplay = {
  loading: boolean
  catalogBasePrice: number
  minHourly: number
  maxHourly: number
  variesByCleaner: boolean
  hasActiveCleaners: boolean
  cleanerCount: number
  minDurationHours: number
  headline: string
  detail: string
}

/** Customer-facing cleaning hourly rate — single source of truth (SGD). */
export function getCleaningCatalogHourlyRate(_dbCatalogPrice?: number | null): number {
  return CLEANING_CATALOG_HOURLY_RATE
}

export function useCleaningPricing(): CleaningPricingDisplay {
  const { data: category, isLoading: catLoading } = useCategory(PRIMARY_CATEGORY_SLUG)
  const { data: services, isLoading: svcLoading } = useCategoryServices(category?.id)
  const { data: providers, isLoading: provLoading } = useProviders({
    categorySlug: PRIMARY_CATEGORY_SLUG,
  })
  const { data: onboardedProviders, isLoading: onboardedLoading } = useProviders({
    publicOnly: false,
  })

  return useMemo(() => {
    const loading = catLoading || svcLoading || provLoading || onboardedLoading
    const standard =
      services?.find((s) => s.slug === 'cleaning-standard') ?? services?.[0] ?? null
    const catalogBasePrice = getCleaningCatalogHourlyRate(standard?.basePrice)
    const maxTierRate = Math.max(...Object.values(CLEANING_DURATION_HOURLY_RATES))

    const providerRates = (providers ?? [])
      .flatMap((p) => [
        Number(p.hourlyRate),
        ...p.services
          .filter((s) => s.categorySlug === PRIMARY_CATEGORY_SLUG)
          .map((s) => Number(s.priceFrom)),
      ])
      .filter((r) => r > 0)

    const uniqueProviderRates = [...new Set(providerRates)]
    const variesByCleaner =
      uniqueProviderRates.length > 1 &&
      uniqueProviderRates.some((r) => r !== catalogBasePrice)
    const cleanerCount = onboardedProviders?.length ?? 0
    const hasActiveCleaners = cleanerCount > 0

    const headline = `From ${formatCurrency(catalogBasePrice)}/hr`

    const detail = variesByCleaner
      ? `${formatCurrency(catalogBasePrice)}–${formatCurrency(maxTierRate)}/hr by duration · Some cleaners may quote differently · ${MIN_BOOKING_HOURS} hr minimum`
      : `${formatCurrency(catalogBasePrice)}–${formatCurrency(maxTierRate)}/hr depending on booking length · ${MIN_BOOKING_HOURS} hr minimum`

    return {
      loading,
      catalogBasePrice,
      minHourly: catalogBasePrice,
      maxHourly: maxTierRate,
      variesByCleaner,
      hasActiveCleaners,
      cleanerCount,
      minDurationHours: MIN_BOOKING_HOURS,
      headline,
      detail,
    }
  }, [catLoading, svcLoading, provLoading, onboardedLoading, services, providers, onboardedProviders])
}
