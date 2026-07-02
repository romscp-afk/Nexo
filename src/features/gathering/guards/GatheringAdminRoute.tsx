import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthProvider'

function LoadingScreen() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <p className="text-sm text-blue-700">Loading…</p>
    </div>
  )
}

/** Requires admin login for gathering report */
export function GatheringAdminRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingScreen />
  if (!user) {
    return <Navigate to="/contact/admin/login" state={{ from: location }} replace />
  }
  if (user.role !== 'admin') {
    return <Navigate to="/contact" replace />
  }

  return <Outlet />
}
