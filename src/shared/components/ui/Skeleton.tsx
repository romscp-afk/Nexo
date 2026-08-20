import { cn } from '@/shared/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-brand-border/60', className)}
      aria-hidden
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="rounded-card border border-brand-border bg-brand-surface p-5">
      <div className="flex gap-4">
        <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      </div>
    </div>
  )
}
