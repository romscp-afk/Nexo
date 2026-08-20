import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { StatusBar, Style } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'

/** True when running inside the iOS/Android Capacitor shell. */
export function isNativeApp() {
  return Capacitor.isNativePlatform()
}

/** Native shell bootstrap — no-ops on web. */
export async function initNativeApp() {
  if (!isNativeApp()) return

  const root = document.documentElement
  root.classList.add('native-app')
  root.dataset.platform = Capacitor.getPlatform()
  // Keep mobile layout even on wide iPad / landscape simulators.
  root.classList.add('native-mobile-shell')

  try {
    await StatusBar.setStyle({ style: Style.Light })
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color: '#ffffff' })
    }
  } catch {
    // Status bar plugin may be unavailable in some simulators
  }

  try {
    await SplashScreen.hide()
  } catch {
    // ignore
  }

  void App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back()
    } else {
      void App.exitApp()
    }
  })
}
