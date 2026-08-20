import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { StatusBar, Style } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'

/** Native shell bootstrap — no-ops on web. */
export async function initNativeApp() {
  if (!Capacitor.isNativePlatform()) return

  document.documentElement.classList.add('native-app')
  document.documentElement.dataset.platform = Capacitor.getPlatform()

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

export function isNativeApp() {
  return Capacitor.isNativePlatform()
}
