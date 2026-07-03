import { useEffect, useMemo, useState } from 'react'
import {
  useMyProvider,
  useUpdateMyProvider,
  useUpdateMyProviderServices,
} from '@/features/providers/hooks/useMyProvider'
import { useAllServices } from '@/features/catalog/hooks/useAllServices'
import { QueryState } from '@/features/catalog/components/CatalogUi'
import { SINGAPORE_AREAS } from '@/shared/lib/constants'
import { formatCurrency } from '@/shared/lib/utils'
import type { UnitPrices } from '@/shared/types/catalog'

const UNIT_TIER_COUNTS = [1, 2, 3, 4, 5] as const

type ServicePriceDraft = {
  serviceId: string
  enabled: boolean
  priceFrom: string
  unitPrices: Record<number, string>
}

function defaultUnitPrices(basePrice: number, existing?: UnitPrices): Record<number, string> {
  const out: Record<number, string> = {}
  for (const n of UNIT_TIER_COUNTS) {
    const tier = existing?.[n]
    if (tier != null) {
      out[n] = String(tier)
    } else if (n === 1) {
      out[n] = String(basePrice)
    } else {
      out[n] = String(Math.round(basePrice * n * 0.9))
    }
  }
  return out
}

export function ProviderProfilePage() {
  const { data: provider, isLoading, error } = useMyProvider()
  const { data: catalogServices, isLoading: servicesLoading } = useAllServices()
  const updateProvider = useUpdateMyProvider()
  const updateServices = useUpdateMyProviderServices()

  const [businessName, setBusinessName] = useState('')
  const [bio, setBio] = useState('')
  const [yearsExperience, setYearsExperience] = useState('0')
  const [hourlyRate, setHourlyRate] = useState('0')
  const [serviceAreas, setServiceAreas] = useState<string[]>([])
  const [servicePrices, setServicePrices] = useState<ServicePriceDraft[]>([])
  const [success, setSuccess] = useState('')
  const [formError, setFormError] = useState('')

  const hasHourlyServices = useMemo(
    () =>
      servicePrices.some((row) => {
        const catalog = catalogServices?.find((s) => s.id === row.serviceId)
        return row.enabled && catalog?.pricingModel !== 'per_unit'
      }),
    [servicePrices, catalogServices],
  )

  useEffect(() => {
    if (provider) {
      setBusinessName(provider.businessName)
      setBio(provider.bio ?? '')
      setYearsExperience(String(provider.yearsExperience))
      setHourlyRate(String(provider.hourlyRate))
      setServiceAreas(provider.serviceAreas)
    }
  }, [provider])

  useEffect(() => {
    if (!catalogServices) return
    setServicePrices(
      catalogServices.map((service) => {
        const existing = provider?.services.find((s) => s.serviceId === service.id)
        return {
          serviceId: service.id,
          enabled: Boolean(existing),
          priceFrom: existing ? String(existing.priceFrom) : String(service.basePrice),
          unitPrices: defaultUnitPrices(service.basePrice, existing?.unitPrices),
        }
      }),
    )
  }, [catalogServices, provider])

  const toggleArea = (area: string) => {
    setServiceAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area],
    )
  }

  const updateServicePrice = (serviceId: string, patch: Partial<ServicePriceDraft>) => {
    setServicePrices((prev) =>
      prev.map((row) => (row.serviceId === serviceId ? { ...row, ...patch } : row)),
    )
  }

  const updateUnitPrice = (serviceId: string, units: number, value: string) => {
    setServicePrices((prev) =>
      prev.map((row) =>
        row.serviceId === serviceId
          ? { ...row, unitPrices: { ...row.unitPrices, [units]: value } }
          : row,
      ),
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess('')
    setFormError('')

    if (serviceAreas.length === 0) {
      setFormError('Select at least one service area.')
      return
    }

    const enabledServices = servicePrices.filter((s) => s.enabled)
    if (enabledServices.length === 0) {
      setFormError('Enable at least one service with a price.')
      return
    }

    try {
      await updateProvider.mutateAsync({
        businessName,
        bio,
        yearsExperience: Number(yearsExperience) || 0,
        hourlyRate: Number(hourlyRate) || 0,
        serviceAreas,
      })
      await updateServices.mutateAsync(
        enabledServices.map((s) => {
          const catalog = catalogServices?.find((c) => c.id === s.serviceId)
          const unitPrices: UnitPrices = {}
          if (catalog?.pricingModel === 'per_unit') {
            for (const n of UNIT_TIER_COUNTS) {
              const price = Number(s.unitPrices[n]) || 0
              if (price > 0) unitPrices[n] = price
            }
          }
          return {
            serviceId: s.serviceId,
            priceFrom: Number(s.unitPrices[1] ?? s.priceFrom) || Number(s.priceFrom) || 0,
            unitPrices: catalog?.pricingModel === 'per_unit' ? unitPrices : undefined,
          }
        }),
      )
      setSuccess('Profile and service prices updated.')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Update failed')
    }
  }

  const saving = updateProvider.isPending || updateServices.isPending

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Business profile</h1>
      <p className="mt-1 text-slate-600">Update your listing, coverage areas, and service prices.</p>

      <QueryState loading={isLoading || servicesLoading} error={error} empty={!provider}>
        {provider && (
          <form onSubmit={handleSubmit} className="mt-6 max-w-2xl space-y-6">
            {formError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>
            )}
            {success && (
              <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p>
            )}

            <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="font-semibold text-slate-900">Business details</h2>

              <label className="block text-sm">
                <span className="font-medium text-slate-700">Business name</span>
                <input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  required
                />
              </label>

              <label className="block text-sm">
                <span className="font-medium text-slate-700">Bio</span>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="font-medium text-slate-700">Years experience</span>
                  <input
                    type="number"
                    min={0}
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  />
                </label>
                {hasHourlyServices && (
                  <label className="block text-sm">
                    <span className="font-medium text-slate-700">Hourly rate (SGD)</span>
                    <p className="text-xs text-slate-500">For cleaning and other hourly services</p>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                    />
                  </label>
                )}
              </div>

              <fieldset>
                <legend className="text-sm font-medium text-slate-700">Service areas</legend>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {SINGAPORE_AREAS.map((area) => (
                    <label key={area} className="flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={serviceAreas.includes(area)}
                        onChange={() => toggleArea(area)}
                        className="rounded border-slate-300"
                      />
                      {area}
                    </label>
                  ))}
                </div>
              </fieldset>
            </section>

            <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
              <div>
                <h2 className="font-semibold text-slate-900">Services & pricing</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Cleaners use hourly rates. Aircon services use per-unit tier pricing (1 unit, 2 units, etc.).
                </p>
              </div>

              <ul className="divide-y divide-slate-100">
                {servicePrices.map((row) => {
                  const catalog = catalogServices?.find((s) => s.id === row.serviceId)
                  if (!catalog) return null
                  const isPerUnit = catalog.pricingModel === 'per_unit'
                  const unitLabel = catalog.unitLabel ?? 'unit'

                  return (
                    <li key={row.serviceId} className="space-y-3 py-4">
                      <label className="flex items-start gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={row.enabled}
                          onChange={(e) =>
                            updateServicePrice(row.serviceId, { enabled: e.target.checked })
                          }
                          className="mt-1 rounded border-slate-300"
                        />
                        <span>
                          <span className="font-medium text-slate-900">{catalog.name}</span>
                          <span className="block text-xs text-slate-500">
                            {catalog.categoryName} ·{' '}
                            {isPerUnit ? 'Per-unit pricing' : 'Hourly pricing'} · catalog from{' '}
                            {formatCurrency(catalog.basePrice)}
                          </span>
                        </span>
                      </label>

                      {row.enabled && isPerUnit && (
                        <div className="ml-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {UNIT_TIER_COUNTS.map((n) => (
                            <label key={n} className="flex items-center gap-2 text-sm">
                              <span className="w-16 text-slate-600">
                                {n} {unitLabel}
                                {n === 1 ? '' : 's'}
                              </span>
                              <input
                                type="number"
                                min={0}
                                step={1}
                                value={row.unitPrices[n] ?? ''}
                                onChange={(e) => updateUnitPrice(row.serviceId, n, e.target.value)}
                                className="w-full rounded-lg border border-slate-200 px-2 py-1"
                              />
                              <span className="text-slate-400">SGD</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {row.enabled && !isPerUnit && (
                        <label className="ml-6 flex items-center gap-2 text-sm">
                          <span className="text-slate-500">Starting from</span>
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={row.priceFrom}
                            onChange={(e) =>
                              updateServicePrice(row.serviceId, { priceFrom: e.target.value })
                            }
                            className="w-24 rounded-lg border border-slate-200 px-2 py-1"
                          />
                          <span className="text-slate-500">SGD</span>
                        </label>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>

            <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
              Verified: {provider.isVerified ? 'Yes' : 'Pending admin review'} · Rating:{' '}
              {provider.ratingAvg.toFixed(1)} ({provider.ratingCount} reviews)
            </div>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-nexo-700 px-4 py-2 text-sm font-medium text-white hover:bg-nexo-800 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save profile'}
            </button>
          </form>
        )}
      </QueryState>
    </div>
  )
}
