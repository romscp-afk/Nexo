import { DEMO_ADMIN_EMAIL } from '@/shared/lib/constants'

export const GATHERING_ADMIN_USERNAME = 'Admin'

/** Maps gathering admin username to Supabase email for sign-in */
export function resolveGatheringAdminLogin(identifier: string): string {
  const trimmed = identifier.trim()
  if (trimmed.toLowerCase() === GATHERING_ADMIN_USERNAME.toLowerCase()) {
    return DEMO_ADMIN_EMAIL
  }
  return trimmed
}

export const EVENT = {
  title: 'Silver Legacy 2001',
  tagline: 'One Journey, Endless Memories',
  batch: 'We Are 2K01 Galle',
  date: '11 July 2026',
  time: '9.00 am – 4.00 pm',
  venue: 'Radisson Blu Resort, Galle',
  dressCode: 'Smart Casual',
  ticketPrice: 'LKR 7,000',
  contacts: [
    { name: 'Buddika', phone: '077 314 1113' },
    { name: 'Manjula', phone: '077 123 2942' },
    { name: 'Nuwan', phone: '077 395 9547' },
  ],
  excelFilename: 'silver-legacy-survey.xlsx',
} as const

export const GALLE_SCHOOLS = [
  "St. Aloysius' College",
  'Sacred Heart Convent',
  'Richmond College',
  'Rippon College',
  'Mahinda College',
  'Sangamitta College',
  'Vidyaloka College',
  'Southlands College',
  "All Saints' College",
] as const
