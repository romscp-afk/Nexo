/** Singapore mobile → E.164 (+65XXXXXXXX) */
export function normalizeSgPhone(raw: string): string | null {
  const trimmed = raw.trim()
  const digits = trimmed.replace(/\D/g, '')
  if (/^[689]\d{7}$/.test(digits)) return `+65${digits}`
  if (/^65[689]\d{7}$/.test(digits)) return `+${digits}`
  if (/^\+65[689]\d{7}$/.test(trimmed)) return trimmed
  return null
}

export function formatSgPhoneDisplay(e164: string): string {
  if (e164.startsWith('+65') && e164.length === 11) {
    return `${e164.slice(0, 3)} ${e164.slice(3)}`
  }
  return e164
}

export function maskSgPhone(e164: string): string {
  if (e164.length < 8) return e164
  return `${e164.slice(0, 4)} **** ${e164.slice(-4)}`
}

export function isValidSgMobileInput(raw: string): boolean {
  return normalizeSgPhone(raw) !== null
}

/** E.164 or stored phone → 8-digit local input for SG forms */
export function sgPhoneToLocalInput(phone: string | null | undefined): string {
  if (!phone) return ''
  const normalized = normalizeSgPhone(phone)
  if (normalized?.startsWith('+65')) return normalized.slice(3)
  return phone.replace(/\D/g, '').replace(/^65/, '')
}

export function whatsAppHref(e164: string): string {
  const digits = e164.replace(/\D/g, '')
  return `https://wa.me/${digits}`
}
