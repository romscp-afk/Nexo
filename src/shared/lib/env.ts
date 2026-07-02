/**
 * Environment configuration — validated at runtime.
 * Copy .env.example to .env and fill in your Supabase credentials.
 * On Vercel/Netlify, set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in project env vars.
 */
function readEnv(name: string, value: string | undefined): string {
  if (value) return value
  if (import.meta.env.DEV) {
    console.warn(`[env] Missing ${name} — using placeholder (auth will not work until configured)`)
  }
  return ''
}

export const env = {
  supabaseUrl: readEnv('VITE_SUPABASE_URL', import.meta.env.VITE_SUPABASE_URL),
  supabaseAnonKey: readEnv('VITE_SUPABASE_ANON_KEY', import.meta.env.VITE_SUPABASE_ANON_KEY),
  openAiApiKey: import.meta.env.VITE_OPENAI_API_KEY ?? '',
  openAiConfigured: Boolean(import.meta.env.VITE_OPENAI_API_KEY),
  isDev: import.meta.env.DEV,
  isConfigured:
    Boolean(import.meta.env.VITE_SUPABASE_URL) &&
    Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY),
} as const
