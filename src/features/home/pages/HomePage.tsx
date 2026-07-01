import { Link } from 'react-router-dom'
import { useCategories } from '@/features/catalog/hooks/useCategories'
import { CategoryCard, QueryState } from '@/features/catalog/components/CatalogUi'
import { useAuth } from '@/features/auth/context/AuthProvider'
import { getDashboardPath } from '@/shared/lib/constants'

export function HomePage() {
  const { user } = useAuth()
  const { data: categories, isLoading, error } = useCategories()

  return (
    <div className="space-y-10">
      <section className="rounded-2xl bg-gradient-to-br from-teal-700 to-teal-900 px-8 py-12 text-white">
        <h1 className="text-3xl font-bold sm:text-4xl">Home services, simplified.</h1>
        <p className="mt-3 max-w-xl text-teal-100">
          Nexo connects Singapore homeowners with trusted cleaners, handymen, movers, and more.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/services"
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-teal-800 hover:bg-teal-50"
          >
            Browse services
          </Link>
          <Link
            to="/providers"
            className="rounded-lg border border-teal-400 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
          >
            Find providers
          </Link>
          {user ? (
            <Link
              to={getDashboardPath(user.role)}
              className="rounded-lg border border-teal-400 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
            >
              My dashboard
            </Link>
          ) : (
            <Link
              to="/register"
              className="rounded-lg border border-teal-400 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
            >
              Get started
            </Link>
          )}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Popular services</h2>
            <p className="text-sm text-slate-600">What do you need help with today?</p>
          </div>
          <Link to="/services" className="text-sm font-medium text-teal-700 hover:underline">
            View all
          </Link>
        </div>

        <QueryState
          loading={isLoading}
          error={error}
          empty={!categories?.length}
          emptyMessage="Run supabase/seed.sql to populate service categories."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories?.slice(0, 6).map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </QueryState>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-slate-900">How Nexo works</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            ['1', 'Choose a service', 'Browse categories from cleaning to plumbing.'],
            ['2', 'Pick a provider', 'Compare ratings, areas, and pricing.'],
            ['3', 'Book with confidence', 'Request a booking and track status in your dashboard.'],
          ].map(([step, title, desc]) => (
            <li key={step} className="text-sm">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">
                {step}
              </span>
              <p className="mt-2 font-medium text-slate-900">{title}</p>
              <p className="mt-0.5 text-slate-600">{desc}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
