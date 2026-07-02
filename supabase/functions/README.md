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
| `whatsapp-otp` | Send / verify WhatsApp OTP for registration | Required before customer/provider signup |

## WhatsApp registration OTP

1. Run `supabase/add-phone-verification.sql` in SQL Editor
2. Deploy: `supabase functions deploy whatsapp-otp`
3. Set Twilio WhatsApp secrets (or `WHATSAPP_OTP_DEV=true` for local testing)

Registration sends a 6-digit code to the user's WhatsApp number via Twilio. The DB trigger rejects signup without a verified `phone_verification_id`.

## Deploy

```bash
supabase functions deploy create-booking
supabase functions deploy update-booking-status
supabase functions deploy submit-review
supabase functions deploy whatsapp-otp
```

## Migration path

1. MVP: direct Supabase + DB triggers (current fallback)
2. Enable edge functions for validation-heavy flows
3. Move payment webhooks to edge functions when Stripe/PayNow added
