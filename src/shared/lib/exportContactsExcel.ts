import * as XLSX from 'xlsx'
import type { ContactSubmission } from '@/shared/types/contact'

const HEADERS = [
  'Name',
  'School',
  'Contact Number',
  'WhatsApp Number',
  'Email',
  'Work Place',
  'Designation',
  'Feedback or Comments',
  'Submitted At',
] as const

export const CONTACT_EXCEL_FILENAME = 'silver-legacy-survey.xlsx'

export function exportContactsToExcel(submissions: ContactSubmission[], filename = CONTACT_EXCEL_FILENAME) {
  const rows = submissions.map((s) => ({
    Name: s.fullName,
    School: s.school,
    'Contact Number': s.contactNumber,
    'WhatsApp Number': s.whatsAppNumber ?? (s.contactIsWhatsApp ? s.contactNumber : ''),
    Email: s.email,
    'Work Place': s.workPlace ?? '',
    Designation: s.designation ?? '',
    'Feedback or Comments': s.feedback ?? '',
    'Submitted At': new Date(s.createdAt).toLocaleString('en-SG'),
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows, { header: [...HEADERS] })
  worksheet['!cols'] = [
    { wch: 22 },
    { wch: 28 },
    { wch: 16 },
    { wch: 16 },
    { wch: 28 },
    { wch: 24 },
    { wch: 22 },
    { wch: 36 },
    { wch: 22 },
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Contact Submissions')

  XLSX.writeFile(workbook, filename)
}
