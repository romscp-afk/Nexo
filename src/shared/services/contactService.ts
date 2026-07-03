import { supabase } from '@/shared/lib/supabase'
import { env } from '@/shared/lib/env'
import type { AuthResult } from '@/shared/services/authService'
import type {
  ContactSubmission,
  CreateContactSubmissionInput,
} from '@/shared/types/contact'

const SCHEMA = 'gathering'
const TABLE = 'survey_submissions'

function fromSurveyTable() {
  return supabase.schema(SCHEMA).from(TABLE)
}

type SurveySubmissionRow = {
  id: string
  full_name: string
  school: string
  contact_number: string
  contact_is_whatsapp: boolean
  whatsapp_number: string | null
  email: string
  work_place: string | null
  designation: string | null
  feedback: string | null
  created_at: string
}

function mapRow(row: SurveySubmissionRow): ContactSubmission {
  return {
    id: row.id,
    fullName: row.full_name,
    school: row.school,
    contactNumber: row.contact_number,
    contactIsWhatsApp: row.contact_is_whatsapp,
    whatsAppNumber: row.whatsapp_number,
    email: row.email,
    workPlace: row.work_place,
    designation: row.designation,
    feedback: row.feedback,
    createdAt: row.created_at,
  }
}

function formatError(error: { message?: string; code?: string } | null): string {
  if (!error?.message) return 'Something went wrong. Please try again.'
  if (
    error.code === 'PGRST205' ||
    error.message.includes('survey_submissions') ||
    error.message.includes('gathering')
  ) {
    return 'Survey database is not set up yet. Run supabase/add-survey-submissions.sql in the Nexo Supabase SQL Editor, then expose the "gathering" schema in API settings.'
  }
  if (/JWT|session|not authenticated/i.test(error.message)) {
    return 'Admin session expired. Please sign in again.'
  }
  return error.message
}

function ensureConfigured(): string | null {
  if (!env.isConfigured) {
    return 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  }
  return null
}

function mapInputToSubmission(input: CreateContactSubmissionInput): ContactSubmission {
  const contactNumber = input.contactNumber.trim()
  const contactIsWhatsApp = input.contactIsWhatsApp
  const whatsAppNumber = contactIsWhatsApp
    ? contactNumber
    : input.whatsAppNumber?.trim() || null

  return {
    id: '',
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
}

export const contactService = {
  async submit(input: CreateContactSubmissionInput): Promise<AuthResult<ContactSubmission>> {
    const configError = ensureConfigured()
    if (configError) return { data: null as unknown as ContactSubmission, error: configError }

    const contactNumber = input.contactNumber.trim()
    const contactIsWhatsApp = input.contactIsWhatsApp
    const whatsAppNumber = contactIsWhatsApp
      ? contactNumber
      : input.whatsAppNumber?.trim() || null

    const { error } = await fromSurveyTable().insert({
      full_name: input.fullName.trim(),
      school: input.school.trim(),
      contact_number: contactNumber,
      contact_is_whatsapp: contactIsWhatsApp,
      whatsapp_number: whatsAppNumber,
      email: input.email.trim().toLowerCase(),
      work_place: input.workPlace?.trim() || null,
      designation: input.designation?.trim() || null,
      feedback: input.feedback?.trim() || null,
    })

    if (error) return { data: null as unknown as ContactSubmission, error: formatError(error) }
    return { data: mapInputToSubmission(input), error: null }
  },

  async listAll(): Promise<AuthResult<ContactSubmission[]>> {
    const configError = ensureConfigured()
    if (configError) return { data: [], error: configError }

    const { data, error } = await fromSurveyTable()
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return { data: [], error: formatError(error) }
    return { data: (data as SurveySubmissionRow[]).map(mapRow), error: null }
  },

  async clearAll(): Promise<AuthResult<null>> {
    const configError = ensureConfigured()
    if (configError) return { data: null, error: configError }

    const { error } = await fromSurveyTable()
      .delete()
      .not('id', 'is', null)

    if (error) return { data: null, error: formatError(error) }
    return { data: null, error: null }
  },

  async deleteByIds(ids: string[]): Promise<AuthResult<number>> {
    if (!ids.length) return { data: 0, error: null }

    const configError = ensureConfigured()
    if (configError) return { data: 0, error: configError }

    const { data, error } = await fromSurveyTable()
      .delete()
      .in('id', ids)
      .select('id')

    if (error) return { data: 0, error: formatError(error) }
    return { data: data?.length ?? 0, error: null }
  },

  async deleteById(id: string): Promise<AuthResult<number>> {
    return contactService.deleteByIds([id])
  },
}
