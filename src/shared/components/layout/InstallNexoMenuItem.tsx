import { Download } from 'lucide-react'
import { useInstallPrompt } from '@/shared/hooks/useInstallPrompt'
import { requestInstallPromptManually } from '@/shared/lib/pwaEngagement'
import { cn } from '@/shared/lib/utils'

type InstallNexoMenuItemProps = {
  className?: string
  onAfterClick?: () => void
}

/** Authenticated account menu action — only when browser install is supported. */
export function InstallNexoMenuItem({ className, onAfterClick }: InstallNexoMenuItemProps) {
  const { canInstall, installed, promptInstall } = useInstallPrompt()

  if (installed || !canInstall) return null

  const handleClick = async () => {
    requestInstallPromptManually()
    const accepted = await promptInstall()
    if (!accepted) {
      // Keep force flag so banner can appear on eligible routes after menu closes.
    }
    onAfterClick?.()
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      className={cn(
        'flex min-h-11 w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left text-base font-medium text-slate-800 hover:bg-slate-100',
        className,
      )}
    >
      <Download className="h-5 w-5 shrink-0 text-nexo-700" aria-hidden />
      Install Nexo
    </button>
  )
}
