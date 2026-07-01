/**
 * Environment configuration — validated at runtime.
 * Copy .env.example to .env and fill in your Supabase credentials.
 */
function required(name: string, value: string | undefined): string {
  if (!value) {
    if (import.meta.env.DEV) {
      console.warn(`[env] Missing ${name} — using placeholder (auth will not work until configured)`)
      return ''
    }
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export const env = {
  supabaseUrl: required('VITE_SUPABASE_URL', import.meta.env.VITE_SUPABASE_URL),
  supabaseAnonKey: required('VITE_SUPABASE_ANON_KEY', import.meta.env.VITE_SUPABASE_ANON_KEY),
  openAiApiKey: import.meta.env.VITE_OPENAI_API_KEY ?? '',
  openAiConfigured: Boolean(import.meta.env.VITE_OPENAI_API_KEY),
  isDev: import.meta.env.DEV,
  isConfigured:
    Boolean(import.meta.env.VITE_SUPABASE_URL) &&
    Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY),
} as const
