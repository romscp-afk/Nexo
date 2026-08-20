import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/utils'

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  hint?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, hint, error, id, ...props },
  ref,
) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <label className="block text-sm">
      {label && (
        <span className="mb-1.5 block font-medium text-brand-text">{label}</span>
      )}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          'w-full rounded-input border bg-white px-3 py-2.5 text-brand-text',
          'placeholder:text-brand-text-muted transition duration-200',
          'focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20',
          error ? 'border-brand-error' : 'border-brand-border',
          className,
        )}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        {...props}
      />
      {hint && !error && (
        <span id={`${inputId}-hint`} className="mt-1 block text-xs text-brand-text-muted">
          {hint}
        </span>
      )}
      {error && (
        <span id={`${inputId}-error`} className="mt-1 block text-xs text-brand-error" role="alert">
          {error}
        </span>
      )}
    </label>
  )
})
