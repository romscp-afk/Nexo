type AuthLikeError = {
  message?: string
  code?: string
  status?: number
  name?: string
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: 'Invalid email or password.',
  email_not_confirmed: 'Please confirm your email before signing in.',
  user_already_exists: 'An account with this email already exists.',
  over_email_send_rate_limit: 'Too many emails sent. Please wait a few minutes and try again.',
  over_request_rate_limit: 'Too many attempts. Please wait a moment and try again.',
  signup_disabled: 'Registration is currently disabled.',
  weak_password: 'Password is too weak. Use at least 6 characters.',
}

export function formatAuthError(error: AuthLikeError | null | undefined): string | null {
  if (!error) return null

  const message = error.message?.trim()
  if (message && message !== '{}') return message

  if (error.code && AUTH_ERROR_MESSAGES[error.code]) {
    return AUTH_ERROR_MESSAGES[error.code]
  }

  if (error.status === 500 || message === '{}') {
    return 'Could not complete sign up. There may be a database configuration issue — please try again in a moment.'
  }

  if (error.name === 'AuthRetryableFetchError') {
    return 'Unable to reach the authentication service. Please check your connection and try again.'
  }

  return 'Something went wrong. Please try again.'
}
