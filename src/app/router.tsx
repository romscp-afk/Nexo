import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/shared/components/layout/AppLayout'
import { AuthLayout } from '@/shared/components/layout/AuthLayout'
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout'
import { ProtectedRoute, RoleRoute, GuestRoute } from '@/shared/guards/ProtectedRoute'
import { HomePage } from '@/features/home/pages/HomePage'
import { LoginPage, RegisterPage } from '@/features/auth/pages/AuthPages'
import { ServicesPage } from '@/features/catalog/pages/ServicesPage'
import { CategoryPage } from '@/features/catalog/pages/CategoryPage'
import { ProvidersPage } from '@/features/providers/pages/ProvidersPage'
import { ProviderDetailPage } from '@/features/providers/pages/ProviderDetailPage'
import { ProviderProfilePage } from '@/features/providers/pages/ProviderProfilePage'
import { BookProviderPage } from '@/features/bookings/pages/BookProviderPage'
import {
  CustomerDashboardPage,
  CustomerBookingsPage,
} from '@/features/bookings/pages/CustomerBookingsPages'
import {
  ProviderDashboardPage,
  ProviderBookingsPage,
} from '@/features/bookings/pages/ProviderBookingsPages'
import { BookingDetailPage } from '@/features/bookings/pages/BookingDetailPage'
import { AdminDashboardPage } from '@/features/admin/pages/AdminDashboardPage'
import { AdminUsersPage } from '@/features/admin/pages/AdminUsersPage'
import { AdminProvidersPage } from '@/features/admin/pages/AdminProvidersPage'
import { AdminBookingsPage } from '@/features/admin/pages/AdminBookingsPage'
import { NotFoundPage } from '@/shared/pages/PlaceholderPages'

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/services', element: <ServicesPage /> },
      { path: '/services/:slug', element: <CategoryPage /> },
      { path: '/providers', element: <ProvidersPage /> },
      { path: '/providers/:id', element: <ProviderDetailPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <RoleRoute roles={['customer']} />,
            children: [{ path: '/providers/:id/book', element: <BookProviderPage /> }],
          },
        ],
      },
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
            children: [
              { path: '/dashboard', element: <CustomerDashboardPage /> },
              { path: '/dashboard/bookings', element: <CustomerBookingsPage /> },
              {
                path: '/dashboard/bookings/:id',
                element: <BookingDetailPage role="customer" backPath="/dashboard/bookings" />,
              },
            ],
          },
        ],
      },
      {
        element: <RoleRoute roles={['provider']} />,
        children: [
          {
            element: <DashboardLayout role="provider" />,
            children: [
              { path: '/provider', element: <ProviderDashboardPage /> },
              { path: '/provider/bookings', element: <ProviderBookingsPage /> },
              {
                path: '/provider/bookings/:id',
                element: <BookingDetailPage role="provider" backPath="/provider/bookings" />,
              },
              { path: '/provider/profile', element: <ProviderProfilePage /> },
            ],
          },
        ],
      },
      {
        element: <RoleRoute roles={['admin']} />,
        children: [
          {
            element: <DashboardLayout role="admin" />,
            children: [
              { path: '/admin', element: <AdminDashboardPage /> },
              { path: '/admin/users', element: <AdminUsersPage /> },
              { path: '/admin/providers', element: <AdminProvidersPage /> },
              { path: '/admin/bookings', element: <AdminBookingsPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '/404', element: <Navigate to="/" replace /> },
])
