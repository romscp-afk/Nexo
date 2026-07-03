/** Shared Tailwind classes matching the Silver Legacy banner palette. */

export const legacyTheme = {
  pageBg: 'min-h-dvh bg-gradient-to-b from-legacy-950 via-legacy-900 to-legacy-800',
  pageShell: 'flex min-h-dvh flex-col',
  card: 'rounded-xl border border-legacy-silver/20 bg-legacy-900/80 shadow-xl shadow-black/40 backdrop-blur-sm',
  cardLight: 'rounded-xl border border-legacy-silver/30 bg-legacy-silver-light/95 shadow-lg',
  input:
    'mt-1.5 w-full rounded-lg border border-legacy-silver/40 bg-white px-3 py-2.5 text-sm text-legacy-900 outline-none transition placeholder:text-slate-400 focus:border-legacy-gold focus:ring-2 focus:ring-legacy-gold/30',
  label: 'block text-sm font-medium text-legacy-silver-light',
  btnPrimary:
    'rounded-lg bg-gradient-to-r from-legacy-gold to-legacy-gold-dark px-8 py-2.5 text-sm font-bold uppercase tracking-wide text-legacy-950 shadow-md shadow-legacy-gold/20 transition hover:brightness-110',
  btnSecondary:
    'rounded-lg border border-legacy-silver/40 px-4 py-2 text-sm font-medium text-legacy-silver-light transition hover:border-legacy-gold hover:text-legacy-gold',
  tagline: 'text-base italic text-legacy-gold',
  heading: 'font-bold text-legacy-silver-light',
  subheading: 'text-sm uppercase tracking-[0.2em] text-legacy-gold',
  headerBar: 'border-b border-legacy-silver/20 bg-legacy-950/95 backdrop-blur',
  tableHead: 'bg-gradient-to-r from-legacy-800 via-legacy-900 to-legacy-950 text-legacy-silver-light',
  accentRed: 'text-legacy-red',
} as const

/** White theme for public entry flow (holding + form + thank-you) */
export const entryTheme = {
  pageBg: 'min-h-dvh bg-white',
  pageShell: 'min-h-dvh bg-gradient-to-b from-white via-slate-50/80 to-white',
  card:
    'rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.06)] ring-1 ring-slate-100',
  input:
    'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#b8944f] focus:ring-2 focus:ring-[#b8944f]/20',
  label: 'block text-sm font-medium text-slate-700',
  btnPrimary:
    'rounded-xl bg-gradient-to-r from-[#c9a96e] to-[#a67c3d] px-8 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-md shadow-[#c9a96e]/25 transition hover:brightness-105',
  btnSecondary:
    'rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-[#c9a96e] hover:text-[#8b6b2e]',
  tagline: 'text-base italic text-[#8b6b2e]',
  heading: 'font-bold text-slate-900',
  subheading: 'text-sm uppercase tracking-[0.2em] text-[#a67c3d]',
  accentRed: 'text-red-600',
  muted: 'text-slate-500',
  divider: 'border-slate-200',
  errorBox: 'rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700',
} as const
