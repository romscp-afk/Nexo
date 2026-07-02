import { Link, Outlet, useLocation } from 'react-router-dom'
import { getDashboardPath } from '@/shared/lib/constants'
import { useAuth } from '@/features/auth/context/AuthProvider'
import { LogoutButton } from '@/shared/components/layout/LogoutButton'
import { Logo } from '@/shared/components/layout/Logo'
import { SiteFooter } from '@/shared/components/layout/SiteFooter'
import { cn } from '@/shared/lib/utils'

export function AppLayout() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const isHome = pathname === '/'

  return (
    <div className={cn('flex min-h-screen flex-col', isHome ? 'bg-nexo-50' : 'bg-slate-50 text-slate-900')}>
      <header
        className={cn(
          'sticky top-0 z-50 border-b backdrop-blur-md',
          isHome
            ? 'border-nexo-700/40 bg-nexo-deep/90 text-white'
            : 'border-slate-200 bg-white',
        )}
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo
            to="/"
            className={isHome ? '[&_span]:text-white' : undefined}
          />
          <nav className="flex items-center gap-4 text-sm">
            <Link
              to="/services"
              className={cn(
                'transition',
                isHome ? 'text-nexo-mint/90 hover:text-white' : 'text-slate-600 hover:text-nexo-700',
              )}
            >
              Services
            </Link>
            <Link
              to="/providers"
              className={cn(
                'transition',
                isHome ? 'text-nexo-mint/90 hover:text-white' : 'text-slate-600 hover:text-nexo-700',
              )}
            >
              Providers
            </Link>
            {user ? (
              <>
                <Link
                  to={getDashboardPath(user.role)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 font-medium transition',
                    isHome
                      ? 'bg-nexo-400 text-nexo-950 hover:bg-nexo-accent'
                      : 'bg-nexo-600 text-white hover:bg-nexo-700',
                  )}
                >
                  Dashboard
                </Link>
                <LogoutButton
                  showIcon={false}
                  className={
                    isHome
                      ? 'border-transparent bg-transparent text-nexo-mint/90 hover:bg-white/10 hover:text-white'
                      : undefined
                  }
                />
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={cn(
                    'transition',
                    isHome ? 'text-nexo-mint/90 hover:text-white' : 'text-slate-600 hover:text-nexo-700',
                  )}
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className={cn(
                    'rounded-lg px-3 py-1.5 font-medium transition',
                    isHome
                      ? 'bg-nexo-400 text-nexo-950 hover:bg-nexo-accent'
                      : 'bg-nexo-600 text-white hover:bg-nexo-700',
                  )}
                >
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className={cn('mx-auto w-full flex-1', isHome ? 'max-w-none px-0 py-0' : 'max-w-5xl px-4 py-8')}>
        <Outlet />
      </main>
      <SiteFooter className={isHome ? 'border-t border-nexo-200 bg-white' : undefined} />
    </div>
  )
}
