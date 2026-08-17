/** Phase 1 cleaning copy — TODO: confirm legal/policy text with business before production. */

/** Customer-facing catalog hourly rate for standard home cleaning (SGD). */
export const CLEANING_CATALOG_HOURLY_RATE = 15

export const MIN_BOOKING_HOURS = 2

/** Extra charge when the cleaner brings cleaning supplies (SGD). */
export const CLEANING_SUPPLIES_SURCHARGE_SGD = 10

export const CLEANING_BOOKING_DURATION_HOURS = [2, 3, 4] as const

export const BOOKING_CONFIRMATION =
  'Requests are sent to available cleaners. A booking is confirmed only after a cleaner accepts your request.'

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
  {
    value: 'cleaner',
    label: 'Cleaner brings supplies',
    surcharge: CLEANING_SUPPLIES_SURCHARGE_SGD,
  },
] as const

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
    'Prices are quoted per hour per booking. Final cost depends on duration and the cleaner you select. A platform fee may apply at checkout.',
  minDuration: `${MIN_BOOKING_HOURS} hours minimum per booking`,
  supplies:
    'You can bring your own supplies at no extra charge, or add a supplies fee for the cleaner to bring them.',
  bookingProcess: BOOKING_CONFIRMATION,
  serviceAreas:
    'We are onboarding cleaners across Singapore. Availability varies by area — use Find a Cleaner to see who serves your location.',
  // TODO(business): provide approved cancellation policy text
  cancellation:
    'Cancellation terms depend on booking status and timing. Full policy requires business approval.',
  faqs: [
    {
      q: 'When is my booking confirmed?',
      a: BOOKING_CONFIRMATION,
    },
    {
      q: 'How is pricing calculated?',
      a: 'Hourly rates are set by each cleaner. Your estimate includes duration and any platform fee shown at checkout.',
    },
    {
      q: 'Do I need an account?',
      a: 'You can prepare your request as a guest. We ask you to sign in or register before submitting so we can contact you about your booking.',
    },
  ],
} as const
