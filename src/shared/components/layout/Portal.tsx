import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'

/** Render overlays at document.body so fixed menus aren't clipped by header blur/filters. */
export function Portal({ children }: { children: ReactNode }) {
  if (typeof document === 'undefined') return null
  return createPortal(children, document.body)
}
