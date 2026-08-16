import { Download, X } from 'lucide-react'
import { useInstallPrompt } from '@/shared/hooks/useInstallPrompt'

const DISMISS_KEY = 'nexo-install-dismissed'

export function InstallPrompt() {
  const { canInstall, installed, promptInstall } = useInstallPrompt()
  const dismissed = typeof localStorage !== 'undefined' && localStorage.getItem(DISMISS_KEY) === '1'

  if (installed || !canInstall || dismissed) return null

  return (
    <div className="fixed inset-x-4 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-md rounded-xl border border-nexo-200 bg-white p-4 shadow-lg md:bottom-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-nexo-100 text-nexo-700">
          <Download className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900">Install Nexo app</p>
          <p className="mt-0.5 text-sm text-slate-600">
            Add to your home screen for quick booking and chat with providers.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => void promptInstall()}
              className="rounded-lg bg-nexo-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-nexo-800"
            >
              Install
            </button>
            <button
              type="button"
              onClick={() => localStorage.setItem(DISMISS_KEY, '1')}
              className="rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => localStorage.setItem(DISMISS_KEY, '1')}
          className="shrink-0 text-slate-400 hover:text-slate-600"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
