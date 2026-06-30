import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { authService } from '@/shared/services/authService'
import type { AuthUser, SignUpInput } from '@/shared/types/auth'
import { type UserRole } from '@/shared/lib/constants'

type AuthContextValue = {
  user: AuthUser | null
  session: Session | null
  loading: boolean
  profileError: string | null
  signIn: (email: string, password: string) => Promise<{ error: string | null; role: UserRole | null }>
  signUp: (input: SignUpInput) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)

  const loadUser = async (nextSession: Session | null) => {
    setSession(nextSession)

    if (!nextSession?.user) {
      setUser(null)
      setProfileError(null)
      return
    }

    const result = await authService.resolveAuthUser(nextSession.user)
    if (result.error) {
      setProfileError(result.error)
    } else {
      setProfileError(null)
    }
    setUser(result.data)
  }

  const refreshProfile = async () => {
    if (!session?.user) return
    await loadUser(session)
  }

  useEffect(() => {
    authService.getCurrentUser().then(({ data, error }) => {
      if (error) setProfileError(error)
      void loadUser(data?.session ?? null).finally(() => setLoading(false))
    })

    const subscription = authService.onAuthStateChange((nextSession) => {
      void loadUser(nextSession)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await authService.signIn(email, password)
    if (error || !data) return { error: error ?? 'Sign in failed', role: null }
    return { error: null, role: data.role }
  }

  const signUp = async (input: SignUpInput) => {
    const { data, error } = await authService.signUp(input)
    return { error, needsEmailConfirmation: data.needsEmailConfirmation }
  }

  const signOut = async () => {
    await authService.signOut()
    setUser(null)
    setSession(null)
    setProfileError(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, session, loading, profileError, signIn, signUp, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
