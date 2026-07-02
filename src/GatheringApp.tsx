import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from '@/features/auth/context/AuthProvider'
import { gatheringRouter } from '@/app/gatheringRouter'

export default function GatheringApp() {
  return (
    <AuthProvider>
      <RouterProvider router={gatheringRouter} />
    </AuthProvider>
  )
}
