import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import GatheringApp from './GatheringApp'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GatheringApp />
  </StrictMode>,
)
