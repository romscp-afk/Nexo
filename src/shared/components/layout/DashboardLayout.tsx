import { Link, Outlet, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { APP_NAME, type UserRole } from '@/shared/lib/constants'
import { useAppStore } from '@/shared/stores/appStore'
import { cn } from '@/shared/lib/utils'

type NavItem = { to: string; label: string }

const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  customer: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/dashboard/bookings', label: 'My bookings' },
  ],
  provider: [
    { to: '/provider', label: 'Dashboard' },
    { to: '/provider/bookings', label: 'Bookings' },
    { to: '/provider/profile', label: 'Profile' },
  ],
  admin: [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/providers', label: 'Providers' },
    { to: '/admin/bookings', label: 'Bookings' },
  ],
}

type DashboardLayoutProps = {
  role: UserRole
}

export function DashboardLayout({ role }: DashboardLayoutProps) {
  const location = useLocation()
  const sidebarOpen = useAppStore((s) => s.sidebarOpen)
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)

  const nav = NAV_BY_ROLE[role]

  const isActive = (to: string) =>
    location.pathname === to || location.pathname.startsWith(`${to}/`)

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-56 shrink-0 border-r border-slate-200 bg-white md:block">
        <div className="flex h-14 items-center border-b border-slate-200 px-4 font-semibold text-teal-700">
          {APP_NAME}
        </div>
        <nav className="space-y-1 p-3">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'block rounded-lg px-3 py-2 text-sm font-medium',
                isActive(item.to)
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-slate-600 hover:bg-slate-100',
              )}
            >
              {item.label}
            </Link>
          ))}
          <Link to="/" className="mt-4 block px-3 text-xs text-slate-500 hover:text-teal-700">
            ← Back to site
          </Link>
        </nav>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-56 bg-white shadow-xl">
            <div className="flex h-14 items-center justify-between border-b px-4 font-semibold">
              {APP_NAME}
              <button onClick={() => setSidebarOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="space-y-1 p-3">
              {nav.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4">
          <button className="md:hidden" onClick={toggleSidebar} aria-label="Open menu">
            <Menu className="h-5 w-5 text-slate-600" />
          </button>
          <span className="text-sm capitalize text-slate-500">{role} portal</span>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
