import { useEffect, useMemo } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthProvider'
import { useCategories } from '@/features/catalog/hooks/useCategories'
import { useProviders } from '@/features/providers/hooks/useProviders'
import { ProviderCard } from '@/features/providers/components/ProviderCard'
import { ProviderCategoryCard } from '@/features/providers/components/ProviderCategoryCard'
import { PageHeader, QueryState } from '@/features/catalog/components/CatalogUi'
import { useProviderFilterStore } from '@/shared/stores/filterStore'
import { SINGAPORE_AREAS } from '@/shared/lib/constants'

function ProviderFiltersBar({
  categories,
  categorySlug,
  area,
  verifiedOnly,
  onCategoryChange,
  onAreaChange,
  onVerifiedChange,
  showCategoryFilter,
}: {
  categories: { slug: string; name: string }[] | undefined
  categorySlug: string
  area: string
  verifiedOnly: boolean
  onCategoryChange: (slug: string) => void
  onAreaChange: (area: string) => void
  onVerifiedChange: (value: boolean) => void
  showCategoryFilter?: boolean
}) {
  return (
    <div
      className={`mb-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 ${showCategoryFilter ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}
    >
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
              <option key={category.slug} value={category.slug}>
                {category.name}
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
  )
}

export function ProvidersPage() {
  const { slug: routeCategorySlug } = useParams<{ slug?: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const legacyCategory = searchParams.get('category') ?? ''
  const areaFromUrl = searchParams.get('area') ?? ''
  const categorySlug = routeCategorySlug ?? legacyCategory
  const isCategoryView = Boolean(categorySlug)

  const { categorySlug: storeCategorySlug, verifiedOnly, area, setCategorySlug, setVerifiedOnly, setArea } =
    useProviderFilterStore()

  const { data: categories, isLoading: categoriesLoading, error: categoriesError } = useCategories()

  useEffect(() => {
    if (categorySlug) setCategorySlug(categorySlug)
  }, [categorySlug, setCategorySlug])

  useEffect(() => {
    if (areaFromUrl) {
      setArea(areaFromUrl)
      return
    }
    if (user?.role === 'customer' && user.preferredArea && !area) {
      setArea(user.preferredArea)
    }
  }, [areaFromUrl, user?.role, user?.preferredArea, area, setArea])

  const browseFilters = useMemo(
    () => ({
      verifiedOnly,
      area: area.trim() || undefined,
    }),
    [verifiedOnly, area],
  )

  const categoryFilters = useMemo(
    () => ({
      categorySlug: categorySlug || storeCategorySlug || undefined,
      verifiedOnly,
      area: area.trim() || undefined,
    }),
    [categorySlug, storeCategorySlug, verifiedOnly, area],
  )

  const { data: browseProviders, isLoading: browseLoading, error: browseError } = useProviders(browseFilters)
  const { data: categoryProviders, isLoading: categoryLoading, error: categoryError } = useProviders(
    categoryFilters,
    { enabled: isCategoryView },
  )

  const providerCountByCategory = useMemo(() => {
    const counts = new Map<string, number>()
    for (const provider of browseProviders ?? []) {
      const slugs = new Set(provider.services.map((service) => service.categorySlug))
      for (const slug of slugs) {
        counts.set(slug, (counts.get(slug) ?? 0) + 1)
      }
    }
    return counts
  }, [browseProviders])

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
          categories={categories}
          categorySlug={categorySlug}
          area={area}
          verifiedOnly={verifiedOnly}
          onCategoryChange={handleCategoryChange}
          onAreaChange={handleAreaChange}
          onVerifiedChange={setVerifiedOnly}
          showCategoryFilter
        />

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
        title="Providers by category"
        description="Browse verified home service professionals by the type of work you need."
      />

      <ProviderFiltersBar
        categories={categories}
        categorySlug=""
        area={area}
        verifiedOnly={verifiedOnly}
        onCategoryChange={handleCategoryChange}
        onAreaChange={handleAreaChange}
        onVerifiedChange={setVerifiedOnly}
      />

      <QueryState
        loading={categoriesLoading || browseLoading}
        error={categoriesError ?? browseError}
        empty={!categories?.length}
        emptyMessage="No service categories yet. Run supabase/seed.sql in your Supabase project."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories?.map((category) => (
            <ProviderCategoryCard
              key={category.id}
              category={category}
              providerCount={providerCountByCategory.get(category.slug) ?? 0}
            />
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
