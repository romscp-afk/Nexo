import { RouterProvider } from 'react-router-dom'
import { AppProviders } from '@/app/providers'
import { router } from '@/app/router'
import { InstallPrompt } from '@/shared/components/layout/InstallPrompt'

export default function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
      <InstallPrompt />
    </AppProviders>
  )
}
