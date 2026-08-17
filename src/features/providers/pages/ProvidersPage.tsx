import { useEffect, useMemo, useRef } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useCategories } from '@/features/catalog/hooks/useCategories'
import { useProviders } from '@/features/providers/hooks/useProviders'
import { ProviderCard } from '@/features/providers/components/ProviderCard'
import { ProviderCategoryCard } from '@/features/providers/components/ProviderCategoryCard'
import { PageHeader, QueryState } from '@/features/catalog/components/CatalogUi'
import { useProviderFilterStore } from '@/shared/stores/filterStore'
import { SINGAPORE_AREAS } from '@/shared/lib/constants'
import {
  isCategoryLaunched,
  PRIMARY_CATEGORY_SLUG,
  sortCategoriesForDisplay,
} from '@/shared/lib/catalogConfig'

function ProviderFiltersBar({
  categories,
  categorySlug,
  area,
  verifiedOnly,
  minRating,
  minPrice,
  maxPrice,
  onCategoryChange,
  onAreaChange,
  onVerifiedChange,
  onMinRatingChange,
  onMinPriceChange,
  onMaxPriceChange,
  showCategoryFilter,
}: {
  categories: { slug: string; name: string }[] | undefined
  categorySlug: string
  area: string
  verifiedOnly: boolean
  minRating: number
  minPrice: string
  maxPrice: string
  onCategoryChange: (slug: string) => void
  onAreaChange: (area: string) => void
  onVerifiedChange: (value: boolean) => void
  onMinRatingChange: (value: number) => void
  onMinPriceChange: (value: string) => void
  onMaxPriceChange: (value: string) => void
  showCategoryFilter?: boolean
}) {
  return (
    <div className="mb-6 space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className={`grid gap-3 ${showCategoryFilter ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2'}`}>
        {showCategoryFilter ? (
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Category</span>
            <select
              value={categorySlug}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            >
              <option value="">All categories</option>
              {categories?.map((category) => (
                <option
                  key={category.slug}
                  value={category.slug}
                  disabled={!isCategoryLaunched(category.slug)}
                >
                  {category.name}
                  {!isCategoryLaunched(category.slug) ? ' (coming soon)' : ''}
                </option>
              ))}
            </select>
          </label>
        ) : null}

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
  const { slug: routeCategorySlug } = useParams<{ slug?: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const legacyCategory = searchParams.get('category') ?? ''
  const areaFromUrl = searchParams.get('area') ?? ''
  const categorySlug = routeCategorySlug ?? legacyCategory
  const isCategoryView = Boolean(categorySlug)

  const { categorySlug: storeCategorySlug, verifiedOnly, area, minRating, minPrice, maxPrice, setCategorySlug, setVerifiedOnly, setArea, setMinRating, setMinPrice, setMaxPrice } =
    useProviderFilterStore()

  const { data: categories, isLoading: categoriesLoading, error: categoriesError } = useCategories()
  const sortedCategories = useMemo(
    () => sortCategoriesForDisplay(categories ?? []),
    [categories],
  )

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
  const { data: categoryProviders, isLoading: categoryLoading, error: categoryError } = useProviders(
    categoryFilters,
    { enabled: isCategoryView },
  )
  const { data: allProvidersForCounts } = useProviders({}, { enabled: !isCategoryView })
  const { data: unfilteredCategoryProviders } = useProviders(
    { categorySlug: categorySlug || storeCategorySlug || undefined },
    { enabled: isCategoryView && Boolean(area.trim()) },
  )

  const hasAreaFilter = Boolean(area.trim())
  const areaFilteredEmpty = isCategoryView && hasAreaFilter && !categoryProviders?.length && Boolean(unfilteredCategoryProviders?.length)

  const providerCountByCategory = useMemo(() => {
    const counts = new Map<string, number>()
    const source = allProvidersForCounts ?? browseProviders ?? []
    for (const provider of source) {
      const slugs = new Set(provider.services.map((service) => service.categorySlug))
      for (const slug of slugs) {
        counts.set(slug, (counts.get(slug) ?? 0) + 1)
      }
    }
    return counts
  }, [allProvidersForCounts, browseProviders])

  const activeCategory = categories?.find((category) => category.slug === categorySlug)

  const handleCategoryChange = (slug: string) => {
    setCategorySlug(slug)
    if (!slug) {
      navigate('/providers')
      return
    }
    navigate(`/providers/category/${slug}`)
  }

  const handleAreaChange = (nextArea: string) => {
    setArea(nextArea)
  }

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
          backTo="/providers"
          backLabel="All categories"
          title={activeCategory ? `${activeCategory.icon ?? ''} ${activeCategory.name}`.trim() : 'Providers'}
          description={
            activeCategory?.description ??
            'Compare verified professionals for this service category.'
          }
        />

        <ProviderFiltersBar
          categories={sortedCategories}
          categorySlug={categorySlug}
          area={area}
          verifiedOnly={verifiedOnly}
          minRating={minRating}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onCategoryChange={handleCategoryChange}
          onAreaChange={handleAreaChange}
          onVerifiedChange={setVerifiedOnly}
          onMinRatingChange={setMinRating}
          onMinPriceChange={setMinPrice}
          onMaxPriceChange={setMaxPrice}
          showCategoryFilter
        />

        {areaFilteredEmpty && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            No providers in <strong>{area}</strong> for this category, but{' '}
            {unfilteredCategoryProviders?.length} provider
            {unfilteredCategoryProviders?.length === 1 ? '' : 's'} cover other areas.{' '}
            <button
              type="button"
              onClick={() => setArea('')}
              className="font-medium text-nexo-700 underline hover:text-nexo-800"
            >
              Show all areas
            </button>
          </div>
        )}

        <QueryState
          loading={categoryLoading || categoriesLoading}
          error={categoryError ?? categoriesError}
          empty={!categoryProviders?.length}
          emptyMessage="No providers match your filters in this category yet. Try a different area or category."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            {categoryProviders?.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </div>
        </QueryState>

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
        title="Cleaning providers"
        description="Browse verified home cleaning professionals. More service categories coming soon."
      />

      <ProviderFiltersBar
        categories={sortedCategories}
        categorySlug=""
        area={area}
        verifiedOnly={verifiedOnly}
        minRating={minRating}
        minPrice={minPrice}
        maxPrice={maxPrice}
        onCategoryChange={handleCategoryChange}
        onAreaChange={handleAreaChange}
        onVerifiedChange={setVerifiedOnly}
        onMinRatingChange={setMinRating}
        onMinPriceChange={setMinPrice}
        onMaxPriceChange={setMaxPrice}
      />

      <QueryState
        loading={categoriesLoading || browseLoading}
        error={categoriesError ?? browseError}
        empty={!sortedCategories.length}
        emptyMessage="No service categories yet. Run supabase/seed.sql in your Supabase project."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedCategories.map((category) => (
            <ProviderCategoryCard
              key={category.id}
              category={category}
              providerCount={providerCountByCategory.get(category.slug) ?? 0}
            />
          ))}
        </div>
      </QueryState>

      <section className="mt-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Available cleaners</h2>
            <p className="text-sm text-slate-600">All active cleaning providers on Nexo.</p>
          </div>
        </div>
        <QueryState
          loading={browseLoading}
          error={browseError}
          empty={!browseProviders?.length}
          emptyMessage="No providers listed yet. Service professionals appear here after registering and adding services."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            {browseProviders?.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </div>
        </QueryState>
      </section>

      <p className="mt-8 text-center text-sm text-slate-500">
        Are you a service professional?{' '}
        <Link to="/register" className="font-medium text-nexo-700 hover:underline">
          Join as a provider
        </Link>
      </p>
    </div>
  )
}
