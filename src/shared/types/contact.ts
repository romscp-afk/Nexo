export type ContactSubmission = {
  id: string
  fullName: string
  school: string
  contactNumber: string
  contactIsWhatsApp: boolean
  whatsAppNumber: string | null
  email: string
  workPlace: string | null
  designation: string | null
  feedback: string | null
  createdAt: string
}

export type CreateContactSubmissionInput = {
  fullName: string
  school: string
  contactNumber: string
  contactIsWhatsApp: boolean
  whatsAppNumber?: string
  email: string
  workPlace?: string
  designation?: string
  feedback?: string
}

/** Legacy shape from earlier form versions */
export type LegacyContactSubmission = {
  id: string
  fullName: string
  school: string
  contactNumber: string
  email: string
  workingCompany?: string | null
  comments?: string | null
  workPlace?: string | null
  designation?: string | null
  feedback?: string | null
  contactIsWhatsApp?: boolean
  whatsAppNumber?: string | null
  createdAt: string
}

export function normalizeContactSubmission(row: LegacyContactSubmission): ContactSubmission {
  const contactIsWhatsApp = row.contactIsWhatsApp ?? true
  return {
    id: row.id,
    fullName: row.fullName,
    school: row.school,
    contactNumber: row.contactNumber?.trim() || '',
    contactIsWhatsApp,
    whatsAppNumber: contactIsWhatsApp
      ? row.contactNumber?.trim() || null
      : row.whatsAppNumber?.trim() || null,
    email: row.email,
    workPlace: row.workPlace?.trim() || row.workingCompany?.trim() || null,
    designation: row.designation?.trim() || null,
    feedback: row.feedback?.trim() || row.comments?.trim() || null,
    createdAt: row.createdAt,
  }
}
