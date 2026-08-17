import { Download, X } from 'lucide-react'
import { useInstallPrompt } from '@/shared/hooks/useInstallPrompt'
import { dismissInstallPrompt, shouldShowInstallPrompt } from '@/shared/lib/pwaEngagement'
import { trackEvent } from '@/shared/lib/analytics'

export function InstallPrompt() {
  const { canInstall, installed, promptInstall } = useInstallPrompt()
  const eligible = shouldShowInstallPrompt()

  if (installed || !canInstall || !eligible) return null

  const handleDismiss = () => {
    dismissInstallPrompt()
    trackEvent('pwa_prompt_dismissed')
  }

  const handleInstall = async () => {
    const accepted = await promptInstall()
    if (accepted) trackEvent('pwa_prompt_accepted')
    else handleDismiss()
  }

  return (
    <div
      className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-30 mx-auto max-w-md rounded-xl border border-nexo-200 bg-white p-4 shadow-lg md:bottom-6 md:max-w-sm"
      role="dialog"
      aria-labelledby="install-prompt-title"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-nexo-100 text-nexo-700">
          <Download className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p id="install-prompt-title" className="font-semibold text-slate-900">
            Install Nexo app
          </p>
          <p className="mt-0.5 text-sm text-slate-600">
            Add to your home screen for quick access to cleaning requests.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => void handleInstall()}
              className="min-h-10 rounded-lg bg-nexo-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-nexo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nexo-600"
            >
              Install
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="min-h-10 rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nexo-600"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="shrink-0 rounded p-1 text-slate-400 hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nexo-600"
          aria-label="Dismiss install prompt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
