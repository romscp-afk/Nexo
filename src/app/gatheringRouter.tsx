import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ContactEntryPage } from '@/features/contact/pages/ContactEntryPage'
import { ContactReportPage } from '@/features/contact/pages/ContactReportPage'
import { GatheringLayout } from '@/features/gathering/components/GatheringLayout'
import { GatheringAdminRoute } from '@/features/gathering/guards/GatheringAdminRoute'
import { GatheringAdminLoginPage } from '@/features/gathering/pages/GatheringAdminLoginPage'
import { GatheringIntroPage } from '@/features/gathering/pages/GatheringIntroPage'
import { GatheringThankYouPage } from '@/features/gathering/pages/GatheringThankYouPage'

export const gatheringRouter = createBrowserRouter([
  {
    element: <GatheringLayout />,
    children: [
      { path: '/', element: <Navigate to="/contact" replace /> },
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
  { path: '*', element: <Navigate to="/contact" replace /> },
])
