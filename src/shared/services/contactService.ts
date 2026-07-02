import type { AuthResult } from '@/shared/services/authService'
import {
  normalizeContactSubmission,
  type ContactSubmission,
  type CreateContactSubmissionInput,
  type LegacyContactSubmission,
} from '@/shared/types/contact'

const STORAGE_KEY = 'silver_legacy_2001_survey'

function readAll(): ContactSubmission[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as LegacyContactSubmission[]
    if (!Array.isArray(parsed)) return []
    return parsed.map(normalizeContactSubmission)
  } catch {
    return []
  }
}

function writeAll(submissions: ContactSubmission[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions))
}

export const contactService = {
  submit(input: CreateContactSubmissionInput): AuthResult<ContactSubmission> {
    const contactNumber = input.contactNumber.trim()
    const contactIsWhatsApp = input.contactIsWhatsApp
    const whatsAppNumber = contactIsWhatsApp
      ? contactNumber
      : input.whatsAppNumber?.trim() || null

    const entry: ContactSubmission = {
      id: crypto.randomUUID(),
      fullName: input.fullName.trim(),
      school: input.school.trim(),
      contactNumber,
      contactIsWhatsApp,
      whatsAppNumber,
      email: input.email.trim().toLowerCase(),
      workPlace: input.workPlace?.trim() || null,
      designation: input.designation?.trim() || null,
      feedback: input.feedback?.trim() || null,
      createdAt: new Date().toISOString(),
    }

    const submissions = [entry, ...readAll()]
    writeAll(submissions)

    return { data: entry, error: null }
  },

  listAll(): AuthResult<ContactSubmission[]> {
    return { data: readAll(), error: null }
  },

  clearAll(): AuthResult<null> {
    localStorage.removeItem(STORAGE_KEY)
    return { data: null, error: null }
  },

  deleteByIds(ids: string[]): AuthResult<number> {
    if (!ids.length) return { data: 0, error: null }
    const idSet = new Set(ids)
    const remaining = readAll().filter((row) => !idSet.has(row.id))
    const removed = readAll().length - remaining.length
    writeAll(remaining)
    return { data: removed, error: null }
  },

  deleteById(id: string): AuthResult<number> {
    return contactService.deleteByIds([id])
  },
}
