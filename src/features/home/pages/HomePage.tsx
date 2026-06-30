import { Link } from 'react-router-dom'
import { env } from '@/shared/lib/env'

export function HomePage() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Welcome to Nexo</h1>
        <p className="mt-2 text-slate-600">
          Sprint 1 foundation — routing, auth, and layouts are in place.
        </p>
        {!env.isConfigured && (
          <p className="mt-4 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800">
            Supabase is not configured. Copy <code>.env.example</code> to <code>.env</code>.
          </p>
        )}
        <div className="mt-6 flex justify-center gap-3">
          <Link
            to="/login"
            className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  )
}
