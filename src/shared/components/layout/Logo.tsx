import { Link } from 'react-router-dom'
import { APP_NAME } from '@/shared/lib/constants'
import { cn } from '@/shared/lib/utils'
import logoUrl from '@/assets/logo.png'

type LogoProps = {
  to?: string
  className?: string
  showName?: boolean
  size?: 'sm' | 'md' | 'lg'
  /** White badge behind logo — for dark headers */
  highlighted?: boolean
}

const imageSizes = {
  sm: 'h-[2.1rem] w-[2.1rem]',
  md: 'h-[2.4rem] w-[2.4rem]',
  lg: 'h-[4.8rem] w-[4.8rem]',
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
  const content = (
    <>
      <span
        className={cn(
          'inline-flex shrink-0 items-center justify-center',
          highlighted && 'rounded-xl bg-white p-1 shadow-md shadow-black/10',
        )}
      >
        <img
          src={logoUrl}
          alt={`${APP_NAME} logo`}
          className={cn('object-contain', imageSizes[size], highlighted && 'h-[2rem] w-[2rem]')}
        />
      </span>
      {showName && (
        <span
          className={cn(
            highlighted ? 'font-semibold text-white' : 'text-nexo-500',
            nameSizes[size],
          )}
        >
          {APP_NAME}
        </span>
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
