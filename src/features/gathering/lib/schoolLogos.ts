import allSaints from '@/assets/schools/all-saints.png'
import mahinda from '@/assets/schools/mahinda.png'
import richmond from '@/assets/schools/richmond.png'
import rippon from '@/assets/schools/rippon.png'
import sacredHeart from '@/assets/schools/sacred-heart.png'
import sangamitta from '@/assets/schools/sangamitta.png'
import southlands from '@/assets/schools/southlands.png'
import stAloysius from '@/assets/schools/st-aloysius.png'
import vidyaloka from '@/assets/schools/vidyaloka.png'

export type SchoolLogo = {
  name: string
  shortName: string
  src: string
}

/** Galle batch schools — crest order matches the holding-page gallery layout */
export const SCHOOL_LOGOS: SchoolLogo[] = [
  { name: "St. Aloysius' College", shortName: 'Aloysius', src: stAloysius },
  { name: 'Sacred Heart Convent', shortName: 'Sacred Heart', src: sacredHeart },
  { name: 'Richmond College', shortName: 'Richmond', src: richmond },
  { name: 'Rippon College', shortName: 'Rippon', src: rippon },
  { name: 'Mahinda College', shortName: 'Mahinda', src: mahinda },
  { name: 'Sangamitta College', shortName: 'Sangamitta', src: sangamitta },
  { name: 'Vidyaloka College', shortName: 'Vidyaloka', src: vidyaloka },
  { name: 'Southlands College', shortName: 'Southlands', src: southlands },
  { name: "All Saints' College", shortName: 'All Saints', src: allSaints },
]
