type AuthLikeError = {
  message?: string
  code?: string
  status?: number
  name?: string
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: 'Invalid email or password — the admin account may not exist yet.',
  email_not_confirmed: 'Please confirm your email before signing in.',
  user_already_exists: 'An account with this email already exists.',
  over_email_send_rate_limit: 'Too many emails sent. Please wait a few minutes and try again.',
  over_request_rate_limit: 'Too many attempts. Please wait a moment and try again.',
  signup_disabled: 'Registration is currently disabled.',
  weak_password: 'Password is too weak. Use at least 6 characters.',
}

function isNetworkError(message: string, name?: string): boolean {
  if (name === 'AuthRetryableFetchError') return true
  return /load failed|failed to fetch|networkerror|network request failed|fetch failed/i.test(message)
}

export function formatAuthError(error: AuthLikeError | null | undefined): string | null {
  if (!error) return null

  const code = error.code ?? (error as { error_code?: string }).error_code
  if (code && AUTH_ERROR_MESSAGES[code]) {
    return AUTH_ERROR_MESSAGES[code]
  }

  const message = error.message?.trim()
  if (message && message !== '{}' && !isNetworkError(message, error.name)) {
    if (/phone whatsapp verification|phone verification is required|invalid or expired phone verification/i.test(message)) {
      return 'Registration is blocked by an old WhatsApp verification rule in the database. Ask your admin to run supabase/restore-email-registration.sql in the Supabase SQL Editor.'
    }
    return message
  }

  if (error.status === 500 || message === '{}') {
    return 'Could not complete auth. This is often a database trigger issue — run supabase/restore-email-registration.sql in the Supabase SQL Editor, then try again.'
  }

  if (isNetworkError(message ?? '', error.name)) {
    return 'Cannot reach Supabase. Check your internet connection and that VITE_SUPABASE_URL in .env matches your project.'
  }

  return 'Something went wrong. Please try again.'
}
