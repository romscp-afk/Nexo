import { GALLE_SCHOOLS } from '@/features/gathering/lib/eventConfig'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validatePhoneOptional(value: string, label = 'phone number'): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const digits = trimmed.replace(/\D/g, '')
  if (digits.length < 9 || digits.length > 15) {
    return `Enter a valid ${label} (9–15 digits).`
  }
  return null
}

export function validatePhoneRequired(value: string, label = 'contact number'): string | null {
  const trimmed = value.trim()
  if (!trimmed) return `${label.charAt(0).toUpperCase()}${label.slice(1)} is required.`
  return validatePhoneOptional(trimmed, label)
}

export function validateEmail(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return 'Email is required.'
  if (!EMAIL_RE.test(trimmed)) return 'Enter a valid email address.'
  return null
}

export function validateDesignationOptional(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.length < 2) return 'Designation must be at least 2 characters.'
  if (trimmed.length > 80) return 'Designation must be 80 characters or fewer.'
  return null
}

export function validateContactForm(input: {
  fullName: string
  school: string
  contactNumber: string
  contactIsWhatsApp: boolean
  whatsAppNumber: string
  email: string
  designation: string
}): string | null {
  if (!input.fullName.trim()) return 'Name is required.'
  if (!input.school.trim()) return 'School is required.'
  if (!GALLE_SCHOOLS.includes(input.school as (typeof GALLE_SCHOOLS)[number])) {
    return 'Please select a valid school.'
  }

  const contactErr = validatePhoneRequired(input.contactNumber, 'contact number')
  if (contactErr) return contactErr

  if (!input.contactIsWhatsApp) {
    const waErr = validatePhoneOptional(input.whatsAppNumber, 'WhatsApp number')
    if (waErr) return waErr
  }

  const emailErr = validateEmail(input.email)
  if (emailErr) return emailErr

  const designationErr = validateDesignationOptional(input.designation)
  if (designationErr) return designationErr

  return null
}
