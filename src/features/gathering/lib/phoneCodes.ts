export const PHONE_COUNTRY_CODES = [
  { code: '+94', label: 'LK +94' },
  { code: '+65', label: 'SG +65' },
  { code: '+1', label: 'US/CA +1' },
  { code: '+44', label: 'UK +44' },
  { code: '+61', label: 'AU +61' },
  { code: '+971', label: 'UAE +971' },
  { code: '+966', label: 'SA +966' },
  { code: '+974', label: 'QA +974' },
  { code: '+91', label: 'IN +91' },
  { code: '+60', label: 'MY +60' },
  { code: '+66', label: 'TH +66' },
  { code: '+49', label: 'DE +49' },
  { code: '+33', label: 'FR +33' },
  { code: '+81', label: 'JP +81' },
  { code: '+82', label: 'KR +82' },
] as const

export const DEFAULT_PHONE_COUNTRY_CODE = '+94'

/** Combine country code and local number into a single stored value, e.g. +94 771234567 */
export function combinePhoneNumber(countryCode: string, localNumber: string): string {
  const dial = countryCode.replace(/\D/g, '')
  let local = localNumber.replace(/\D/g, '')
  if (local.startsWith('0')) local = local.slice(1)
  if (!dial || !local) return ''
  return `+${dial} ${local}`
}
