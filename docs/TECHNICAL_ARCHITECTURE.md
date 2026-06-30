# Nexo — Technical Architecture v2

## Layer diagram

```
┌─────────────────────────────────────────────────────────────┐
│  UI Layer                                                   │
│  pages/ · components/ · features/*/components               │
├─────────────────────────────────────────────────────────────┤
│  Application Layer                                          │
│  features/*/hooks (TanStack Query) · Zustand stores         │
│  features/auth/context (session only)                       │
├─────────────────────────────────────────────────────────────┤
│  Service Layer  ← NEW                                       │
│  shared/services/* (auth, booking, provider, admin…)       │
│  shared/services/base.ts (executeQuery, error wrapping)     │
├─────────────────────────────────────────────────────────────┤
│  Infrastructure                                             │
│  shared/lib/supabase.ts · logger · monitor · errors        │
├─────────────────────────────────────────────────────────────┤
│  Supabase                                                   │
│  Auth · Postgres + RLS · Triggers · Edge Functions (plan)   │
└─────────────────────────────────────────────────────────────┘
```

**Rule:** UI and hooks never import `@/shared/lib/supabase` directly. All data access goes through `shared/services/`.

---

## Folder structure (feature-based)

```
src/
├── app/                          # Bootstrap
│   ├── App.tsx
│   ├── providers.tsx             # QueryClient + Auth + Toast + monitor.init()
│   └── router.tsx
│
├── features/
│   ├── auth/
│   │   └── context/AuthProvider.tsx    # Auth ONLY (no Zustand)
│   ├── catalog/
│   │   └── hooks/useCategories.ts
│   ├── providers/
│   │   └── hooks/useProviders.ts
│   └── bookings/
│       ├── hooks/useBookings.ts
│       └── hooks/useReviews.ts
│
├── shared/
│   ├── services/                 # Service layer
│   │   ├── base.ts
│   │   ├── authService.ts
│   │   ├── bookingService.ts
│   │   ├── providerService.ts
│   │   ├── categoryService.ts
│   │   ├── reviewService.ts
│   │   ├── adminService.ts
│   │   ├── edgeFunctions.ts
│   │   └── index.ts
│   ├── stores/
│   │   ├── uiStore.ts            # Sidebar, toasts
│   │   └── filterStore.ts        # Provider filters
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── logger.ts
│   │   ├── monitor.ts
│   │   ├── errors.ts
│   │   ├── constants.ts
│   │   └── utils.ts
│   ├── types/
│   └── components/ui/ToastContainer.tsx
│
├── components/                   # Legacy path (pages import from here)
├── pages/
├── hooks/                        # Re-exports → features/*
└── guards/
```

---

## State management

| Concern | Tool | Location |
|---------|------|----------|
| Auth session + profile | React Context | `features/auth/context/AuthProvider` |
| Server/cache data | TanStack Query | `features/*/hooks` |
| UI (sidebar, toasts) | Zustand | `shared/stores/uiStore` |
| Provider filters | Zustand | `shared/stores/filterStore` |
| Form state | Local `useState` | Components |

---

## Service layer

Each service wraps Supabase calls with:
- Structured logging (`logger.debug`)
- Normalized errors (`AppError` via `wrapSupabaseError`)
- Monitor capture on failure (when thrown to UI)

```typescript
// Example flow
BookingForm → useCreateBooking() → bookingService.create() → supabase / edge function
```

### Edge function fallback pattern

```typescript
if (edgeFunctions.isEnabled()) {
  try { return await edgeFunctions.createBooking(input) }
  catch { logger.warn('fallback to direct insert') }
}
return await supabase.from('bookings').insert(...)
```

---

## Logging & monitoring

| Module | Purpose |
|--------|---------|
| `shared/lib/logger.ts` | Structured console logs (debug/info/warn/error) |
| `shared/lib/monitor.ts` | Exception capture, user context, Sentry-ready |
| `shared/lib/errors.ts` | `AppError` types, `getErrorMessage()` for UI |
| `ToastContainer` | User-facing error/success feedback |

**Production:** set `VITE_SENTRY_DSN` when ready; wire in `monitor.init()`.

**Global handlers:** `unhandledrejection` → `monitor.captureException`

---

## Edge functions (planned)

See `supabase/functions/README.md`

| Function | Validates | Side effects |
|----------|-----------|--------------|
| `create-booking` | Auth, ownership | Insert booking (triggers handle payment/history) |
| `update-booking-status` | Valid state machine | Update + history trigger |
| `submit-review` | Completed booking, rating 1–5 | Insert review + rating trigger |

Enable with `VITE_EDGE_FUNCTIONS_ENABLED=true` after deploy.

---

## Data flow example

```
Customer clicks "Confirm Booking"
  → BookingForm.onSubmit
  → useCreateBooking.mutate
  → bookingService.create
      → [edge] create-booking OR [fallback] supabase.insert
  → DB triggers: booking_status_history, payments, notification
  → onSuccess: invalidateQueries + toast.success
  → onError: monitor.captureException + toast.error
```

---

## Migration notes

Legacy import paths (`@/hooks/*`, `@/lib/*`, `@/types`) re-export from new locations for backward compatibility. New code should import from:

- `@/shared/services`
- `@/features/*/hooks`
- `@/features/auth/context/AuthProvider`
- `@/shared/stores/*`
