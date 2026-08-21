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
import { isNativeApp } from '@/shared/lib/nativeApp'

const NAV_LINKS = [
  { to: `/services/${PRIMARY_CATEGORY_SLUG}`, label: 'Services' },
  { to: '/how-it-works', label: 'How It Works' },
  // Service Providers directory hidden until enough providers are live.
  // { to: `/providers/category/${PRIMARY_CATEGORY_SLUG}`, label: 'Service Providers' },
  { to: '/services/cleaning/request', label: 'Pricing' },
  { to: '/support', label: 'Help' },
] as const

export function AppLayout() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  const showCustomerNav = user?.role === 'customer'
  const native = isNativeApp()

  useEffect(() => {
    recordSiteVisit()
  }, [])

  return (
    <div className="flex min-h-dvh flex-col bg-brand-bg">
      <header className="sticky top-0 z-50 border-b border-brand-border bg-white pt-[env(safe-area-inset-top)] shadow-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
          <Logo to="/" size="md" />

          {/* Desktop web nav — hidden in the native app shell */}
          {!native && (
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
          )}

          {!native && (
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
          )}

          {!showCustomerNav && <MobilePublicNav alwaysVisible={native} />}
        </div>
      </header>

      <main
        className={cn(
          'mx-auto w-full flex-1',
          isHome ? 'max-w-none px-0 py-0' : 'max-w-5xl px-4 py-6 sm:py-8',
          showCustomerNav && 'pb-[calc(4.5rem+env(safe-area-inset-bottom))]',
          native && !showCustomerNav && 'pb-[calc(4.5rem+env(safe-area-inset-bottom))]',
          !native && showCustomerNav && 'md:pb-0',
        )}
      >
        <Outlet />
      </main>

      {/* Marketing footer is web-only — native uses tab / menu chrome */}
      {!native && <SiteFooter className={cn(showCustomerNav && 'hidden md:block')} />}

      {showCustomerNav && <CustomerMobileNav forceVisible={native} />}
      {native && !showCustomerNav && <NativeGuestBottomBar />}
    </div>
  )
}

function NativeGuestBottomBar() {
  const { user } = useAuth()
  if (user) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-brand-border bg-white px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-4px_24px_rgba(7,21,58,0.08)]">
      <div className="mx-auto flex max-w-lg gap-3">
        <Link
          to="/login"
          className="flex h-12 flex-1 items-center justify-center rounded-xl border border-brand-border text-sm font-semibold text-brand-navy"
        >
          Log in
        </Link>
        <CleaningRequestLink className="flex h-12 flex-[1.4] items-center justify-center rounded-xl bg-brand-primary text-sm font-semibold text-white">
          Book Now
        </CleaningRequestLink>
      </div>
    </div>
  )
}
