import { Link, useParams } from 'react-router-dom'
import { useCategory, useCategoryServices } from '@/features/catalog/hooks/useCategories'
import { PageHeader, QueryState } from '@/features/catalog/components/CatalogUi'
import { formatCurrency } from '@/shared/lib/utils'

export function CategoryPage() {
  const { slug = '' } = useParams()
  const { data: category, isLoading: categoryLoading, error: categoryError } = useCategory(slug)
  const {
    data: services,
    isLoading: servicesLoading,
    error: servicesError,
  } = useCategoryServices(category?.id)

  if (categoryLoading) {
    return <QueryState loading error={null}>{null}</QueryState>
  }

  if (categoryError || !category) {
    return (
      <QueryState
        loading={false}
        error={categoryError ?? new Error('Category not found')}
        empty={false}
      >
        {null}
      </QueryState>
    )
  }

  return (
    <div>
      <PageHeader
        backTo="/services"
        backLabel="All services"
        title={`${category.icon ?? ''} ${category.name}`.trim()}
        description={category.description ?? undefined}
      />

      <QueryState
        loading={servicesLoading}
        error={servicesError}
        empty={!services?.length}
        emptyMessage="No services listed for this category yet."
      >
        <div className="space-y-3">
          {services?.map((service) => (
            <div
              key={service.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4"
            >
              <div>
                <h2 className="font-medium text-slate-900">{service.name}</h2>
                {service.description && (
                  <p className="mt-0.5 text-sm text-slate-600">{service.description}</p>
                )}
              </div>
              <p className="text-sm font-medium text-teal-700">
                from {formatCurrency(service.basePrice)}
              </p>
            </div>
          ))}
        </div>
      </QueryState>

      <div className="mt-8 rounded-xl bg-teal-50 px-5 py-4">
        <p className="text-sm text-teal-900">
          Find a trusted provider for {category.name.toLowerCase()}.
        </p>
        <Link
          to={`/providers?category=${category.slug}`}
          className="mt-2 inline-block text-sm font-medium text-teal-700 hover:underline"
        >
          View providers →
        </Link>
      </div>
    </div>
  )
}
