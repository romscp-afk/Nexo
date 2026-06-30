import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthProvider'
import { getDashboardPath, type UserRole } from '@/shared/lib/constants'

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <p className="text-sm text-slate-500">Loading…</p>
    </div>
  )
}

/** Requires authenticated session */
export function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />

  return <Outlet />
}

/** Requires specific role(s) — use inside ProtectedRoute */
export function RoleRoute({ roles }: { roles: UserRole[] }) {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!user || !roles.includes(user.role)) return <Navigate to="/" replace />

  return <Outlet />
}

/** Redirect authenticated users away from login/register */
export function GuestRoute() {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (user) return <Navigate to={getDashboardPath(user.role)} replace />

  return <Outlet />
}
