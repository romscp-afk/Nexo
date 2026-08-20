import { Link, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
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
  { to: `/providers/category/${PRIMARY_CATEGORY_SLUG}`, label: 'Find a Cleaner' },
  { to: '/services/cleaning/request', label: 'Pricing' },
  { to: '/support', label: 'Help' },
] as const

export function AppLayout() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  const showCustomerNav = user?.role === 'customer'
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    recordSiteVisit()
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navSolid = scrolled || !isHome

  return (
    <div className={cn('flex min-h-screen flex-col', isHome && !scrolled ? 'bg-brand-navy' : 'bg-brand-bg')}>
      <header
        className={cn(
          'sticky top-0 z-50 pt-[env(safe-area-inset-top)] transition duration-300',
          navSolid
            ? 'border-b border-brand-border bg-brand-surface/95 shadow-card backdrop-blur-md'
            : 'border-b border-transparent bg-transparent',
        )}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo to="/" highlighted={!navSolid && isHome} />

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm font-medium transition duration-200',
                  navSolid
                    ? 'text-brand-text-secondary hover:bg-brand-bg hover:text-brand-text'
                    : 'text-white/85 hover:bg-white/10 hover:text-white',
                )}
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
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-semibold transition',
                    navSolid
                      ? 'bg-brand-primary text-white hover:bg-brand-primary-hover'
                      : 'bg-white text-brand-navy hover:bg-brand-light',
                  )}
                >
                  Dashboard
                </Link>
                <LogoutButton
                  showIcon={false}
                  className={
                    navSolid
                      ? undefined
                      : 'border-transparent bg-transparent text-white/85 hover:bg-white/10 hover:text-white'
                  }
                />
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm font-medium transition',
                    navSolid ? 'text-brand-text-secondary hover:text-brand-text' : 'text-white/85 hover:text-white',
                  )}
                >
                  Log in
                </Link>
                <CleaningRequestLink
                  className={cn(
                    'inline-flex min-h-10 items-center rounded-full px-5 py-2 text-sm font-semibold transition shadow-brand',
                    navSolid
                      ? 'bg-brand-primary text-white hover:bg-brand-primary-hover'
                      : 'bg-white text-brand-navy hover:bg-brand-light',
                  )}
                >
                  Request a Cleaning
                </CleaningRequestLink>
              </>
            )}
          </div>

          {!showCustomerNav && <MobilePublicNav isHome={!navSolid && isHome} />}
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

      <SiteFooter
        className={cn(
          showCustomerNav && 'hidden md:block',
        )}
      />
      {showCustomerNav && <CustomerMobileNav />}
    </div>
  )
}
