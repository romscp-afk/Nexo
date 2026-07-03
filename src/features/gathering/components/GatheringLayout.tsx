import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/shared/lib/utils'
import { useAuth } from '@/features/auth/context/AuthProvider'
import { EVENT } from '@/features/gathering/lib/eventConfig'
import { entryTheme, legacyTheme } from '@/features/gathering/lib/legacyTheme'

const MINIMAL_PAGES = ['/contact', '/contact/entry', '/contact/thank-you']

export function GatheringLayout() {
  const { pathname } = useLocation()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'admin'
  const isMinimalPage = MINIMAL_PAGES.includes(pathname)
  const isFullScreenPage = pathname === '/contact' || pathname === '/contact/thank-you'

  const handleLogout = async () => {
    await signOut()
    navigate('/contact')
  }

  if (isFullScreenPage) {
    return <Outlet />
  }

  if (isMinimalPage) {
    const theme = pathname === '/contact/entry' ? entryTheme : legacyTheme
    return (
      <div className={pathname === '/contact/entry' ? theme.pageShell : theme.pageBg}>
        <Outlet />
      </div>
    )
  }

  return (
    <div className={`${legacyTheme.pageBg} ${legacyTheme.pageShell} text-legacy-silver-light`}>
      <header className={legacyTheme.headerBar}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/contact" className="min-w-0">
            <p className="truncate text-sm font-semibold text-legacy-silver-light">{EVENT.title}</p>
            <p className={`truncate text-xs ${legacyTheme.tagline}`}>{EVENT.tagline}</p>
          </Link>
          <nav className="flex shrink-0 items-center gap-2">
            {isAdmin ? (
              <>
                <Link
                  to="/contact/report"
                  className={cn(
                    'rounded-full px-3 py-1.5 text-sm font-medium transition',
                    pathname === '/contact/report'
                      ? 'bg-legacy-gold text-legacy-950 shadow-sm'
                      : 'text-legacy-silver hover:bg-legacy-800',
                  )}
                >
                  Survey Report
                </Link>
                <button type="button" onClick={handleLogout} className={legacyTheme.btnSecondary}>
                  Log out
                </button>
              </>
            ) : (
              pathname !== '/contact/admin/login' && (
                <Link to="/contact/admin/login" className={legacyTheme.btnSecondary}>
                  Admin Login
                </Link>
              )
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}
