import { Link } from 'react-router-dom'
import { useCategories } from '@/features/catalog/hooks/useCategories'
import { CategoryCard, PageHeader, QueryState } from '@/features/catalog/components/CatalogUi'

export function ServicesPage() {
  const { data: categories, isLoading, error } = useCategories()

  return (
    <div>
      <PageHeader
        title="Services"
        description="Browse home services available across Singapore."
      />

      <QueryState
        loading={isLoading}
        error={error}
        empty={!categories?.length}
        emptyMessage="No service categories yet. Run supabase/seed.sql in your Supabase project."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories?.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </QueryState>

      <p className="mt-8 text-center text-sm text-slate-500">
        Ready to hire?{' '}
        <Link to="/providers" className="font-medium text-nexo-700 hover:underline">
          Browse providers
        </Link>
      </p>
    </div>
  )
}
