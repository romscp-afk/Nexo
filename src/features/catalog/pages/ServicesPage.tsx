import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useCategories } from '@/features/catalog/hooks/useCategories'
import { CategoryCard, PageHeader, QueryState } from '@/features/catalog/components/CatalogUi'
import { PRIMARY_CATEGORY_SLUG, sortCategoriesForDisplay } from '@/shared/lib/catalogConfig'

export function ServicesPage() {
  const { data: categories, isLoading, error } = useCategories()
  const sorted = useMemo(
    () => sortCategoriesForDisplay(categories ?? []),
    [categories],
  )

  return (
    <div>
      <PageHeader
        title="Home cleaning"
        description="Book trusted cleaners across Singapore. More home services coming soon."
      />

      <QueryState
        loading={isLoading}
        error={error}
        empty={!sorted.length}
        emptyMessage="No service categories yet. Please try again later."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </QueryState>

      <p className="mt-8 text-center text-sm text-slate-500">
        Ready to book?{' '}
        <Link
          to={`/providers/category/${PRIMARY_CATEGORY_SLUG}`}
          className="font-medium text-nexo-700 hover:underline"
        >
          Browse cleaning providers
        </Link>
      </p>
    </div>
  )
}
