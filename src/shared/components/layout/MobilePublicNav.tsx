import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { getDashboardPath } from '@/shared/lib/constants'
import { PRIMARY_CATEGORY_SLUG } from '@/shared/lib/catalogConfig'
import { useAuth } from '@/features/auth/context/AuthProvider'
import { Logo } from '@/shared/components/layout/Logo'
import { InstallNexoMenuItem } from '@/shared/components/layout/InstallNexoMenuItem'
import { Portal } from '@/shared/components/layout/Portal'
import { cn } from '@/shared/lib/utils'

type MobilePublicNavProps = {
  /** When true (Capacitor), show hamburger even on wide screens */
  alwaysVisible?: boolean
}

export function MobilePublicNav({ alwaysVisible = false }: MobilePublicNavProps) {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  const { pathname } = useLocation()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const close = () => setOpen(false)

  const linkClass =
    'flex items-center rounded-xl px-4 py-3.5 text-base font-medium text-brand-primary active:bg-brand-light'

  return (
    <>
      <button
        type="button"
        className={cn('rounded-lg p-2 text-brand-primary', !alwaysVisible && 'md:hidden')}
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {open && (
        <Portal>
          <div className={cn('fixed inset-0 z-[60]', !alwaysVisible && 'md:hidden')}>
            <button
              type="button"
              className="absolute inset-0 bg-slate-900/50"
              onClick={close}
              aria-label="Close menu"
            />
            <aside className="absolute right-0 top-0 flex h-full w-[min(100vw,320px)] flex-col bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 pt-[max(1rem,env(safe-area-inset-top))]">
                <Logo to="/" size="sm" />
                <button
                  type="button"
                  onClick={close}
                  className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex flex-1 flex-col overflow-y-auto p-3">
                <p className="px-4 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Explore
                </p>
                <Link to={`/services/${PRIMARY_CATEGORY_SLUG}`} className={linkClass} onClick={close}>
                  Cleaning Services
                </Link>
                <Link to={`/providers/category/${PRIMARY_CATEGORY_SLUG}`} className={linkClass} onClick={close}>
                  Cleaners
                </Link>
                <Link to="/how-it-works" className={linkClass} onClick={close}>
                  How It Works
                </Link>
                <Link to="/support" className={linkClass} onClick={close}>
                  Help
                </Link>

                <p className="px-4 pb-1 pt-5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Account
                </p>
                {user ? (
                  <>
                    <Link
                      to={getDashboardPath(user.role)}
                      className={cn(linkClass, 'bg-brand-light font-semibold text-brand-navy')}
                      onClick={close}
                    >
                      Go to dashboard
                    </Link>
                    <InstallNexoMenuItem className={linkClass} onAfterClick={close} />
                  </>
                ) : (
                  <>
                    <Link to="/login" className={linkClass} onClick={close}>
                      Log in
                    </Link>
                    <Link
                      to="/services/cleaning/request"
                      className={cn(linkClass, 'mt-2 bg-brand-primary font-semibold text-white')}
                      onClick={close}
                    >
                      Book Now
                    </Link>
                  </>
                )}
              </nav>
            </aside>
          </div>
        </Portal>
      )}
    </>
  )
}
