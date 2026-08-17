import { APP_NAME, APP_TAGLINE, DEVELOPER_NAME, DEVELOPER_URL } from '@/shared/lib/constants'
import { cn } from '@/shared/lib/utils'

type SiteFooterProps = {
  className?: string
  compact?: boolean
}

export function SiteFooter({ className, compact = false }: SiteFooterProps) {
  return (
    <footer
      className={cn(
        'text-center text-xs text-nexo-700/60',
        compact ? 'py-3' : 'border-t border-nexo-200/80 py-4',
        className,
      )}
    >
      <p>
        © {new Date().getFullYear()} {APP_NAME}. All rights reserved.{' '}
        <a
          href={DEVELOPER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-nexo-600/70 underline-offset-2 transition hover:text-nexo-700 hover:underline"
        >
          By {DEVELOPER_NAME}
        </a>
      </p>
      {!compact && (
        <p className="mt-1 text-nexo-600/50">{APP_TAGLINE}</p>
      )}
    </footer>
  )
}
