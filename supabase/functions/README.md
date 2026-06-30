# Supabase Edge Functions

Business logic that must **not** run in the browser lives here. The client calls these via `edgeFunctions` service (`src/shared/services/edgeFunctions.ts`).

## Enable in the client

```bash
# .env
VITE_EDGE_FUNCTIONS_ENABLED=true
```

When disabled (default), the service layer falls back to direct Supabase calls.

## Functions

| Function | Purpose | Replaces client logic |
|----------|---------|----------------------|
| `create-booking` | Validate + create booking, payment row, notification | `bookingService.create` fallback |
| `update-booking-status` | Validate state transitions + update + history | `bookingService.updateStatus` fallback |
| `submit-review` | Validate completed booking + insert review | `reviewService.create` fallback |

## Deploy

```bash
supabase functions deploy create-booking
supabase functions deploy update-booking-status
supabase functions deploy submit-review
```

## Migration path

1. MVP: direct Supabase + DB triggers (current fallback)
2. Enable edge functions for validation-heavy flows
3. Move payment webhooks to edge functions when Stripe/PayNow added
