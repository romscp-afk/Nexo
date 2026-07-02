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
    <div className={cn('flex min-h-screen flex-col', isHome ? 'bg-nexo-pearl' : 'bg-nexo-50 text-nexo-950')}>
      <header
        className={cn(
          'sticky top-0 z-50 border-b backdrop-blur-xl',
          isHome
            ? 'border-white/10 bg-nexo-ink/75 text-white'
            : 'border-nexo-200/80 bg-white/90',
        )}
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo to="/" highlighted={isHome} />
          <nav className="flex items-center gap-4 text-sm">
            <Link
              to="/services"
              className={cn(
                'transition',
                isHome ? 'text-nexo-mint/85 hover:text-white' : 'text-nexo-800/70 hover:text-nexo-700',
              )}
            >
              Services
            </Link>
            <Link
              to="/providers"
              className={cn(
                'transition',
                isHome ? 'text-nexo-mint/85 hover:text-white' : 'text-nexo-800/70 hover:text-nexo-700',
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
                      ? 'bg-white text-nexo-950 shadow-sm hover:bg-nexo-soft'
                      : 'bg-nexo-700 text-white hover:bg-nexo-800',
                  )}
                >
                  Dashboard
                </Link>
                <LogoutButton
                  showIcon={false}
                  className={
                    isHome
                      ? 'border-transparent bg-transparent text-nexo-mint/85 hover:bg-white/10 hover:text-white'
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
                    isHome ? 'text-nexo-mint/85 hover:text-white' : 'text-nexo-800/70 hover:text-nexo-700',
                  )}
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className={cn(
                    'rounded-lg px-3 py-1.5 font-medium transition',
                    isHome
                      ? 'bg-nexo-600 text-white hover:bg-nexo-800'
                      : 'bg-nexo-700 text-white hover:bg-nexo-800',
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
      <SiteFooter className={isHome ? 'border-t border-nexo-200/80 bg-white/80' : undefined} />
    </div>
  )
}
