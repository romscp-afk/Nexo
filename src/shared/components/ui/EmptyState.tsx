import { type ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

type EmptyStateProps = {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-card border border-dashed border-brand-border bg-brand-bg px-6 py-12 text-center',
        className,
      )}
    >
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-light text-brand-primary">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-brand-text">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-brand-text-secondary">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
