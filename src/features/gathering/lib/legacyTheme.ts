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
