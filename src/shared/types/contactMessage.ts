export type ContactMessage = {
  id: string
  fullName: string
  email: string
  phone: string | null
  subject: string
  message: string
  emailSentAt: string | null
  createdAt: string
}

export type ContactMessageRow = {
  id: string
  full_name: string
  email: string
  phone: string | null
  subject: string
  message: string
  email_sent_at: string | null
  created_at: string
}

export type SubmitContactInput = {
  fullName: string
  email: string
  phone?: string
  subject: string
  message: string
}

export function mapContactMessage(row: ContactMessageRow): ContactMessage {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    subject: row.subject,
    message: row.message,
    emailSentAt: row.email_sent_at,
    createdAt: row.created_at,
  }
}
