import { Link } from 'react-router-dom'
import { APP_NAME } from '@/shared/lib/constants'
import { cn } from '@/shared/lib/utils'
import logoWordmarkUrl from '@/assets/logo.png'
import logoIconUrl from '@/assets/logo-icon.png'

type LogoProps = {
  to?: string
  className?: string
  showName?: boolean
  size?: 'sm' | 'md' | 'lg'
  /** Dark header — show full NEXO wordmark */
  highlighted?: boolean
}

const iconSizes = {
  sm: 'h-8 w-8',
  md: 'h-9 w-9',
  lg: 'h-11 w-11',
} as const

const wordmarkSizes = {
  sm: 'h-7 w-auto max-w-[5.5rem]',
  md: 'h-8 w-auto max-w-[6.5rem]',
  lg: 'h-10 w-auto max-w-[8rem]',
} as const

const nameSizes = {
  sm: 'text-base font-semibold',
  md: 'text-base font-semibold',
  lg: 'text-2xl font-bold',
} as const

export function Logo({
  to = '/',
  className,
  showName = true,
  size = 'md',
  highlighted = false,
}: LogoProps) {
  const useWordmark = highlighted

  const content = (
    <>
      {useWordmark ? (
        <img
          src={logoWordmarkUrl}
          alt={`${APP_NAME} logo`}
          className={cn('object-contain object-left', wordmarkSizes[size])}
        />
      ) : (
        <>
          <img
            src={logoIconUrl}
            alt=""
            aria-hidden
            className={cn('rounded-xl object-cover shadow-sm', iconSizes[size])}
          />
          {showName && (
            <span className={cn('text-brand-primary', nameSizes[size])}>{APP_NAME}</span>
          )}
        </>
      )}
    </>
  )

  if (!to) {
    return <div className={cn('inline-flex items-center gap-2', className)}>{content}</div>
  }

  return (
    <Link to={to} className={cn('inline-flex items-center gap-2', className)}>
      {content}
    </Link>
  )
}
