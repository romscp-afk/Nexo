import { createClient } from '@supabase/supabase-js'
import { env } from '@/shared/lib/env'

/**
 * Supabase client singleton.
 * Access only through the service layer in later sprints.
 */
export const supabase = createClient(
  env.supabaseUrl || 'https://placeholder.supabase.co',
  env.supabaseAnonKey || 'placeholder-anon-key',
)
