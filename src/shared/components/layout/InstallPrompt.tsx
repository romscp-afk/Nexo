import { useEffect, useId, useRef, useState } from 'react'
import { Download, X } from 'lucide-react'
import { useInstallPrompt } from '@/shared/hooks/useInstallPrompt'
import {
  clearManualInstallRequest,
  dismissInstallPrompt,
  shouldShowInstallPrompt,
} from '@/shared/lib/pwaEngagement'
import { trackEvent } from '@/shared/lib/analytics'
import { cn } from '@/shared/lib/utils'

/** Pathname without Router context (this component sits beside RouterProvider). */
function usePathnameOutsideRouter() {
  const [pathname, setPathname] = useState(() => window.location.pathname)
  useEffect(() => {
    const sync = () => setPathname(window.location.pathname)
    const id = window.setInterval(sync, 400)
    window.addEventListener('popstate', sync)
    return () => {
      window.clearInterval(id)
      window.removeEventListener('popstate', sync)
    }
  }, [])
  return pathname
}

function isBlockingUiActive(): boolean {
  if (typeof document === 'undefined') return false
  if (document.querySelector('[role="dialog"]:not([data-install-prompt])')) return true
  if (document.querySelector('[aria-modal="true"]:not([data-install-prompt])')) return true
  if (document.querySelector('[role="alert"][data-form-error]')) return true
  if (document.querySelector('form[data-install-block="true"]')) return true
  const active = document.activeElement
  if (
    active &&
    (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT')
  ) {
    return true
  }
  return false
}

export function InstallPrompt() {
  const pathname = usePathnameOutsideRouter()
  const { canInstall, installed, promptInstall } = useInstallPrompt()
  const [visible, setVisible] = useState(false)
  const [blockedByUi, setBlockedByUi] = useState(false)
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const eligible = shouldShowInstallPrompt(pathname)

  useEffect(() => {
    if (installed || !canInstall || !eligible) {
      setVisible(false)
      return
    }
    const id = window.setTimeout(() => setVisible(true), 800)
    return () => window.clearTimeout(id)
  }, [installed, canInstall, eligible, pathname])

  useEffect(() => {
    if (!visible) return
    const check = () => setBlockedByUi(isBlockingUiActive())
    check()
    const t = window.setInterval(check, 500)
    return () => window.clearInterval(t)
  }, [visible])

  useEffect(() => {
    if (!visible || blockedByUi) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        dismissInstallPrompt()
        clearManualInstallRequest()
        setVisible(false)
        trackEvent('pwa_prompt_dismissed')
      }
    }
    window.addEventListener('keydown', onKey)
    dialogRef.current?.querySelector<HTMLElement>('button')?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [visible, blockedByUi])

  const handleDismiss = () => {
    dismissInstallPrompt()
    clearManualInstallRequest()
    setVisible(false)
    trackEvent('pwa_prompt_dismissed')
  }

  const handleInstall = async () => {
    const accepted = await promptInstall()
    clearManualInstallRequest()
    if (accepted) {
      trackEvent('pwa_prompt_accepted')
      setVisible(false)
    } else {
      handleDismiss()
    }
  }

  if (!visible || blockedByUi || installed || !canInstall || !eligible) return null

  return (
    <div
      ref={dialogRef}
      data-install-prompt
      className={cn(
        'fixed inset-x-4 z-30 mx-auto max-w-md rounded-xl border border-nexo-200 bg-white p-4 shadow-lg',
        'bottom-[calc(5.5rem+env(safe-area-inset-bottom))] md:bottom-6 md:max-w-sm',
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-nexo-100 text-nexo-700">
          <Download className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p id={titleId} className="font-semibold text-slate-900">
            Install Nexo
          </p>
          <p className="mt-0.5 text-sm text-slate-600">
            Add to your home screen for quick access to cleaning requests.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => void handleInstall()}
              className="min-h-11 rounded-lg bg-nexo-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-nexo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nexo-600"
            >
              Install
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="min-h-11 rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nexo-600"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded text-slate-400 hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nexo-600"
          aria-label="Dismiss install prompt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
