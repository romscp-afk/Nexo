import { useEffect, useMemo, useRef } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useCategories } from '@/features/catalog/hooks/useCategories'
import { useProviders } from '@/features/providers/hooks/useProviders'
import { ProviderCard } from '@/features/providers/components/ProviderCard'
import { ProviderListSkeleton, ProviderListState } from '@/features/providers/components/ProviderListStates'
import { PageHeader } from '@/features/catalog/components/CatalogUi'
import { useProviderFilterStore } from '@/shared/stores/filterStore'
import { SINGAPORE_AREAS } from '@/shared/lib/constants'
import {
  isCategoryLaunched,
  PRIMARY_CATEGORY_SLUG,
} from '@/shared/lib/catalogConfig'
import { trackEvent } from '@/shared/lib/analytics'
import { PAGE_META, usePageMeta } from '@/shared/lib/pageMeta'

function ProviderFiltersBar({
  area,
  verifiedOnly,
  minRating,
  minPrice,
  maxPrice,
  onAreaChange,
  onVerifiedChange,
  onMinRatingChange,
  onMinPriceChange,
  onMaxPriceChange,
}: {
  area: string
  verifiedOnly: boolean
  minRating: number
  minPrice: string
  maxPrice: string
  onAreaChange: (area: string) => void
  onVerifiedChange: (value: boolean) => void
  onMinRatingChange: (value: number) => void
  onMinPriceChange: (value: string) => void
  onMaxPriceChange: (value: string) => void
}) {
  return (
    <div className="mb-6 space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Area</span>
          <select
            value={area}
            onChange={(e) => onAreaChange(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          >
            <option value="">All areas</option>
            {SINGAPORE_AREAS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="font-medium text-slate-700">Min rating</span>
          <select
            value={minRating}
            onChange={(e) => onMinRatingChange(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          >
            <option value={0}>Any rating</option>
            <option value={3}>3+ stars</option>
            <option value={4}>4+ stars</option>
            <option value={4.5}>4.5+ stars</option>
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Min price (SGD)</span>
          <input
            type="number"
            min={0}
            value={minPrice}
            onChange={(e) => onMinPriceChange(e.target.value)}
            placeholder="e.g. 30"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Max price (SGD)</span>
          <input
            type="number"
            min={0}
            value={maxPrice}
            onChange={(e) => onMaxPriceChange(e.target.value)}
            placeholder="e.g. 150"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="flex items-end gap-2 pb-2 text-sm">
          <input
            id="verified-only"
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => onVerifiedChange(e.target.checked)}
            className="rounded border-slate-300"
          />
          <span className="text-slate-700">Verified only</span>
        </label>
      </div>
    </div>
  )
}

export function ProvidersPage() {
  usePageMeta(PAGE_META.findCleaner)
  const { slug: routeCategorySlug } = useParams<{ slug?: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const emptyTrackedRef = useRef(false)

  const legacyCategory = searchParams.get('category') ?? ''
  const areaFromUrl = searchParams.get('area') ?? ''
  const categorySlug = routeCategorySlug ?? legacyCategory
  const isCategoryView = Boolean(categorySlug)

  const { categorySlug: storeCategorySlug, verifiedOnly, area, minRating, minPrice, maxPrice, setCategorySlug, setVerifiedOnly, setArea, setMinRating, setMinPrice, setMaxPrice } =
    useProviderFilterStore()

  const { data: categories, isLoading: categoriesLoading, error: categoriesError } = useCategories()

  const areaInitRef = useRef(false)

  useEffect(() => {
    if (categorySlug) setCategorySlug(categorySlug)
  }, [categorySlug, setCategorySlug])

  useEffect(() => {
    if (areaInitRef.current) return
    if (areaFromUrl) {
      setArea(areaFromUrl)
    }
    areaInitRef.current = true
  }, [areaFromUrl, setArea])

  const browseFilters = useMemo(
    () => ({
      categorySlug: PRIMARY_CATEGORY_SLUG,
      verifiedOnly,
      area: area.trim() || undefined,
      minRating: minRating || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    }),
    [verifiedOnly, area, minRating, minPrice, maxPrice],
  )

  const categoryFilters = useMemo(
    () => ({
      categorySlug: categorySlug || storeCategorySlug || undefined,
      verifiedOnly,
      area: area.trim() || undefined,
      minRating: minRating || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    }),
    [categorySlug, storeCategorySlug, verifiedOnly, area, minRating, minPrice, maxPrice],
  )

  const { data: browseProviders, isLoading: browseLoading, error: browseError } = useProviders(browseFilters)
  const { data: allOnboardedProviders } = useProviders({ publicOnly: false })
  const { data: categoryProviders, isLoading: categoryLoading, error: categoryError } = useProviders(
    categoryFilters,
    { enabled: isCategoryView },
  )
  const { data: unfilteredCategoryProviders } = useProviders(
    { publicOnly: false },
    { enabled: isCategoryView },
  )

  const hasFilters = Boolean(
    area.trim() ||
      verifiedOnly ||
      minRating > 0 ||
      minPrice ||
      maxPrice,
  )

  const activeCategory = categories?.find((category) => category.slug === categorySlug)

  const handleAreaChange = (nextArea: string) => {
    setArea(nextArea)
    trackEvent('cleaner_filters_used', { filter: 'area' })
  }

  const clearFilters = () => {
    setArea('')
    setVerifiedOnly(false)
    setMinRating(0)
    setMinPrice('')
    setMaxPrice('')
  }

  const handleRetry = () => {
    void queryClient.invalidateQueries({ queryKey: ['providers'] })
  }

  useEffect(() => {
    if (categoryLoading || categoryError) return
    if (categoryProviders?.length === 0 && !emptyTrackedRef.current) {
      emptyTrackedRef.current = true
      trackEvent('cleaner_empty_result', {
        variant: !unfilteredCategoryProviders?.length
          ? 'empty'
          : hasFilters
            ? 'filtered'
            : 'empty',
      })
    }
  }, [
    categoryLoading,
    categoryError,
    categoryProviders?.length,
    unfilteredCategoryProviders?.length,
    hasFilters,
  ])

  useEffect(() => {
    if (legacyCategory && !routeCategorySlug) {
      const query = areaFromUrl ? `?area=${encodeURIComponent(areaFromUrl)}` : ''
      navigate(`/providers/category/${legacyCategory}${query}`, { replace: true })
    }
  }, [legacyCategory, routeCategorySlug, areaFromUrl, navigate])

  if (legacyCategory && !routeCategorySlug) {
    return null
  }

  if (isCategoryView && categorySlug && !isCategoryLaunched(categorySlug)) {
    return <Navigate to={`/providers/category/${PRIMARY_CATEGORY_SLUG}`} replace />
  }

  if (isCategoryView) {
    return (
      <div>
        <PageHeader
          backTo={`/services/${PRIMARY_CATEGORY_SLUG}`}
          backLabel="Home cleaning"
          title={activeCategory ? `${activeCategory.icon ?? ''} ${activeCategory.name}`.trim() : 'Cleaners'}
          description={
            activeCategory?.description ??
            'Browse home cleaning professionals available on Nexo.'
          }
        />

        <ProviderFiltersBar
          area={area}
          verifiedOnly={verifiedOnly}
          minRating={minRating}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onAreaChange={handleAreaChange}
          onVerifiedChange={(v) => {
            setVerifiedOnly(v)
            trackEvent('cleaner_filters_used', { filter: 'verified' })
          }}
          onMinRatingChange={(v) => {
            setMinRating(v)
            trackEvent('cleaner_filters_used', { filter: 'rating' })
          }}
          onMinPriceChange={(v) => {
            setMinPrice(v)
            trackEvent('cleaner_filters_used', { filter: 'min_price' })
          }}
          onMaxPriceChange={(v) => {
            setMaxPrice(v)
            trackEvent('cleaner_filters_used', { filter: 'max_price' })
          }}
        />

        {categoryLoading || categoriesLoading ? (
          <ProviderListSkeleton />
        ) : categoryError ?? categoriesError ? (
          <ProviderListState variant="error" onRetry={handleRetry} />
        ) : !unfilteredCategoryProviders?.length ? (
          <ProviderListState variant="empty" />
        ) : !categoryProviders?.length && hasFilters ? (
          <ProviderListState variant="filtered" onClearFilters={clearFilters} />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {categoryProviders?.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </div>
        )}

        <p className="mt-8 text-center text-sm text-slate-500">
          Are you a service professional?{' '}
          <Link to="/register" className="font-medium text-nexo-700 hover:underline">
            Join as a provider
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Find a cleaner"
        description="Browse home cleaning professionals available on Nexo."
      />

      <ProviderFiltersBar
        area={area}
        verifiedOnly={verifiedOnly}
        minRating={minRating}
        minPrice={minPrice}
        maxPrice={maxPrice}
        onAreaChange={handleAreaChange}
        onVerifiedChange={setVerifiedOnly}
        onMinRatingChange={setMinRating}
        onMinPriceChange={setMinPrice}
        onMaxPriceChange={setMaxPrice}
      />

      {browseLoading ? (
        <ProviderListSkeleton />
      ) : browseError ? (
        <ProviderListState variant="error" onRetry={handleRetry} />
      ) : !browseProviders?.length && !allOnboardedProviders?.length ? (
        <ProviderListState variant="empty" />
      ) : !browseProviders?.length && hasFilters ? (
        <ProviderListState variant="filtered" onClearFilters={clearFilters} />
      ) : !browseProviders?.length ? (
        <ProviderListState variant="empty" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {browseProviders.map((provider) => (
            <ProviderCard key={provider.id} provider={provider} />
          ))}
        </div>
      )}

      <p className="mt-8 text-center text-sm text-slate-500">
        Are you a service professional?{' '}
        <Link to="/register" className="font-medium text-nexo-700 hover:underline">
          Join as a provider
        </Link>
      </p>
    </div>
  )
}
