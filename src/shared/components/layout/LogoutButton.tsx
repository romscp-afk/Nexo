import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/features/auth/context/AuthProvider'
import { cn } from '@/shared/lib/utils'

type LogoutButtonProps = {
  className?: string
  showIcon?: boolean
  variant?: 'header' | 'sidebar'
  onLogout?: () => void
}

export function LogoutButton({
  className,
  showIcon = true,
  variant = 'header',
  onLogout,
}: LogoutButtonProps) {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    onLogout?.()
    navigate('/login')
  }

  const styles =
    variant === 'sidebar'
      ? 'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100'
      : 'inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50'

  return (
    <button type="button" onClick={handleLogout} className={cn(styles, className)}>
      {showIcon && <LogOut className="h-4 w-4" />}
      Log out
    </button>
  )
}
