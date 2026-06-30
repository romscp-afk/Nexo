import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/shared/lib/supabase'
import type { AuthUser, SignUpInput } from '@/shared/types/auth'
import { parseRole, type UserRole } from '@/shared/lib/constants'

type AuthContextValue = {
  user: AuthUser | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null; role: UserRole | null }>
  signUp: (input: SignUpInput) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/** Map Supabase user → app user (role from signup metadata until DB sprint) */
function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email ?? '',
    role: parseRole(user.user_metadata?.role),
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setUser(data.session?.user ? toAuthUser(data.session.user) : null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setUser(nextSession?.user ? toAuthUser(nextSession.user) : null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message, role: null }
    const authUser = data.user ? toAuthUser(data.user) : null
    return { error: null, role: authUser?.role ?? null }
  }

  const signUp = async (input: SignUpInput) => {
    const { error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: { role: input.role } },
    })
    return { error: error?.message ?? null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
