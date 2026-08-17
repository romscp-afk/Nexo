import { User } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

type ProviderAvatarProps = {
  name: string
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-10 w-10',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
} as const

const iconClasses = {
  sm: 'h-5 w-5',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
} as const

export function ProviderAvatar({ name, avatarUrl, size = 'md', className }: ProviderAvatarProps) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <div
      className={cn(
        'shrink-0 overflow-hidden rounded-full bg-nexo-100 ring-1 ring-nexo-200/80',
        sizeClasses[size],
        className,
      )}
      aria-hidden={!avatarUrl}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center bg-gradient-to-br from-nexo-50 to-nexo-100 text-nexo-700"
          title={name}
        >
          {initials ? (
            <span className="text-sm font-semibold">{initials}</span>
          ) : (
            <User className={iconClasses[size]} aria-label="Default profile photo" />
          )}
        </div>
      )}
    </div>
  )
}
