import { useMemo } from 'react'
import { useCategory, useCategoryServices } from '@/features/catalog/hooks/useCategories'
import { useProviders } from '@/features/providers/hooks/useProviders'
import { PRIMARY_CATEGORY_SLUG } from '@/shared/lib/catalogConfig'
import { MIN_BOOKING_HOURS } from '@/shared/lib/cleaningContent'
import { formatCurrency } from '@/shared/lib/utils'

export type CleaningPricingDisplay = {
  loading: boolean
  catalogBasePrice: number | null
  minHourly: number | null
  maxHourly: number | null
  variesByCleaner: boolean
  hasActiveCleaners: boolean
  minDurationHours: number
  headline: string
  detail: string
}

export function useCleaningPricing(): CleaningPricingDisplay {
  const { data: category, isLoading: catLoading } = useCategory(PRIMARY_CATEGORY_SLUG)
  const { data: services, isLoading: svcLoading } = useCategoryServices(category?.id)
  const { data: providers, isLoading: provLoading } = useProviders({
    categorySlug: PRIMARY_CATEGORY_SLUG,
  })

  return useMemo(() => {
    const loading = catLoading || svcLoading || provLoading
    const standard =
      services?.find((s) => s.slug === 'cleaning-standard') ?? services?.[0] ?? null
    const catalogBasePrice = standard?.basePrice ?? null

    const hourlyRates = (providers ?? [])
      .map((p) => Number(p.hourlyRate))
      .filter((r) => r > 0)

    const serviceRates = (providers ?? [])
      .flatMap((p) => p.services.map((s) => Number(s.priceFrom)))
      .filter((r) => r > 0)

    const allRates = [...hourlyRates, ...serviceRates]
    const minHourly = allRates.length ? Math.min(...allRates) : catalogBasePrice
    const maxHourly = allRates.length ? Math.max(...allRates) : catalogBasePrice
    const variesByCleaner =
      allRates.length > 1 && minHourly != null && maxHourly != null && minHourly !== maxHourly
    const hasActiveCleaners = (providers ?? []).length > 0

    let headline = 'Pricing available at booking'
    if (variesByCleaner && minHourly != null && maxHourly != null) {
      headline = `${formatCurrency(minHourly)}–${formatCurrency(maxHourly)}/hr`
    } else if (minHourly != null) {
      headline = `From ${formatCurrency(minHourly)}/hr`
    } else if (catalogBasePrice != null) {
      headline = `From ${formatCurrency(catalogBasePrice)}/hr`
    }

    const detail = variesByCleaner
      ? 'Rates vary by cleaner · Hourly · Minimum booking applies'
      : `Per hour · ${MIN_BOOKING_HOURS} hr minimum · Subject to cleaner availability`

    return {
      loading,
      catalogBasePrice,
      minHourly,
      maxHourly,
      variesByCleaner,
      hasActiveCleaners,
      minDurationHours: MIN_BOOKING_HOURS,
      headline,
      detail,
    }
  }, [catLoading, svcLoading, provLoading, services, providers])
}
