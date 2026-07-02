import { useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthProvider'
import { useCategories } from '@/features/catalog/hooks/useCategories'
import { useProviders } from '@/features/providers/hooks/useProviders'
import { ProviderCard } from '@/features/providers/components/ProviderCard'
import { PageHeader, QueryState } from '@/features/catalog/components/CatalogUi'
import { useProviderFilterStore } from '@/shared/stores/filterStore'
import { SINGAPORE_AREAS } from '@/shared/lib/constants'

export function ProvidersPage() {
  const [searchParams] = useSearchParams()
  const categoryFromUrl = searchParams.get('category') ?? ''
  const areaFromUrl = searchParams.get('area') ?? ''
  const { user } = useAuth()

  const { categorySlug, verifiedOnly, area, setCategorySlug, setVerifiedOnly, setArea } =
    useProviderFilterStore()

  const { data: categories } = useCategories()

  useEffect(() => {
    if (categoryFromUrl) setCategorySlug(categoryFromUrl)
  }, [categoryFromUrl, setCategorySlug])

  useEffect(() => {
    if (areaFromUrl) {
      setArea(areaFromUrl)
      return
    }
    if (user?.role === 'customer' && user.preferredArea && !area) {
      setArea(user.preferredArea)
    }
  }, [areaFromUrl, user?.role, user?.preferredArea, area, setArea])

  const filters = useMemo(
    () => ({
      categorySlug: categorySlug || undefined,
      verifiedOnly,
      area: area.trim() || undefined,
    }),
    [categorySlug, verifiedOnly, area],
  )

  const { data: providers, isLoading, error } = useProviders(filters)

  return (
    <div>
      <PageHeader
        title="Providers"
        description="Compare verified home service professionals in Singapore."
      />

      <div className="mb-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Category</span>
          <select
            value={categorySlug}
            onChange={(e) => setCategorySlug(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          >
            <option value="">All categories</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="font-medium text-slate-700">Area</span>
          <select
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          >
            <option value="">All areas</option>
            {SINGAPORE_AREAS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-end gap-2 pb-2 text-sm">
          <input
            id="verified-only"
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => setVerifiedOnly(e.target.checked)}
            className="rounded border-slate-300"
          />
          <span className="text-slate-700">Verified only</span>
        </label>
      </div>

      <QueryState
        loading={isLoading}
        error={error}
        empty={!providers?.length}
        emptyMessage="No providers match your filters yet. Register as a provider or try different filters."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {providers?.map((provider) => (
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
