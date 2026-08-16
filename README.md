# Nexo — Singapore Home Services Marketplace

Production-ready MVP for booking cleaning, handyman, movers, aircon, and plumbing services in Singapore.

**Live:** https://nexo-service-sepia.vercel.app

See **[docs/PRODUCTION.md](docs/PRODUCTION.md)** for deploy checklist, env vars, and admin setup.

## Quick start

```bash
cp .env.example .env   # add Supabase keys
npm install
npm run dev
```

## Production setup

```bash
npm run setup:db          # base schema (once)
npm run setup:production  # all marketplace migrations
npm run deploy:chat-email
npm run deploy:booking-whatsapp
```

## Roles & routes

| Role | Dashboard | Key features |
|------|-----------|--------------|
| **Customer** | `/dashboard` | Book, PayNow/cash, chat, reviews, receipts |
| **Provider** | `/provider` | Jobs, earnings, schedule, time off |
| **Admin** | `/admin` | Payments, analytics, users, chat oversight |

## Demo accounts

Password `Demo1234!` for all (after running `supabase/seed-demo.sql`):

| Email | Role |
|-------|------|
| `customer.demo@nexo.sg` | Customer |
| `cleanpro@nexo.sg` | Provider (cleaning) |
| `aircool@nexo.sg` | Provider (aircon) |

## Tech stack

React 19 · TypeScript · Vite · Tailwind v4 · Supabase (Auth + Postgres + RLS + Realtime + Edge Functions)

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run setup:production` | Apply all SQL migrations |
| `npm run setup:chat-email-resend` | Configure Resend for chat emails |
| `npm run deploy:chat-email` | Deploy chat email edge function |
| `npm run deploy:booking-whatsapp` | Deploy WhatsApp alerts |
