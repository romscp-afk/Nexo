# Nexo — Production Guide

**Live:** https://nexo-service-sepia.vercel.app  
**Supabase:** `zitofnocwbpoczqdrdbr`  
**GitHub:** `romscp-afk/Nexo` (`main` + `production`)

---

## Feature summary

| Area | Features |
|------|----------|
| **Customer** | Browse services/providers, book (PayNow/cash), price breakdown, PDF receipt, chat, reviews, saved providers |
| **Provider** | Accept open requests, manage jobs, earnings dashboard, schedule + working hours, time off |
| **Admin** | Users, providers, bookings, PayNow payments, analytics, activity log, chat oversight |
| **Comms** | In-app notifications, realtime chat, email alerts (Resend), WhatsApp alerts (Twilio) |

---

## Environment (`.env`)

```env
VITE_SUPABASE_URL=https://zitofnocwbpoczqdrdbr.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_SITE_URL=https://nexo-service-sepia.vercel.app
SUPABASE_ACCESS_TOKEN=sbp_...

# Email (Resend)
RESEND_API_KEY=re_...
CHAT_EMAIL_FROM=Nexo <onboarding@resend.dev>

# WhatsApp (Twilio) — optional
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

---

## Database setup (new project)

```bash
# 1. Base schema (SQL Editor or CLI)
npm run setup:db

# 2. All marketplace migrations
npm run setup:production

# 3. Edge functions
npm run deploy:chat-email
npm run deploy:booking-whatsapp
npm run deploy:whatsapp-otp
```

---

## Deploy checklist

- [ ] Push to `production` branch (Vercel auto-deploys)
- [ ] Vercel env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SITE_URL`
- [ ] Run `npm run setup:production` after schema changes
- [ ] Redeploy edge functions after secret changes
- [ ] Admin email in `nexo_admin_emails()` SQL function
- [ ] PayNow number: +6587877525 (configured in `add-payments.sql`)

---

## Key routes

| Role | Routes |
|------|--------|
| Customer | `/dashboard`, `/dashboard/bookings`, `/dashboard/messages`, `/providers/:id/book` |
| Provider | `/provider`, `/provider/bookings`, `/provider/schedule`, `/provider/earnings` |
| Admin | `/admin`, `/admin/reports`, `/admin/payments`, `/admin/chats`, `/admin/activity` |

---

## Admin access

Register with an email listed in `nexo_admin_emails()` in Supabase, or run `supabase/promote-admin.sql` / `fix-admin-login.sql`.

**Production admin:** `romscp@gmail.com`

---

## PayNow flow

1. Customer books → provider accepts
2. Customer scans QR on booking detail (ref: `NEXO-XXXXXXXX`)
3. Customer marks "I have paid"
4. Admin confirms in **PayNow payments**
5. Chat unlocks; provider can start job
