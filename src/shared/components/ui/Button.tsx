import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/utils'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'white'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  asChild?: false
}

const variants = {
  primary:
    'bg-brand-primary text-white shadow-brand hover:bg-brand-primary-hover focus-visible:outline-brand-primary',
  secondary:
    'bg-brand-light text-brand-primary hover:bg-brand-pale focus-visible:outline-brand-primary',
  outline:
    'border border-brand-border bg-white text-brand-text hover:bg-brand-bg focus-visible:outline-brand-primary',
  ghost: 'text-brand-text-secondary hover:bg-brand-bg hover:text-brand-text focus-visible:outline-brand-primary',
  danger: 'bg-brand-error text-white hover:bg-red-700 focus-visible:outline-brand-error',
  white:
    'bg-white text-brand-navy shadow-sm hover:bg-brand-light focus-visible:outline-white',
}

const sizes = {
  sm: 'min-h-9 px-3 py-1.5 text-sm',
  md: 'min-h-11 px-4 py-2.5 text-sm',
  lg: 'min-h-12 px-6 py-3 text-base',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', fullWidth, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition duration-200',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    />
  )
})
