const VISIT_KEY = 'nexo-visit-count'
const DISMISS_AT_KEY = 'nexo-install-dismissed-at'
const ENGAGEMENT_KEY = 'nexo-pwa-engagement'
const COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000
const FORCE_SHOW_KEY = 'nexo-install-force'

export function recordSiteVisit() {
  try {
    const count = Number(localStorage.getItem(VISIT_KEY) ?? '0') + 1
    localStorage.setItem(VISIT_KEY, String(count))
  } catch {
    /* ignore */
  }
}

export function recordPwaEngagement() {
  try {
    localStorage.setItem(ENGAGEMENT_KEY, '1')
  } catch {
    /* ignore */
  }
}

/** Call after a successful booking submit so install eligibility unlocks. */
export function recordBookingCompletedForPwa() {
  recordPwaEngagement()
}

export function requestInstallPromptManually() {
  try {
    localStorage.setItem(FORCE_SHOW_KEY, '1')
  } catch {
    /* ignore */
  }
}

export function clearManualInstallRequest() {
  try {
    localStorage.removeItem(FORCE_SHOW_KEY)
  } catch {
    /* ignore */
  }
}

export function dismissInstallPrompt() {
  try {
    localStorage.setItem(DISMISS_AT_KEY, String(Date.now()))
    localStorage.removeItem(FORCE_SHOW_KEY)
  } catch {
    /* ignore */
  }
}

const BLOCKED_PATH_PREFIXES = ['/login', '/register', '/support', '/services/cleaning/request']

export function isInstallPromptBlockedPath(pathname: string): boolean {
  return BLOCKED_PATH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )
}

export function shouldShowInstallPrompt(pathname?: string): boolean {
  try {
    if (pathname && isInstallPromptBlockedPath(pathname)) return false

    const dismissedAt = Number(localStorage.getItem(DISMISS_AT_KEY) ?? '0')
    if (dismissedAt && Date.now() - dismissedAt < COOLDOWN_MS) return false

    const force = localStorage.getItem(FORCE_SHOW_KEY) === '1'
    if (force) return true

    const visits = Number(localStorage.getItem(VISIT_KEY) ?? '0')
    const engaged = localStorage.getItem(ENGAGEMENT_KEY) === '1'
    // Second session (visit count >= 2) or after booking/engagement — never on first paint alone.
    return visits >= 2 || engaged
  } catch {
    return false
  }
}
