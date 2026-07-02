import { Link, Outlet } from 'react-router-dom'
import { getDashboardPath } from '@/shared/lib/constants'
import { useAuth } from '@/features/auth/context/AuthProvider'
import { LogoutButton } from '@/shared/components/layout/LogoutButton'
import { Logo } from '@/shared/components/layout/Logo'
import { SiteFooter } from '@/shared/components/layout/SiteFooter'

export function AppLayout() {
  const { user } = useAuth()

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Logo to="/" />
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/services" className="text-slate-600 hover:text-teal-700">
              Services
            </Link>
            <Link to="/providers" className="text-slate-600 hover:text-teal-700">
              Providers
            </Link>
            {user ? (
              <>
                <Link
                  to={getDashboardPath(user.role)}
                  className="rounded-lg bg-teal-700 px-3 py-1.5 font-medium text-white hover:bg-teal-800"
                >
                  Dashboard
                </Link>
                <LogoutButton showIcon={false} />
              </>
            ) : (
              <>
                <Link to="/login" className="text-slate-600 hover:text-teal-700">
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-teal-700 px-3 py-1.5 font-medium text-white hover:bg-teal-800"
                >
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}
