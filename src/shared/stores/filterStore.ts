import { create } from 'zustand'

type ProviderFilterState = {
  categorySlug: string
  verifiedOnly: boolean
  area: string
  minRating: number
  minPrice: string
  maxPrice: string
  setCategorySlug: (slug: string) => void
  setVerifiedOnly: (value: boolean) => void
  setArea: (area: string) => void
  setMinRating: (value: number) => void
  setMinPrice: (value: string) => void
  setMaxPrice: (value: string) => void
  reset: () => void
}

const initial = {
  categorySlug: '',
  verifiedOnly: false,
  area: '',
  minRating: 0,
  minPrice: '',
  maxPrice: '',
}

export const useProviderFilterStore = create<ProviderFilterState>((set) => ({
  ...initial,
  setCategorySlug: (categorySlug) => set({ categorySlug }),
  setVerifiedOnly: (verifiedOnly) => set({ verifiedOnly }),
  setArea: (area) => set({ area }),
  setMinRating: (minRating) => set({ minRating }),
  setMinPrice: (minPrice) => set({ minPrice }),
  setMaxPrice: (maxPrice) => set({ maxPrice }),
  reset: () => set(initial),
}))
