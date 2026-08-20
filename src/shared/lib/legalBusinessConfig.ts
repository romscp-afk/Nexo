/**
 * Central legal / business identity for Nexo public policies and contact display.
 *
 * DEPLOYMENT CHECKLIST (before commercial launch):
 * - Set legalBusinessName (registered entity)
 * - Set uen (ACRA UEN)
 * - Set registeredAddress
 * - Set privacyEmail / DPO contact (or confirm supportEmail is appropriate)
 * - Confirm effectiveDate and lastUpdatedDate with counsel
 *
 * Legal policy drafts require review by a Singapore-qualified lawyer before production launch.
 *
 * Leave unset fields empty. Do not invent UEN, address, or company names for display.
 */

export type LegalBusinessConfig = {
  legalBusinessName: string
  tradingName: string
  uen: string
  registeredAddress: string
  supportEmail: string
  privacyEmail: string
  effectiveDate: string
  lastUpdatedDate: string
}

export const LEGAL_BUSINESS: LegalBusinessConfig = {
  legalBusinessName: '',
  tradingName: 'Nexo',
  uen: '',
  registeredAddress: '',
  supportEmail: '',
  privacyEmail: '',
  effectiveDate: '2026-08-20',
  lastUpdatedDate: '2026-08-20',
}

export function hasLegalEntityConfigured(): boolean {
  return Boolean(
    LEGAL_BUSINESS.legalBusinessName.trim() &&
      LEGAL_BUSINESS.uen.trim() &&
      LEGAL_BUSINESS.registeredAddress.trim(),
  )
}

export function formatLegalDate(isoDate: string): string {
  if (!isoDate) return ''
  const d = new Date(`${isoDate}T12:00:00+08:00`)
  if (Number.isNaN(d.getTime())) return isoDate
  return d.toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Singapore',
  })
}

/** Public display name — never invent an entity name. */
export function publicTradingName(): string {
  return LEGAL_BUSINESS.tradingName.trim() || 'Nexo'
}

export function privacyContactDisplay(): string | null {
  const privacy = LEGAL_BUSINESS.privacyEmail.trim()
  const support = LEGAL_BUSINESS.supportEmail.trim()
  if (privacy) return privacy
  if (support) return support
  return null
}
