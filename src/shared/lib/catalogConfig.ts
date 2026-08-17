/** Phase 1 launch — only these categories accept bookings. Others show as coming soon. */
export const LAUNCHED_CATEGORY_SLUGS = ['cleaning'] as const

export type LaunchedCategorySlug = (typeof LAUNCHED_CATEGORY_SLUGS)[number]

export const PRIMARY_CATEGORY_SLUG: LaunchedCategorySlug = 'cleaning'

export function isCategoryLaunched(slug: string): slug is LaunchedCategorySlug {
  return (LAUNCHED_CATEGORY_SLUGS as readonly string[]).includes(slug)
}

/** Launched categories first, then coming soon (preserves sort_order within each group). */
export function sortCategoriesForDisplay<T extends { slug: string; sortOrder: number }>(
  categories: T[],
): T[] {
  return [...categories].sort((a, b) => {
    const aLive = isCategoryLaunched(a.slug)
    const bLive = isCategoryLaunched(b.slug)
    if (aLive !== bLive) return aLive ? -1 : 1
    return a.sortOrder - b.sortOrder
  })
}

/** Public catalog views — cleaning only for phase 1. */
export function getLaunchedCategories<T extends { slug: string }>(categories: T[]): T[] {
  return categories.filter((category) => isCategoryLaunched(category.slug))
}

export const PHASE1_TAGLINE = 'Book trusted home cleaning in Singapore'

export const COMING_SOON_LABEL = 'Coming soon'
