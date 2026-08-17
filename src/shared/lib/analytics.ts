/** Lightweight funnel analytics — no PII. Extend with your provider if needed. */

export type AnalyticsEvent =
  | 'request_cleaning_clicked'
  | 'cleaning_request_started'
  | 'cleaning_request_step_completed'
  | 'cleaning_request_login_required'
  | 'registration_started'
  | 'registration_completed'
  | 'cleaning_request_confirmed'
  | 'booking_flow_abandoned'
  | 'cleaner_filters_used'
  | 'cleaner_empty_result'
  | 'pwa_prompt_accepted'
  | 'pwa_prompt_dismissed'

type EventProps = Record<string, string | number | boolean | undefined>

const QUEUE_KEY = 'nexo-analytics-queue'

function safeProps(props?: EventProps): EventProps | undefined {
  if (!props) return undefined
  const blocked = /email|phone|password|address|postal|name|notes/i
  const out: EventProps = {}
  for (const [k, v] of Object.entries(props)) {
    if (blocked.test(k)) continue
    out[k] = v
  }
  return out
}

export function trackEvent(event: AnalyticsEvent, props?: EventProps) {
  const payload = {
    event,
    props: safeProps(props),
    ts: new Date().toISOString(),
  }
  if (import.meta.env.DEV) {
    console.info('[analytics]', payload)
  }
  try {
    const prev = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]') as unknown[]
    prev.push(payload)
    localStorage.setItem(QUEUE_KEY, JSON.stringify(prev.slice(-100)))
  } catch {
    /* ignore storage errors */
  }
  window.dispatchEvent(new CustomEvent('nexo-analytics', { detail: payload }))
}
