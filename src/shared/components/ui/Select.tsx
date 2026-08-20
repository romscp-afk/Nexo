import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/utils'

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  hint?: string
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, label, hint, error, id, children, ...props },
  ref,
) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <label className="block text-sm">
      {label && (
        <span className="mb-1.5 block font-medium text-brand-text">{label}</span>
      )}
      <select
        ref={ref}
        id={selectId}
        className={cn(
          'w-full rounded-input border bg-white px-3 py-2.5 text-brand-text',
          'transition duration-200 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20',
          error ? 'border-brand-error' : 'border-brand-border',
          className,
        )}
        aria-invalid={error ? true : undefined}
        {...props}
      >
        {children}
      </select>
      {hint && !error && (
        <span className="mt-1 block text-xs text-brand-text-muted">{hint}</span>
      )}
      {error && (
        <span className="mt-1 block text-xs text-brand-error" role="alert">
          {error}
        </span>
      )}
    </label>
  )
})
