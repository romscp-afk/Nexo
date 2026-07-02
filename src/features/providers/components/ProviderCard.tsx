import { Link } from 'react-router-dom'
import { Star, BadgeCheck, MapPin } from 'lucide-react'
import type { ProviderListing } from '@/shared/types/catalog'
import { formatCurrency } from '@/shared/lib/utils'

export function ProviderCard({ provider }: { provider: ProviderListing }) {
  const minPrice = provider.services.length
    ? Math.min(...provider.services.map((s) => s.priceFrom))
    : provider.hourlyRate

  return (
    <Link
      to={`/providers/${provider.id}`}
      className="block rounded-xl border border-slate-200 bg-white p-5 transition hover:border-nexo-200 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900">{provider.businessName}</h3>
            {provider.isVerified && (
              <BadgeCheck className="h-4 w-4 text-nexo-600" aria-label="Verified" />
            )}
          </div>
          {provider.bio && (
            <p className="mt-1 line-clamp-2 text-sm text-slate-600">{provider.bio}</p>
          )}
        </div>
        <div className="shrink-0 text-right text-sm">
          <div className="flex items-center justify-end gap-1 text-amber-600">
            <Star className="h-4 w-4 fill-current" />
            <span className="font-medium">{provider.ratingAvg.toFixed(1)}</span>
            <span className="text-slate-400">({provider.ratingCount})</span>
          </div>
          <p className="mt-1 text-slate-500">from {formatCurrency(minPrice)}</p>
        </div>
      </div>

      {provider.serviceAreas.length > 0 && (
        <div className="mt-3 flex items-center gap-1 text-xs text-slate-500">
          <MapPin className="h-3.5 w-3.5" />
          {provider.serviceAreas.slice(0, 3).join(', ')}
          {provider.serviceAreas.length > 3 && ` +${provider.serviceAreas.length - 3}`}
        </div>
      )}

      {provider.services.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {provider.services.slice(0, 3).map((service) => (
            <span
              key={service.serviceId}
              className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
            >
              {service.name}
            </span>
          ))}
        </div>
      )}
    </Link>
  )
}
