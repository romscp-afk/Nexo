import { Link, Outlet } from 'react-router-dom'
import { APP_NAME } from '@/shared/lib/constants'

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="mb-8 text-center">
        <Link to="/" className="text-2xl font-bold text-teal-700">
          {APP_NAME}
        </Link>
        <p className="mt-1 text-sm text-slate-500">Home services marketplace</p>
      </div>
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <Outlet />
      </div>
    </div>
  )
}
