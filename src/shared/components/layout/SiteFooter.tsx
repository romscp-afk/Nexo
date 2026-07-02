import { APP_NAME, APP_TAGLINE, DEVELOPER_NAME } from '@/shared/lib/constants'
import { cn } from '@/shared/lib/utils'

type SiteFooterProps = {
  className?: string
  compact?: boolean
}

export function SiteFooter({ className, compact = false }: SiteFooterProps) {
  return (
    <footer
      className={cn(
        'text-center text-xs text-slate-500',
        compact ? 'py-3' : 'border-t border-slate-200 py-4',
        className,
      )}
    >
      <p>© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
      <p className={cn('text-slate-400', compact ? 'mt-0.5' : 'mt-1')}>
        Developed by {DEVELOPER_NAME}
      </p>
      {!compact && (
        <p className="mt-1 text-slate-400">{APP_TAGLINE}</p>
      )}
    </footer>
  )
}
