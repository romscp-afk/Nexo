import { Link } from 'react-router-dom'
import { APP_NAME } from '@/shared/lib/constants'
import { cn } from '@/shared/lib/utils'
import logoUrl from '@/assets/logo.png'

type LogoProps = {
  to?: string
  className?: string
  showName?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const imageSizes = {
  sm: 'h-7 w-7',
  md: 'h-8 w-8',
  lg: 'h-16 w-16',
} as const

const nameSizes = {
  sm: 'text-base font-semibold',
  md: 'text-base font-semibold',
  lg: 'text-2xl font-bold',
} as const

export function Logo({ to = '/', className, showName = true, size = 'md' }: LogoProps) {
  const content = (
    <>
      <img
        src={logoUrl}
        alt={`${APP_NAME} logo`}
        className={cn('shrink-0 object-contain', imageSizes[size])}
      />
      {showName && (
        <span className={cn('text-nexo-700', nameSizes[size])}>{APP_NAME}</span>
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
