import { Outlet } from 'react-router-dom'
import { APP_TAGLINE } from '@/shared/lib/constants'
import { Logo } from '@/shared/components/layout/Logo'
import { SiteFooter } from '@/shared/components/layout/SiteFooter'

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-b from-nexo-pearl via-nexo-50 to-nexo-100/50 px-4 py-8">
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="mb-8 text-center">
          <Logo to="/" size="lg" className="flex-col gap-3" />
          <p className="mt-3 text-sm text-nexo-700/70">{APP_TAGLINE}</p>
        </div>
        <div className="w-full max-w-md rounded-2xl border border-nexo-200/80 bg-white/95 p-8 shadow-[0_8px_40px_-12px_rgba(20,46,41,0.15)] backdrop-blur-sm">
          <Outlet />
        </div>
      </div>
      <SiteFooter compact className="mt-8 w-full max-w-md border-0" />
    </div>
  )
}
