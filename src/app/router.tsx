import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/shared/components/layout/AppLayout'
import { AuthLayout } from '@/shared/components/layout/AuthLayout'
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout'
import { ProtectedRoute, RoleRoute, GuestRoute } from '@/shared/guards/ProtectedRoute'
import { HomePage } from '@/features/home/pages/HomePage'
import { LoginPage, RegisterPage } from '@/features/auth/pages/AuthPages'
import {
  DashboardPage,
  ProviderPage,
  AdminPage,
  NotFoundPage,
} from '@/shared/pages/PlaceholderPages'

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    element: <GuestRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <RoleRoute roles={['customer']} />,
        children: [
          {
            element: <DashboardLayout role="customer" />,
            children: [{ path: '/dashboard', element: <DashboardPage /> }],
          },
        ],
      },
      {
        element: <RoleRoute roles={['provider']} />,
        children: [
          {
            element: <DashboardLayout role="provider" />,
            children: [{ path: '/provider', element: <ProviderPage /> }],
          },
        ],
      },
      {
        element: <RoleRoute roles={['admin']} />,
        children: [
          {
            element: <DashboardLayout role="admin" />,
            children: [{ path: '/admin', element: <AdminPage /> }],
          },
        ],
      },
    ],
  },
  { path: '/404', element: <Navigate to="/" replace /> },
])
