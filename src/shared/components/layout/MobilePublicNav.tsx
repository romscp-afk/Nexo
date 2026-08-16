import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { getDashboardPath } from '@/shared/lib/constants'
import { useAuth } from '@/features/auth/context/AuthProvider'
import { LogoutButton } from '@/shared/components/layout/LogoutButton'
import { cn } from '@/shared/lib/utils'

type MobilePublicNavProps = {
  isHome?: boolean
}

export function MobilePublicNav({ isHome = false }: MobilePublicNavProps) {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()

  const linkClass = cn(
    'block rounded-lg px-4 py-3 text-base font-medium transition',
    isHome ? 'text-nexo-mint/90 hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100',
  )

  return (
    <>
      <button
        type="button"
        className="rounded-lg p-2 md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Menu className={cn('h-5 w-5', isHome ? 'text-white' : 'text-slate-700')} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-hidden />
          <aside
            className={cn(
              'absolute right-0 top-0 flex h-full w-72 flex-col shadow-xl',
              isHome ? 'bg-nexo-ink text-white' : 'bg-white text-slate-900',
            )}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <span className="font-semibold">Menu</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 p-3">
              <Link to="/services" className={linkClass} onClick={() => setOpen(false)}>
                Services
              </Link>
              <Link to="/providers" className={linkClass} onClick={() => setOpen(false)}>
                Find providers
              </Link>
              {user ? (
                <>
                  <Link
                    to={getDashboardPath(user.role)}
                    className={cn(linkClass, 'bg-nexo-700 text-white hover:bg-nexo-800')}
                    onClick={() => setOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <div className="mt-auto border-t border-white/10 p-2 pt-4">
                    <LogoutButton
                      showIcon={false}
                      className="w-full justify-center"
                      onLogout={() => setOpen(false)}
                    />
                  </div>
                </>
              ) : (
                <>
                  <Link to="/login" className={linkClass} onClick={() => setOpen(false)}>
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    className={cn(linkClass, 'bg-nexo-700 text-white hover:bg-nexo-800')}
                    onClick={() => setOpen(false)}
                  >
                    Register
                  </Link>
                </>
              )}
            </nav>
          </aside>
        </div>
      )}
    </>
  )
}
