import { Link } from 'react-router-dom'
import { APP_NAME } from '@/shared/lib/constants'
import { cn } from '@/shared/lib/utils'
import logoWordmarkUrl from '@/assets/logo.png'

type LogoProps = {
  to?: string
  className?: string
  showName?: boolean
  size?: 'sm' | 'md' | 'lg'
  /** @deprecated Kept for callers; wordmark is always used on white/navy surfaces */
  highlighted?: boolean
}

const wordmarkSizes = {
  sm: 'h-7 w-auto max-w-[7rem]',
  md: 'h-8 w-auto max-w-[8.5rem]',
  lg: 'h-10 w-auto max-w-[11rem]',
} as const

export function Logo({
  to = '/',
  className,
  size = 'md',
}: LogoProps) {
  const content = (
    <img
      src={logoWordmarkUrl}
      alt={APP_NAME}
      className={cn('object-contain object-left', wordmarkSizes[size])}
    />
  )

  if (!to) {
    return <div className={cn('inline-flex items-center', className)}>{content}</div>
  }

  return (
    <Link to={to} className={cn('inline-flex items-center', className)} aria-label={APP_NAME}>
      {content}
    </Link>
  )
}
