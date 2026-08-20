import { cn } from '@/shared/lib/utils'

type SectionHeadingProps = {
  eyebrow?: string
  title: string
  description?: string
  align?: 'left' | 'center'
  className?: string
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        align === 'center' && 'text-center',
        className,
      )}
    >
      {eyebrow && (
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-primary">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-2 text-section font-bold tracking-tight text-brand-text">{title}</h2>
      {description && (
        <p
          className={cn(
            'mt-3 max-w-2xl text-base leading-relaxed text-brand-text-secondary',
            align === 'center' && 'mx-auto',
          )}
        >
          {description}
        </p>
      )}
    </div>
  )
}
