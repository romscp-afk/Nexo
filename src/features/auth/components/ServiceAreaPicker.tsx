import { useMemo, useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import {
  SERVICE_AREA_REGIONS_WITH_OTHER,
  type ServiceAreaRegion,
} from '@/shared/lib/singaporeAreaRegions'
import { cn } from '@/shared/lib/utils'

type ServiceAreaPickerProps = {
  selected: string[]
  onChange: (areas: string[]) => void
  disabled?: boolean
  error?: string
  id?: string
}

export function ServiceAreaPicker({
  selected,
  onChange,
  disabled,
  error,
  id = 'service-areas',
}: ServiceAreaPickerProps) {
  const [query, setQuery] = useState('')
  const [regionFilter, setRegionFilter] = useState<string | 'all'>('all')
  const [openRegions, setOpenRegions] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(SERVICE_AREA_REGIONS_WITH_OTHER.map((r) => [r.id, true])),
  )

  const selectedSet = useMemo(() => new Set(selected), [selected])

  const filteredRegions = useMemo(() => {
    const q = query.trim().toLowerCase()
    return SERVICE_AREA_REGIONS_WITH_OTHER.map((region) => {
      if (regionFilter !== 'all' && region.id !== regionFilter) return null
      const areas = region.areas.filter((a) => !q || a.toLowerCase().includes(q))
      if (q && areas.length === 0) return null
      return { ...region, areas } satisfies ServiceAreaRegion
    }).filter(Boolean) as ServiceAreaRegion[]
  }, [query, regionFilter])

  const toggle = (area: string) => {
    if (disabled) return
    onChange(
      selectedSet.has(area) ? selected.filter((a) => a !== area) : [...selected, area],
    )
  }

  const selectAllInRegion = (region: ServiceAreaRegion) => {
    if (disabled) return
    const next = new Set(selected)
    for (const a of region.areas) next.add(a)
    onChange([...next])
  }

  const clearAll = () => {
    if (disabled) return
    onChange([])
  }

  return (
    <fieldset
      id={id}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? `${id}-error` : `${id}-count`}
      className="rounded-lg border border-slate-200 p-3"
    >
      <legend className="px-1 text-sm font-medium text-slate-700">Service areas</legend>

      <div className="mt-2 space-y-3">
        <label className="block text-sm">
          <span className="sr-only">Search service areas</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search areas…"
            disabled={disabled}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
          />
        </label>

        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filter by region"
        >
          <button
            type="button"
            disabled={disabled}
            onClick={() => setRegionFilter('all')}
            className={cn(
              'min-h-11 rounded-lg border px-3 text-sm',
              regionFilter === 'all'
                ? 'border-nexo-700 bg-nexo-50 text-nexo-800'
                : 'border-slate-200 text-slate-600',
            )}
            aria-pressed={regionFilter === 'all'}
          >
            All regions
          </button>
          {SERVICE_AREA_REGIONS_WITH_OTHER.map((r) => (
            <button
              key={r.id}
              type="button"
              disabled={disabled}
              onClick={() => setRegionFilter(r.id)}
              className={cn(
                'min-h-11 rounded-lg border px-3 text-sm',
                regionFilter === r.id
                  ? 'border-nexo-700 bg-nexo-50 text-nexo-800'
                  : 'border-slate-200 text-slate-600',
              )}
              aria-pressed={regionFilter === r.id}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p id={`${id}-count`} className="text-sm text-slate-600">
            {selected.length} selected
          </p>
          <button
            type="button"
            onClick={clearAll}
            disabled={disabled || selected.length === 0}
            className="min-h-11 rounded-lg px-3 text-sm font-medium text-nexo-700 hover:bg-nexo-50 disabled:opacity-40"
          >
            Clear selection
          </button>
        </div>

        {selected.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Selected service areas">
            {selected.map((area) => (
              <li key={area}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => toggle(area)}
                  className="inline-flex min-h-11 items-center gap-1 rounded-full border border-nexo-200 bg-nexo-50 px-3 text-sm text-nexo-900"
                  aria-label={`Remove ${area}`}
                >
                  {area}
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="space-y-2">
          {filteredRegions.map((region) => {
            const open = openRegions[region.id] ?? true
            const allSelected = region.areas.every((a) => selectedSet.has(a))
            return (
              <div key={region.id} className="rounded-lg border border-slate-100">
                <div className="flex items-center gap-2 px-2 py-1">
                  <button
                    type="button"
                    className="flex min-h-11 flex-1 items-center justify-between gap-2 px-2 text-left text-sm font-medium text-slate-800"
                    aria-expanded={open}
                    onClick={() =>
                      setOpenRegions((prev) => ({ ...prev, [region.id]: !open }))
                    }
                  >
                    {region.label}
                    <ChevronDown
                      className={cn('h-4 w-4 transition', open && 'rotate-180')}
                      aria-hidden
                    />
                  </button>
                  <button
                    type="button"
                    disabled={disabled || allSelected}
                    onClick={() => selectAllInRegion(region)}
                    className="min-h-11 shrink-0 rounded-lg px-2 text-xs font-medium text-nexo-700 hover:bg-nexo-50 disabled:opacity-40"
                  >
                    Select all in region
                  </button>
                </div>
                {open && (
                  <div className="grid grid-cols-2 gap-1 border-t border-slate-100 p-2 sm:grid-cols-3">
                    {region.areas.map((area) => {
                      const checked = selectedSet.has(area)
                      return (
                        <label
                          key={area}
                          className={cn(
                            'flex min-h-11 items-center gap-2 rounded-md px-2 text-sm',
                            checked ? 'bg-nexo-50 text-nexo-900' : 'text-slate-700',
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggle(area)}
                            disabled={disabled}
                            className="rounded border-slate-300"
                          />
                          {area}
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {error && (
          <p id={`${id}-error`} className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    </fieldset>
  )
}
