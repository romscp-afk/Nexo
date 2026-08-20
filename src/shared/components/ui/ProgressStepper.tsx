import { cn } from '@/shared/lib/utils'

type ProgressStepperProps = {
  steps: readonly string[]
  currentStep: number
  className?: string
}

export function ProgressStepper({ steps, currentStep, className }: ProgressStepperProps) {
  return (
    <nav aria-label="Progress" className={cn('w-full', className)}>
      <ol className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {steps.map((label, i) => {
          const stepNum = i + 1
          const active = stepNum === currentStep
          const done = stepNum < currentStep
          return (
            <li
              key={label}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition duration-200',
                active && 'bg-brand-primary text-white',
                done && 'bg-brand-light text-brand-primary',
                !active && !done && 'bg-brand-bg text-brand-text-muted',
              )}
              aria-current={active ? 'step' : undefined}
            >
              <span
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold',
                  active && 'bg-white/20',
                  done && 'bg-brand-primary/10',
                  !active && !done && 'bg-brand-border/50',
                )}
                aria-hidden
              >
                {done ? '✓' : stepNum}
              </span>
              <span className="whitespace-nowrap">{label}</span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
