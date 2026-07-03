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
import { RequestServicePage } from '@/features/bookings/pages/RequestServicePage'
import { BookProviderPage } from '@/features/bookings/pages/BookProviderPage'
import {
  CustomerDashboardPage,
  CustomerBookingsPage,
} from '@/features/bookings/pages/CustomerBookingsPages'
import { SavedProvidersPage } from '@/features/customer/pages/SavedProvidersPage'
import { CustomerProfilePage } from '@/features/customer/pages/CustomerProfilePage'
import { CustomerNotificationsPage, ProviderNotificationsPage } from '@/features/customer/pages/CustomerNotificationsPage'
import { CustomerReviewsPage } from '@/features/customer/pages/CustomerReviewsPage'
import {
  ProviderDashboardPage,
  ProviderBookingsPage,
} from '@/features/bookings/pages/ProviderBookingsPages'
import { BookingDetailPage } from '@/features/bookings/pages/BookingDetailPage'
import { BookingChatsPage } from '@/features/bookings/pages/BookingChatsPage'
import { ProviderEarningsPage } from '@/features/providers/pages/ProviderEarningsPage'
import { AdminDashboardPage } from '@/features/admin/pages/AdminDashboardPage'
import { AdminUsersPage } from '@/features/admin/pages/AdminUsersPage'
import { AdminProvidersPage } from '@/features/admin/pages/AdminProvidersPage'
import { AdminBookingsPage } from '@/features/admin/pages/AdminBookingsPage'
import { AdminPaymentsPage } from '@/features/admin/pages/AdminPaymentsPage'
import { AdminActivityPage } from '@/features/admin/pages/AdminActivityPage'
import { ContactEntryPage } from '@/features/contact/pages/ContactEntryPage'
import { ContactReportPage } from '@/features/contact/pages/ContactReportPage'
import { GatheringLayout } from '@/features/gathering/components/GatheringLayout'
import { GatheringAdminRoute } from '@/features/gathering/guards/GatheringAdminRoute'
import { GatheringAdminLoginPage } from '@/features/gathering/pages/GatheringAdminLoginPage'
import { GatheringIntroPage } from '@/features/gathering/pages/GatheringIntroPage'
import { GatheringThankYouPage } from '@/features/gathering/pages/GatheringThankYouPage'
import { NotFoundPage } from '@/shared/pages/PlaceholderPages'

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/services', element: <ServicesPage /> },
      { path: '/services/:slug', element: <CategoryPage /> },
      { path: '/providers', element: <ProvidersPage /> },
      { path: '/providers/category/:slug', element: <ProvidersPage /> },
      { path: '/providers/:id', element: <ProviderDetailPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <RoleRoute roles={['customer']} />,
            children: [
              { path: '/services/:slug/request', element: <RequestServicePage /> },
              { path: '/providers/:id/book', element: <BookProviderPage /> },
            ],
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
              { path: '/dashboard/messages', element: <BookingChatsPage role="customer" /> },
              { path: '/dashboard/reviews', element: <CustomerReviewsPage /> },
              { path: '/dashboard/notifications', element: <CustomerNotificationsPage /> },
              { path: '/dashboard/saved-providers', element: <SavedProvidersPage /> },
              { path: '/dashboard/profile', element: <CustomerProfilePage /> },
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
              { path: '/provider/messages', element: <BookingChatsPage role="provider" /> },
              { path: '/provider/earnings', element: <ProviderEarningsPage /> },
              { path: '/provider/notifications', element: <ProviderNotificationsPage /> },
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
              { path: '/admin/payments', element: <AdminPaymentsPage /> },
              { path: '/admin/activity', element: <AdminActivityPage /> },
            ],
          },
        ],
      },
    ],
  },
  {
    element: <GatheringLayout />,
    children: [
      { path: '/contact', element: <GatheringIntroPage /> },
      { path: '/contact/entry', element: <ContactEntryPage /> },
      { path: '/contact/thank-you', element: <GatheringThankYouPage /> },
      { path: '/contact/admin/login', element: <GatheringAdminLoginPage /> },
      {
        element: <GatheringAdminRoute />,
        children: [{ path: '/contact/report', element: <ContactReportPage /> }],
      },
    ],
  },
  { path: '/404', element: <Navigate to="/" replace /> },
])
