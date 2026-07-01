import { create } from 'zustand'

type ProviderFilterState = {
  categorySlug: string
  verifiedOnly: boolean
  area: string
  setCategorySlug: (slug: string) => void
  setVerifiedOnly: (value: boolean) => void
  setArea: (area: string) => void
  reset: () => void
}

const initial = {
  categorySlug: '',
  verifiedOnly: false,
  area: '',
}

export const useProviderFilterStore = create<ProviderFilterState>((set) => ({
  ...initial,
  setCategorySlug: (categorySlug) => set({ categorySlug }),
  setVerifiedOnly: (verifiedOnly) => set({ verifiedOnly }),
  setArea: (area) => set({ area }),
  reset: () => set(initial),
}))
