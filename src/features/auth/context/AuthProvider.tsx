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
import { type UserRole, DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD } from '@/shared/lib/constants'

type AuthContextValue = {
  user: AuthUser | null
  session: Session | null
  loading: boolean
  profileError: string | null
  signIn: (email: string, password: string) => Promise<{ error: string | null; role: UserRole | null }>
  setupDemoAdmin: () => Promise<{ error: string | null; role: UserRole | null; message: string | null }>
  signUp: (input: SignUpInput) => Promise<{ error: string | null; needsEmailConfirmation: boolean; role?: UserRole }>
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
    authService
      .getCurrentUser()
      .then(({ data, error }) => {
        if (error) setProfileError(error)
        return loadUser(data?.session ?? null)
      })
      .catch(() => {
        setProfileError('Unable to reach Supabase — check your connection and .env')
        setUser(null)
        setSession(null)
      })
      .finally(() => setLoading(false))

    const subscription = authService.onAuthStateChange((nextSession) => {
      void loadUser(nextSession)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await authService.signIn(email, password)
    if (error || !data) return { error: error ?? 'Sign in failed', role: null }

    setSession(data.session)
    setUser({
      id: data.user.id,
      email: data.user.email ?? email,
      role: data.role,
      fullName: data.user.user_metadata?.full_name as string | undefined,
      phone: (data.user.user_metadata?.phone as string | null) ?? null,
      addressLine1: (data.user.user_metadata?.address_line1 as string | null) ?? null,
      addressLine2: (data.user.user_metadata?.address_line2 as string | null) ?? null,
      postalCode: (data.user.user_metadata?.postal_code as string | null) ?? null,
      preferredArea: (data.user.user_metadata?.preferred_area as string | null) ?? null,
    })

    setTimeout(() => {
      void loadUser(data.session)
    }, 0)

    return { error: null, role: data.role }
  }

  const setupDemoAdmin = async () => {
    const setup = await authService.setupDemoAdmin()
    if (setup.error) {
      return { error: setup.error, role: null, message: null }
    }

    if (setup.data.alreadyExists) {
      const login = await authService.signIn(DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD)
      if (login.data) {
        setSession(login.data.session)
        setUser({
          id: login.data.user.id,
          email: login.data.user.email ?? DEMO_ADMIN_EMAIL,
          role: login.data.role,
          fullName: login.data.user.user_metadata?.full_name as string | undefined,
          phone: (login.data.user.user_metadata?.phone as string | null) ?? null,
          addressLine1: null,
          addressLine2: null,
          postalCode: null,
          preferredArea: null,
        })
        setTimeout(() => void loadUser(login.data!.session), 0)
        return { error: null, role: login.data.role, message: null }
      }
      return {
        error: null,
        role: null,
        message: `Admin user exists but password is not ${DEMO_ADMIN_PASSWORD}. In Supabase Dashboard → Authentication → Users → ${DEMO_ADMIN_EMAIL} → reset password.`,
      }
    }

    if (setup.data.needsEmailConfirmation) {
      return {
        error: null,
        role: null,
        message: `Admin account created. Check email to confirm, then log in with ${DEMO_ADMIN_PASSWORD}.`,
      }
    }

    return signIn(DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD).then((result) => ({
      ...result,
      message: result.error ? null : 'Admin account created. Signed in.',
    }))
  }

  const signUp = async (input: SignUpInput) => {
    const { data, error } = await authService.signUp(input)
    if (error) return { error, needsEmailConfirmation: data.needsEmailConfirmation }
    if (data.needsEmailConfirmation) {
      return { error: null, needsEmailConfirmation: true }
    }
    await refreshProfile()
    return { error: null, needsEmailConfirmation: false, role: input.role }
  }

  const signOut = async () => {
    await authService.signOut()
    setUser(null)
    setSession(null)
    setProfileError(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, session, loading, profileError, signIn, setupDemoAdmin, signUp, signOut, refreshProfile }}
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
