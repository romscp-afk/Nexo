import { Link, Outlet, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { type UserRole } from '@/shared/lib/constants'
import { PRIMARY_CATEGORY_SLUG } from '@/shared/lib/catalogConfig'
import { useAppStore } from '@/shared/stores/appStore'
import { cn } from '@/shared/lib/utils'
import { useUnreadNotificationCount } from '@/features/customer/hooks/useNotifications'
import { useUnreadChatCount } from '@/features/bookings/hooks/useBookingChat'
import { useChatRealtimeSync } from '@/features/bookings/hooks/useChatRealtime'
import { LogoutButton } from '@/shared/components/layout/LogoutButton'
import { Logo } from '@/shared/components/layout/Logo'
import { SiteFooter } from '@/shared/components/layout/SiteFooter'
import { CustomerMobileNav } from '@/shared/components/layout/CustomerMobileNav'
import { Portal } from '@/shared/components/layout/Portal'

type BadgeKind = 'notifications' | 'messages'

type NavItem = { to: string; label: string; exact?: boolean; badge?: BadgeKind }

const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  customer: [
    { to: '/dashboard', label: 'Dashboard', exact: true },
    { to: `/providers/category/${PRIMARY_CATEGORY_SLUG}`, label: 'Browse cleaners' },
    { to: '/dashboard/bookings', label: 'My bookings' },
    { to: '/dashboard/messages', label: 'Messages', badge: 'messages' },
    { to: '/dashboard/reviews', label: 'My reviews' },
    { to: '/dashboard/saved-providers', label: 'Saved providers' },
    { to: '/dashboard/notifications', label: 'Notifications', badge: 'notifications' },
    { to: '/dashboard/profile', label: 'Profile' },
  ],
  provider: [
    { to: '/provider', label: 'Dashboard', exact: true },
    { to: '/provider/bookings', label: 'Bookings' },
    { to: '/provider/schedule', label: 'Schedule' },
    { to: '/provider/messages', label: 'Messages', badge: 'messages' },
    { to: '/provider/earnings', label: 'Earnings' },
    { to: '/provider/notifications', label: 'Notifications', badge: 'notifications' },
    { to: '/provider/profile', label: 'Profile' },
  ],
  admin: [
    { to: '/admin', label: 'Dashboard', exact: true },
    { to: '/admin/payments', label: 'PayNow payments' },
    { to: '/admin/reports', label: 'Analytics' },
    { to: '/admin/chats', label: 'Booking chats' },
    { to: '/admin/activity', label: 'Activity log' },
    { to: '/admin/bookings', label: 'Bookings' },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/providers', label: 'Providers' },
  ],
}

type DashboardLayoutProps = {
  role: UserRole
}

function NavLink({
  item,
  isActive,
  badgeCount,
  onNavigate,
}: {
  item: NavItem
  isActive: boolean
  badgeCount: number
  onNavigate?: () => void
}) {
  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      className={cn(
        'flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium',
        isActive ? 'bg-nexo-50 text-nexo-700' : 'text-slate-600 hover:bg-slate-100',
      )}
    >
      <span>{item.label}</span>
      {item.badge && badgeCount > 0 && (
        <span className="rounded-full bg-nexo-700 px-1.5 py-0.5 text-xs text-white">
          {badgeCount > 99 ? '99+' : badgeCount}
        </span>
      )}
    </Link>
  )
}

export function DashboardLayout({ role }: DashboardLayoutProps) {
  const location = useLocation()
  const sidebarOpen = useAppStore((s) => s.sidebarOpen)
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)
  const unreadNotifications = useUnreadNotificationCount()
  const { data: unreadChat = 0 } = useUnreadChatCount(
    role === 'customer' || role === 'provider' ? role : 'customer',
  )

  useChatRealtimeSync(role === 'customer' || role === 'provider')

  const nav = NAV_BY_ROLE[role]

  const badgeForItem = (item: NavItem) => {
    if (item.badge === 'messages') return unreadChat
    if (item.badge === 'notifications') return unreadNotifications
    return 0
  }

  const isActive = (item: NavItem) => {
    if (item.exact) return location.pathname === item.to
    return location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
  }

  const mobileTitle = (() => {
    if (role !== 'customer') return `${role} portal`
    const item = nav.find((n) => isActive(n))
    return item?.label ?? 'Dashboard'
  })()

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-56 shrink-0 border-r border-slate-200 bg-white md:block">
        <div className="flex h-14 items-center border-b border-slate-200 px-4">
          <Logo to="/" size="sm" />
        </div>
        <nav className="space-y-1 p-3">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              item={item}
              isActive={isActive(item)}
              badgeCount={badgeForItem(item)}
            />
          ))}
          <Link to="/" className="mt-4 block px-3 text-xs text-slate-500 hover:text-nexo-700">
            ← Back to site
          </Link>
          <div className="mt-2 border-t border-slate-100 pt-2">
            <LogoutButton variant="sidebar" />
          </div>
        </nav>
      </aside>

      {sidebarOpen && (
        <Portal>
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
            <aside className="absolute left-0 top-0 h-full w-56 bg-white shadow-xl">
              <div className="flex h-14 items-center justify-between border-b px-4 pt-[env(safe-area-inset-top)]">
                <Logo to="/" size="sm" />
                <button onClick={() => setSidebarOpen(false)} aria-label="Close menu">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="space-y-1 overflow-y-auto p-3">
                {nav.map((item) => (
                  <NavLink
                    key={item.to}
                    item={item}
                    isActive={isActive(item)}
                    badgeCount={badgeForItem(item)}
                    onNavigate={() => setSidebarOpen(false)}
                  />
                ))}
                <div className="mt-4 border-t border-slate-100 pt-2">
                  <LogoutButton variant="sidebar" onLogout={() => setSidebarOpen(false)} />
                </div>
              </nav>
            </aside>
          </div>
        </Portal>
      )}

      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 pt-[env(safe-area-inset-top)]">
          {role !== 'customer' && (
            <button className="md:hidden" onClick={toggleSidebar} aria-label="Open menu">
              <Menu className="h-5 w-5 text-slate-600" />
            </button>
          )}
          <span className="text-sm font-medium text-slate-800">{mobileTitle}</span>
          <div className="ml-auto md:block">
            <LogoutButton className="hidden md:inline-flex" />
          </div>
        </header>
        <main
          className={cn(
            'flex flex-1 flex-col p-4 sm:p-6',
            role === 'customer' && 'pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-6',
          )}
        >
          <div className="flex-1">
            <Outlet />
          </div>
          <SiteFooter compact className={cn('mt-8 border-0', role === 'customer' && 'hidden md:block')} />
        </main>
      </div>
      {role === 'customer' && <CustomerMobileNav />}
    </div>
  )
}
