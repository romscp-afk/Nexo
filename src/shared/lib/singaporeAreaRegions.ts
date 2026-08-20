import { SINGAPORE_AREAS, type SingaporeArea } from '@/shared/lib/constants'

export type ServiceAreaRegion = {
  id: string
  label: string
  areas: readonly SingaporeArea[]
}

/** Region groupings for provider registration — values remain existing SINGAPORE_AREAS strings. */
export const SERVICE_AREA_REGIONS: ServiceAreaRegion[] = [
  {
    id: 'central',
    label: 'Central',
    areas: [
      'Bugis',
      'Bukit Merah',
      'Bukit Timah',
      'CBD',
      'Chinatown',
      'Farrer Park',
      'Holland Village',
      'Kallang',
      'Little India',
      'Marina Bay',
      'Museum',
      'Newton',
      'Novena',
      'Orchard',
      'Outram',
      'Queenstown',
      'Redhill',
      'River Valley',
      'Rochor',
      'Tanglin',
      'Thomson',
      'Toa Payoh',
      'Whampoa',
    ],
  },
  {
    id: 'north',
    label: 'North',
    areas: ['Admiralty', 'Sembawang', 'Woodlands', 'Yishun', 'Seletar'],
  },
  {
    id: 'north-east',
    label: 'North-East',
    areas: ['Ang Mo Kio', 'Hougang', 'Kovan', 'Punggol', 'Sengkang', 'Serangoon'],
  },
  {
    id: 'east',
    label: 'East',
    areas: [
      'Bedok',
      'Changi',
      'East Coast',
      'Geylang',
      'Katong',
      'Marine Parade',
      'Pasir Ris',
      'Paya Lebar',
      'Potong Pasir',
      'Simei',
      'Tampines',
      'Tanah Merah',
    ],
  },
  {
    id: 'west',
    label: 'West',
    areas: [
      'Bishan',
      'Boon Lay',
      'Bukit Batok',
      'Bukit Panjang',
      'Choa Chu Kang',
      'Clementi',
      'Dover',
      'Jurong East',
      'Jurong West',
      'Lakeside',
      'Pioneer',
      'Tengah',
      'Tuas',
    ],
  },
]

const REGION_AREA_SET = new Set(SERVICE_AREA_REGIONS.flatMap((r) => [...r.areas]))

/** Areas in SINGAPORE_AREAS not covered by a region group (kept selectable under Other). */
export const SERVICE_AREA_OTHER: SingaporeArea[] = SINGAPORE_AREAS.filter(
  (a) => !REGION_AREA_SET.has(a),
)

export const SERVICE_AREA_REGIONS_WITH_OTHER: ServiceAreaRegion[] =
  SERVICE_AREA_OTHER.length > 0
    ? [
        ...SERVICE_AREA_REGIONS,
        { id: 'other', label: 'Other', areas: SERVICE_AREA_OTHER },
      ]
    : SERVICE_AREA_REGIONS
