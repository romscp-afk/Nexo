import { createClient } from '@supabase/supabase-js'
import { env } from '@/shared/lib/env'

/**
 * Supabase client singleton.
 * Auth flows use authService; feature services will use this in later sprints.
 */
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey)
