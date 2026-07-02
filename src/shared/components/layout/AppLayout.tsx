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
    <div className={cn('flex min-h-screen flex-col', isHome ? 'bg-white' : 'bg-slate-50 text-slate-900')}>
      <header
        className={cn(
          'sticky top-0 z-50 border-b backdrop-blur-md',
          isHome
            ? 'border-nexo-100 bg-white/90'
            : 'border-slate-200 bg-white',
        )}
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo to="/" />
          <nav className="flex items-center gap-4 text-sm">
            <Link
              to="/services"
              className="text-slate-600 transition hover:text-nexo-700"
            >
              Services
            </Link>
            <Link
              to="/providers"
              className="text-slate-600 transition hover:text-nexo-700"
            >
              Providers
            </Link>
            {user ? (
              <>
                <Link
                  to={getDashboardPath(user.role)}
                  className="rounded-lg bg-nexo-600 px-3 py-1.5 font-medium text-white transition hover:bg-nexo-700"
                >
                  Dashboard
                </Link>
                <LogoutButton showIcon={false} />
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-slate-600 transition hover:text-nexo-700"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-nexo-600 px-3 py-1.5 font-medium text-white transition hover:bg-nexo-700"
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
      <SiteFooter className={isHome ? 'border-t border-nexo-100 bg-nexo-50/50' : undefined} />
    </div>
  )
}
