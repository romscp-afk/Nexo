import { useEffect } from 'react'
import { SITE_URL } from '@/shared/lib/constants'

export type PageMetaInput = {
  title: string
  description: string
  path?: string
  noIndex?: boolean
  ogImage?: string
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.content = content
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null
  if (!el) {
    el = document.createElement('link')
    el.rel = rel
    document.head.appendChild(el)
  }
  el.href = href
}

/** Client-side document meta for SPA routes (no react-helmet). */
export function applyPageMeta({
  title,
  description,
  path = '/',
  noIndex = false,
  ogImage = `${SITE_URL}/pwa-icon-512.png`,
}: PageMetaInput) {
  const url = `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
  document.title = title
  upsertMeta('name', 'description', description)
  upsertMeta('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow')
  upsertMeta('property', 'og:title', title)
  upsertMeta('property', 'og:description', description)
  upsertMeta('property', 'og:url', url)
  upsertMeta('property', 'og:type', 'website')
  upsertMeta('property', 'og:image', ogImage)
  upsertMeta('property', 'og:site_name', 'Nexo')
  upsertMeta('name', 'twitter:card', 'summary_large_image')
  upsertMeta('name', 'twitter:title', title)
  upsertMeta('name', 'twitter:description', description)
  upsertMeta('name', 'twitter:image', ogImage)
  upsertLink('canonical', url)
}

export function usePageMeta(meta: PageMetaInput) {
  const { title, description, path, noIndex, ogImage } = meta
  useEffect(() => {
    applyPageMeta({ title, description, path, noIndex, ogImage })
  }, [title, description, path, noIndex, ogImage])
}

export const PAGE_META = {
  home: {
    title: 'Nexo | Home Cleaning Services in Singapore',
    description:
      'Request reliable home-cleaning services across Singapore with clear pricing, flexible scheduling and trackable bookings.',
    path: '/',
  },
  cleaningService: {
    title: 'Home Cleaning Services Singapore | Nexo',
    description:
      'Explore Nexo standard home-cleaning services for HDB flats, condominiums and landed homes across Singapore.',
    path: '/services/cleaning',
  },
  cleaningRequest: {
    title: 'Request Home Cleaning in Singapore | Nexo',
    description:
      'Choose your property details, preferred schedule and cleaning duration to request a Nexo home-cleaning service.',
    path: '/services/cleaning/request',
  },
  findCleaner: {
    title: 'Find Cleaning Service Providers in Singapore | Nexo',
    description:
      'Browse approved cleaning companies and request home-cleaning support through Nexo.',
    path: '/providers/category/cleaning',
  },
  howItWorks: {
    title: 'How Nexo Works | Home Cleaning Bookings',
    description:
      'Learn how to request cleaning, review pricing, connect with a service provider and manage your Nexo booking.',
    path: '/how-it-works',
  },
  registerProvider: {
    title: 'Join Nexo as a Cleaning Service Provider',
    description:
      'Apply to join Nexo as an independent part-time cleaning service provider and connect with customers across Singapore.',
    path: '/register?role=provider',
  },
  registerCustomer: {
    title: 'Create Your Nexo Account',
    description: 'Create a Nexo customer account to request and manage home-cleaning bookings.',
    path: '/register',
  },
  login: {
    title: 'Log In to Nexo',
    description: 'Access your Nexo customer or service-provider account.',
    path: '/login',
  },
  support: {
    title: 'Nexo Customer and Provider Support',
    description:
      'Contact Nexo for help with bookings, accounts, payments or service-provider registration.',
    path: '/support',
  },
  privacy: {
    title: 'Privacy Policy | Nexo',
    description: 'How Nexo collects, uses, discloses and protects personal data.',
    path: '/privacy',
  },
  terms: {
    title: 'Terms of Service | Nexo',
    description: 'Terms governing use of the Nexo home-cleaning marketplace in Singapore.',
    path: '/terms',
  },
  cancellation: {
    title: 'Cancellation and Rescheduling Policy | Nexo',
    description: 'Nexo rules for cancelling or rescheduling home-cleaning bookings.',
    path: '/cancellation-policy',
  },
} as const
