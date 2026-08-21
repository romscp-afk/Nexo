import { Link, useLocation } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

export type NativeTab = {
  to?: string
  label: string
  icon: LucideIcon
  match?: (path: string) => boolean
  action?: 'more'
  badge?: number
}

type NativeTabBarProps = {
  tabs: NativeTab[]
  onMoreClick?: () => void
}

/** Fixed iOS/Android-style bottom tab bar for the Capacitor app. */
export function NativeTabBar({ tabs, onMoreClick }: NativeTabBarProps) {
  const { pathname } = useLocation()

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-brand-border bg-white/95 backdrop-blur-md"
      aria-label="App"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex h-14 max-w-lg items-stretch justify-around px-1">
        {tabs.map(({ to, label, icon: Icon, match, action, badge = 0 }) => {
          const active = action === 'more' ? false : match ? match(pathname) : pathname === to
          const showBadge = badge > 0

          const inner = (
            <>
              <span className="relative flex h-6 w-6 items-center justify-center">
                <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.5 : 2} />
                {showBadge && (
                  <span className="absolute -right-1.5 -top-0.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-brand-primary px-1 text-[9px] font-bold text-white">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-semibold leading-none tracking-wide">{label}</span>
            </>
          )

          const className = cn(
            'relative flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 transition-colors',
            active ? 'text-brand-primary' : 'text-brand-text-muted',
          )

          if (action === 'more') {
            return (
              <button
                key={label}
                type="button"
                onClick={onMoreClick}
                className={className}
                aria-label="More"
              >
                {inner}
              </button>
            )
          }

          return (
            <Link key={to} to={to!} className={className} aria-current={active ? 'page' : undefined}>
              {inner}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
