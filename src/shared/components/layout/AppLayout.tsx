import { Link, Outlet } from 'react-router-dom'
import { APP_NAME } from '@/shared/lib/constants'

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link to="/" className="font-semibold text-teal-700">
            {APP_NAME}
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link to="/login" className="text-slate-600 hover:text-teal-700">
              Log in
            </Link>
            <Link to="/register" className="text-slate-600 hover:text-teal-700">
              Register
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} {APP_NAME} · Sprint 1 Foundation
      </footer>
    </div>
  )
}
