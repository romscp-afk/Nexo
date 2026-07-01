import { supabase } from '@/shared/lib/supabase'
import { env } from '@/shared/lib/env'

let cachedReady: boolean | null = null

export async function isDatabaseReady(): Promise<boolean> {
  if (cachedReady !== null) return cachedReady

  const { error } = await supabase.from('profiles').select('id').limit(1)
  if (!error) {
    cachedReady = true
    return true
  }

  const missing =
    error.message.includes("Could not find the table 'public.profiles'") ||
    error.message.includes('PGRST205')

  cachedReady = !missing
  return cachedReady
}

export function getSqlEditorUrl(): string {
  const ref = env.supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
  return ref
    ? `https://supabase.com/dashboard/project/${ref}/sql/new`
    : 'https://supabase.com/dashboard'
}
