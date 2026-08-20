import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { Capacitor } from '@capacitor/core'
import { initNativeApp } from '@/shared/lib/nativeApp'
import './index.css'
import App from './App'

void initNativeApp()

// Service workers conflict with Capacitor's local asset loading — web/PWA only.
if (!Capacitor.isNativePlatform()) {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      void updateSW(true)
    },
  })
}

const rootEl = document.getElementById('root')
if (!rootEl) {
  throw new Error('Missing #root element')
}

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
