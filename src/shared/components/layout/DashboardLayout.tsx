import { Link, Outlet, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { type UserRole } from '@/shared/lib/constants'
import { useAppStore } from '@/shared/stores/appStore'
import { cn } from '@/shared/lib/utils'
import { useUnreadNotificationCount } from '@/features/customer/hooks/useNotifications'
import { useUnreadChatCount } from '@/features/bookings/hooks/useBookingChat'
import { useChatRealtimeSync } from '@/features/bookings/hooks/useChatRealtime'
import { LogoutButton } from '@/shared/components/layout/LogoutButton'
import { Logo } from '@/shared/components/layout/Logo'
import { SiteFooter } from '@/shared/components/layout/SiteFooter'
import { CustomerMobileNav } from '@/shared/components/layout/CustomerMobileNav'
import { InstallNexoMenuItem } from '@/shared/components/layout/InstallNexoMenuItem'
import { Portal } from '@/shared/components/layout/Portal'
import { CleaningRequestLink } from '@/shared/components/CleaningPriceLabel'
import { isNativeApp } from '@/shared/lib/nativeApp'

type BadgeKind = 'notifications' | 'messages'

type NavItem = { to: string; label: string; exact?: boolean; badge?: BadgeKind }

const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  customer: [
    { to: '/dashboard', label: 'Home', exact: true },
    { to: '/dashboard/bookings', label: 'Bookings' },
    { to: '/dashboard/messages', label: 'Messages', badge: 'messages' },
    { to: '/dashboard/saved-providers', label: 'Saved service providers' },
    { to: '/dashboard/reviews', label: 'Reviews' },
    { to: '/dashboard/notifications', label: 'Notifications', badge: 'notifications' },
    { to: '/dashboard/profile', label: 'Profile' },
  ],
  provider: [
    { to: '/provider', label: 'Today', exact: true },
    { to: '/provider/bookings', label: 'Requests' },
    { to: '/provider/schedule', label: 'Schedule' },
    { to: '/provider/messages', label: 'Messages', badge: 'messages' },
    { to: '/provider/earnings', label: 'Earnings' },
    { to: '/provider/notifications', label: 'Notifications', badge: 'notifications' },
    { to: '/provider/support', label: 'Support' },
    { to: '/provider/profile', label: 'Profile' },
  ],
  admin: [
    { to: '/admin', label: 'Dashboard', exact: true },
    { to: '/admin/payments', label: 'PayNow payments' },
    { to: '/admin/reports', label: 'Analytics' },
    { to: '/admin/chats', label: 'Booking chats' },
    { to: '/admin/contact', label: 'Contact messages' },
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
        'flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition duration-200',
        isActive
          ? 'bg-brand-light text-brand-primary'
          : 'text-brand-text-secondary hover:bg-brand-bg hover:text-brand-text',
      )}
    >
      <span>{item.label}</span>
      {item.badge && badgeCount > 0 && (
        <span className="rounded-full bg-brand-primary px-1.5 py-0.5 text-xs font-semibold text-white">
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
  const native = isNativeApp()

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
    const item = nav.find((n) => isActive(n))
    return item?.label ?? 'Dashboard'
  })()

  return (
    <div className="flex min-h-dvh bg-brand-bg">
      {!native && (
        <aside className="hidden w-60 shrink-0 border-r border-brand-border bg-brand-surface md:block">
          <div className="flex h-16 items-center border-b border-brand-border px-4">
            <Logo to="/" size="sm" />
          </div>
          <nav className="space-y-1 p-3" aria-label="Dashboard">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                item={item}
                isActive={isActive(item)}
                badgeCount={badgeForItem(item)}
              />
            ))}
            {role === 'customer' && (
              <div className="mt-4 px-1">
                <CleaningRequestLink className="flex min-h-10 w-full items-center justify-center rounded-full bg-brand-primary text-sm font-semibold text-white transition hover:bg-brand-primary-hover">
                  Request Cleaning
                </CleaningRequestLink>
              </div>
            )}
            <Link to="/" className="mt-4 block px-3 text-xs text-brand-text-muted hover:text-brand-primary">
              ← Back to site
            </Link>
            <div className="mt-2 px-1">
              <InstallNexoMenuItem className="rounded-lg px-3 py-2.5 text-sm" />
            </div>
            <div className="mt-2 border-t border-brand-border pt-2">
              <LogoutButton variant="sidebar" />
            </div>
          </nav>
        </aside>
      )}

      {sidebarOpen && (
        <Portal>
          <div className={cn('fixed inset-0 z-40', !native && 'md:hidden')}>
            <div className="absolute inset-0 bg-brand-navy/40" onClick={() => setSidebarOpen(false)} />
            <aside className="absolute left-0 top-0 h-full w-64 bg-brand-surface shadow-card-hover">
              <div className="flex h-16 items-center justify-between border-b border-brand-border px-4 pt-[env(safe-area-inset-top)]">
                <Logo to="/" size="sm" />
                <button onClick={() => setSidebarOpen(false)} aria-label="Close menu" className="min-h-11 min-w-11">
                  <X className="h-5 w-5 text-brand-text-secondary" />
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
                <div className="mt-4 border-t border-brand-border pt-2">
                  <InstallNexoMenuItem
                    className="rounded-lg px-3 py-2.5 text-sm"
                    onAfterClick={() => setSidebarOpen(false)}
                  />
                  <LogoutButton variant="sidebar" onLogout={() => setSidebarOpen(false)} />
                </div>
              </nav>
            </aside>
          </div>
        </Portal>
      )}

      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-brand-border bg-brand-surface px-4 pt-[env(safe-area-inset-top)] sm:h-16">
          {(role === 'provider' || role === 'admin' || (native && role === 'customer')) && (
            <button
              className={cn('min-h-11 min-w-11', !native && 'md:hidden')}
              onClick={toggleSidebar}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5 text-brand-text-secondary" />
            </button>
          )}
          <span className="text-sm font-semibold text-brand-text">{mobileTitle}</span>
          {!native && (
            <div className="ml-auto">
              <LogoutButton className="hidden md:inline-flex" />
            </div>
          )}
        </header>
        <main
          className={cn(
            'flex flex-1 flex-col p-4 sm:p-6',
            role === 'customer' && 'pb-[calc(5rem+env(safe-area-inset-bottom))]',
            !native && role === 'customer' && 'md:pb-6',
          )}
        >
          <div className="mx-auto w-full max-w-5xl flex-1">
            <Outlet />
          </div>
          {!native && (
            <SiteFooter compact className={cn('mt-8', role === 'customer' && 'hidden md:block')} />
          )}
        </main>
      </div>
      {role === 'customer' && <CustomerMobileNav forceVisible={native} />}
    </div>
  )
}
