const VISIT_KEY = 'nexo-visit-count'
const DISMISS_AT_KEY = 'nexo-install-dismissed-at'
const ENGAGEMENT_KEY = 'nexo-pwa-engagement'
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000

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

export function dismissInstallPrompt() {
  try {
    localStorage.setItem(DISMISS_AT_KEY, String(Date.now()))
  } catch {
    /* ignore */
  }
}

export function shouldShowInstallPrompt(): boolean {
  try {
    const dismissedAt = Number(localStorage.getItem(DISMISS_AT_KEY) ?? '0')
    if (dismissedAt && Date.now() - dismissedAt < COOLDOWN_MS) return false

    const visits = Number(localStorage.getItem(VISIT_KEY) ?? '0')
    const engaged = localStorage.getItem(ENGAGEMENT_KEY) === '1'
    return visits >= 2 || engaged
  } catch {
    return false
  }
}
