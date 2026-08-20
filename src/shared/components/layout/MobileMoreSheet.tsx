import { Link } from 'react-router-dom'
import { Bell, Bookmark, Home, Star, User, X } from 'lucide-react'
import { useAuth } from '@/features/auth/context/AuthProvider'
import { LogoutButton } from '@/shared/components/layout/LogoutButton'
import { InstallNexoMenuItem } from '@/shared/components/layout/InstallNexoMenuItem'
import { Portal } from '@/shared/components/layout/Portal'
import { cn } from '@/shared/lib/utils'

type MobileMoreSheetProps = {
  open: boolean
  onClose: () => void
  unreadNotifications?: number
}

function SheetLink({
  to,
  icon: Icon,
  label,
  badge,
  onNavigate,
}: {
  to: string
  icon: typeof Home
  label: string
  badge?: number
  onNavigate: () => void
}) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-base font-medium text-slate-800 active:bg-slate-100"
    >
      <Icon className="h-5 w-5 shrink-0 text-nexo-700" />
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="rounded-full bg-nexo-700 px-2 py-0.5 text-xs font-semibold text-white">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  )
}

export function MobileMoreSheet({ open, onClose, unreadNotifications = 0 }: MobileMoreSheetProps) {
  const { user } = useAuth()

  if (!open) return null

  return (
    <Portal>
      <div className="fixed inset-0 z-[70] md:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50"
        onClick={onClose}
        aria-label="Close menu"
      />
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 rounded-t-2xl bg-white shadow-2xl',
          'pb-[max(1rem,env(safe-area-inset-bottom))]',
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-lg font-semibold text-slate-900">More</p>
            {user?.fullName && (
              <p className="text-sm text-slate-500">{user.fullName}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-1 p-3">
          <p className="px-4 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Account
          </p>
          <SheetLink to="/dashboard" icon={Home} label="Dashboard" onNavigate={onClose} />
          <SheetLink to="/dashboard/profile" icon={User} label="Profile" onNavigate={onClose} />
          <InstallNexoMenuItem onAfterClick={onClose} />
          <SheetLink
            to="/dashboard/notifications"
            icon={Bell}
            label="Notifications"
            badge={unreadNotifications}
            onNavigate={onClose}
          />

          <p className="px-4 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Activity
          </p>
          <SheetLink to="/dashboard/reviews" icon={Star} label="My reviews" onNavigate={onClose} />
          <SheetLink
            to="/dashboard/saved-providers"
            icon={Bookmark}
            label="Saved providers"
            onNavigate={onClose}
          />

          <div className="border-t border-slate-100 px-2 pt-3">
            <LogoutButton
              variant="sidebar"
              showIcon
              className="w-full rounded-xl px-4 py-3.5 text-base text-red-600 hover:bg-red-50"
              onLogout={onClose}
            />
          </div>
        </nav>
      </div>
    </div>
    </Portal>
  )
}
