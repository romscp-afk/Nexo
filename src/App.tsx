import { RouterProvider } from 'react-router-dom'
import { AppProviders } from '@/app/providers'
import { router } from '@/app/router'
import { AssistantWidget } from '@/features/assistant/components/AssistantWidget'

export default function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
      <AssistantWidget />
    </AppProviders>
  )
}
