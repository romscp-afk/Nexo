import { type HTMLAttributes } from 'react'
import { cn } from '@/shared/lib/utils'

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'muted'
}

const variants = {
  default: 'bg-brand-light text-brand-primary ring-brand-pale',
  success: 'bg-green-50 text-brand-success ring-green-100',
  warning: 'bg-amber-50 text-brand-warning ring-amber-100',
  error: 'bg-red-50 text-brand-error ring-red-100',
  info: 'bg-brand-light text-brand-primary ring-brand-pale',
  muted: 'bg-brand-bg text-brand-text-secondary ring-brand-border',
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}
