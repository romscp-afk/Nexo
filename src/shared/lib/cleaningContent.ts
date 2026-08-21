/** Phase 1 cleaning copy — TODO: confirm legal/policy text with business before production. */

/** Duration-based hourly rates for standard home cleaning (SGD). Longer bookings = lower hourly rate. */
export const CLEANING_DURATION_HOURLY_RATES: Record<
  (typeof CLEANING_BOOKING_DURATION_HOURS)[number],
  number
> = {
  2: 25,
  3: 23,
  4: 20,
}

/** Lowest tier — used for marketing "from" price. */
export const CLEANING_CATALOG_HOURLY_RATE = CLEANING_DURATION_HOURLY_RATES[4]

export function getCleaningHourlyRateForDuration(durationHours: number): number {
  if (durationHours === 4) return CLEANING_DURATION_HOURLY_RATES[4]
  if (durationHours === 3) return CLEANING_DURATION_HOURLY_RATES[3]
  return CLEANING_DURATION_HOURLY_RATES[2]
}

export const MIN_BOOKING_HOURS = 2

/** Rate charged for each hour beyond the booked duration (SGD). */
export const CLEANING_EXTRA_HOUR_RATE_SGD = 15

/** Extra charge when the service provider brings cleaning supplies (SGD). */
export const CLEANING_SUPPLIES_SURCHARGE_SGD = 10

export const CLEANING_BOOKING_DURATION_HOURS = [2, 3, 4] as const

export const CLEANING_SERVICE_PLANS = [
  {
    id: 'one-time',
    label: 'One-time',
    description: 'Book a single cleaning online — choose your date and duration.',
    bookOnline: true,
  },
  {
    id: 'weekly',
    label: 'Weekly',
    description: 'Same service provider on a regular weekly schedule with a tailored quote.',
    bookOnline: false,
    contactSubject: 'Weekly cleaning plan enquiry',
  },
  {
    id: 'monthly',
    label: 'Monthly',
    description: 'Monthly upkeep or scheduled deep cleans — we arrange a plan for you.',
    bookOnline: false,
    contactSubject: 'Monthly cleaning plan enquiry',
  },
] as const

export const CLEANING_RECURRING_PLANS_NOTE =
  'One-time bookings can be requested online. Weekly and monthly plans are also available — contact us for pricing and your preferred schedule.'

export const BOOKING_CONFIRMATION =
  'After you submit, you will get a unique PayNow QR code with the amount and booking reference. Requests are sent to available service providers — a booking is confirmed once a service provider accepts.'

export const CLEANING_TYPES = [
  {
    id: 'standard',
    serviceSlug: 'cleaning-standard',
    label: 'Standard home cleaning',
    description: 'Regular upkeep for HDB, condo and landed homes.',
    supported: true,
  },
  {
    id: 'deep',
    serviceSlug: 'cleaning-deep',
    label: 'Deep cleaning',
    description: 'Intensive clean for kitchens, bathrooms and detailed areas.',
    supported: false,
    comingSoon: true,
  },
  {
    id: 'move',
    serviceSlug: 'cleaning-move',
    label: 'Move-in / move-out cleaning',
    description: 'End-of-tenancy or pre-move cleaning.',
    supported: false,
    comingSoon: true,
  },
] as const

export const PROPERTY_TYPES = ['HDB', 'Condo', 'Landed home'] as const

export const SUPPLY_OPTIONS = [
  { value: 'customer', label: 'I will provide cleaning supplies', surcharge: 0 },
] as const

/** Service provider–provided supplies are not bookable online for now — customers should contact support. */
export const CLEANER_SUPPLIES_CONTACT_NOTE =
  'Need the service provider to bring supplies? Contact us — this option is arranged separately and may include additional charges.'

export const CLEANING_SERVICE_CONTENT = {
  overview:
    'Professional home cleaning for HDB flats, condominiums and landed homes across Singapore.',
  included: [
    'General tidying and surface wiping',
    'Floor vacuuming and mopping',
    'Kitchen and bathroom cleaning (standard scope)',
    'Bedroom and living area cleaning',
  ],
  notIncluded: [
    'Heavy post-renovation debris removal',
    'Exterior window cleaning (high-rise)',
    'Pest control or hazardous waste',
    'Repairs or handyman work',
  ],
  propertyTypes: ['HDB', 'Condo', 'Landed home'],
  pricingNote:
    'Hourly rate depends on booking length: $25/hr for 2 hours, $23/hr for 3 hours, $20/hr for 4 hours. Extra hours beyond your booking are $15/hr.',
  minDuration: `${MIN_BOOKING_HOURS} hours minimum per booking`,
  supplies:
    'Please provide your own cleaning supplies for online bookings. If you need the service provider to bring supplies, contact us — this may include additional charges.',
  bookingProcess: BOOKING_CONFIRMATION,
  serviceAreas:
    'We are onboarding service providers across Singapore. Availability varies by area — use Find a Service Provider to see who serves your location.',
  cancellation:
    'See the Cancellation and Rescheduling Policy for timing-based rules, refunds and rescheduling.',
  faqs: [
    {
      q: 'When is my booking confirmed?',
      a: BOOKING_CONFIRMATION,
    },
    {
      q: 'How is pricing calculated?',
      a: 'Rates vary by duration: $25/hr (2 hours), $23/hr (3 hours), $20/hr (4 hours). Extra hours beyond your booking are $15/hr. Supplies fees are shown at checkout when applicable.',
    },
    {
      q: 'Do you offer weekly or monthly cleaning?',
      a: 'Yes. One-time cleanings can be booked online. For weekly or monthly plans with a regular service provider, contact us and we will arrange a schedule and quote for you.',
    },
    {
      q: 'Do I need an account?',
      a: 'You can prepare your request as a guest. We ask you to sign in or register before submitting so we can contact you about your booking.',
    },
  ],
} as const
