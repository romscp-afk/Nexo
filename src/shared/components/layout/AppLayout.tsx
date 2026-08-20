import { Link, Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { getDashboardPath } from '@/shared/lib/constants'
import { useAuth } from '@/features/auth/context/AuthProvider'
import { LogoutButton } from '@/shared/components/layout/LogoutButton'
import { Logo } from '@/shared/components/layout/Logo'
import { SiteFooter } from '@/shared/components/layout/SiteFooter'
import { MobilePublicNav } from '@/shared/components/layout/MobilePublicNav'
import { CustomerMobileNav } from '@/shared/components/layout/CustomerMobileNav'
import { cn } from '@/shared/lib/utils'
import { PRIMARY_CATEGORY_SLUG } from '@/shared/lib/catalogConfig'
import { recordSiteVisit } from '@/shared/lib/pwaEngagement'
import { CleaningRequestLink } from '@/shared/components/CleaningPriceLabel'

const NAV_LINKS = [
  { to: `/services/${PRIMARY_CATEGORY_SLUG}`, label: 'Services' },
  { to: '/how-it-works', label: 'How It Works' },
  { to: `/providers/category/${PRIMARY_CATEGORY_SLUG}`, label: 'Cleaners' },
  { to: '/services/cleaning/request', label: 'Pricing' },
  { to: '/support', label: 'Help' },
] as const

export function AppLayout() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  const showCustomerNav = user?.role === 'customer'

  useEffect(() => {
    recordSiteVisit()
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-brand-bg">
      <header className="sticky top-0 z-50 border-b border-brand-border bg-white pt-[env(safe-area-inset-top)] shadow-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo to="/" size="md" />

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="rounded-lg px-3 py-2 text-sm font-medium text-brand-primary transition duration-200 hover:bg-brand-light hover:text-brand-primary-hover"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <>
                <Link
                  to={getDashboardPath(user.role)}
                  className="rounded-full bg-brand-light px-4 py-2 text-sm font-semibold text-brand-navy transition hover:bg-brand-pale"
                >
                  Dashboard
                </Link>
                <LogoutButton showIcon={false} />
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-brand-primary transition hover:bg-brand-light hover:text-brand-primary-hover"
                >
                  Log in
                </Link>
                <CleaningRequestLink className="inline-flex min-h-10 items-center rounded-lg bg-brand-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-hover">
                  Book Now
                </CleaningRequestLink>
              </>
            )}
          </div>

          {!showCustomerNav && <MobilePublicNav />}
        </div>
      </header>

      <main
        className={cn(
          'mx-auto w-full flex-1',
          isHome ? 'max-w-none px-0 py-0' : 'max-w-5xl px-4 py-6 sm:py-8',
          showCustomerNav && 'pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0',
        )}
      >
        <Outlet />
      </main>

      <SiteFooter className={cn(showCustomerNav && 'hidden md:block')} />
      {showCustomerNav && <CustomerMobileNav />}
    </div>
  )
}
