import { Outlet } from 'react-router-dom'
import { Logo } from '@/shared/components/layout/Logo'

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="mb-8 text-center">
        <Logo to="/" size="lg" className="flex-col gap-3" />
        <p className="mt-3 text-sm text-slate-500">Home services marketplace</p>
      </div>
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <Outlet />
      </div>
    </div>
  )
}
