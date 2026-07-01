# Sprint 2 — Supabase Database + Auth

Nexo marketplace MVP. This sprint connects Supabase Auth to the React app with a full database schema and RLS policies.

## Prerequisites

- [Supabase account](https://supabase.com)
- Node.js 20+

## 1. Create Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**
2. Name: `nexo` (or `homeserve-sg`)
3. Set a database password and region (Singapore recommended)
4. Wait for the project to finish provisioning

## 2. Add environment variables

Copy the example env file and fill in your project credentials from **Project Settings → API**:

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 3. Create database tables + RLS

In the Supabase **SQL Editor**, run the full schema:

```bash
# Or paste contents of supabase/schema.sql in the SQL Editor
```

File: [`supabase/schema.sql`](supabase/schema.sql)

This creates:

| Table | Purpose |
|-------|---------|
| `profiles` | User profile + role (`customer`, `provider`, `admin`) |
| `service_categories` | Service groupings |
| `services` | Catalog services |
| `providers` | Provider business profiles |
| `provider_services` | Provider ↔ service pricing |
| `bookings` | Customer bookings |
| `booking_status_history` | Status audit trail |
| `reviews` | Post-job reviews |
| `notifications` | User notifications |
| `audit_logs` | Admin audit trail |

Optional seed data:

```bash
# Run in SQL Editor after schema:
# 1. supabase/seed.sql — categories & services
# 2. supabase/add-profile-location.sql — customer address fields (existing DBs)
# 3. supabase/fix-auth-trigger.sql — signup trigger with location fields
# 4. supabase/seed-demo.sql — demo accounts (providers + customer)
```

**Demo accounts** (password `Demo1234!` for all):

| Email | Role | Category | Areas | From |
|-------|------|----------|-------|------|
| `customer.demo@nexo.sg` | Customer | — | Tampines (address saved) | — |
| `cleanpro@nexo.sg` | Provider | Cleaning | Tampines, Bedok, East | $45 |
| `swiftmove@nexo.sg` | Provider | Movers | Tampines, Bedok, East | $120 |
| `pipefix@nexo.sg` | Provider | Plumbing | Tampines, Bedok, Central | $75 |
| `handyman.sg@nexo.sg` | Provider | Handyman | Jurong, Clementi, CBD | $65 |
| `aircool@nexo.sg` | Provider | Aircon | North, Central | $50 |

**Pre-loaded for `customer.demo@nexo.sg`:** 1 completed booking + review, 1 confirmed move, 1 in-progress plumbing job, plus notifications.

**End-to-end test flow:**

1. Run SQL in order: `schema.sql` → `seed.sql` → `add-profile-location.sql` → `fix-auth-trigger.sql` → `add-booking-notifications.sql` → `seed-demo.sql`
2. Log in as **customer.demo@nexo.sg** → `/dashboard` (see bookings & notifications)
3. `/providers` → filter **Tampines** → book **CleanPro SG** (new pending booking)
4. Log out → log in as **cleanpro@nexo.sg** → confirm the new booking
5. Log in as **pipefix@nexo.sg** → mark in-progress plumbing job **completed**
6. Back as customer → leave review on completed plumbing job

**Admin setup:** Edit `nexo_admin_emails()` in `schema.sql` before running, or update the function in SQL Editor with your admin email before first admin signup.

## 4. Auth settings (Supabase Dashboard)

Under **Authentication → Providers → Email**:

- Enable email provider
- For development, disable **Confirm email** to test login immediately
- For production, keep email confirmation enabled

## 5. Run the app

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## 6. Test auth flows

1. **Register** at `/register` as customer or provider
2. **Login** at `/login`
3. Verify role-based redirect:
   - customer → `/dashboard`
   - provider → `/provider`
   - admin → `/admin` (email must be in `nexo_admin_emails()`)

Check Supabase **Table Editor → profiles** to confirm the signup trigger created a profile row.

## Architecture

```
src/shared/services/authService.ts   # signUp, signIn, signOut, getCurrentUser, getUserProfile
src/features/auth/context/AuthProvider.tsx   # Session + profile sync
src/shared/lib/supabase.ts           # Supabase client (env-driven)
supabase/schema.sql                  # Canonical DB schema + RLS
```

## CLI alternative (optional)

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

## Next sprint

- **Sprint 3:** Catalog & provider listing UI ✅
- **Sprint 4:** Booking flow ✅
- **Sprint 5:** Dashboards & admin tools ✅

### Sprint 5 — Dashboards, reviews & admin

| Path | Role | Description |
|------|------|-------------|
| `/provider/profile` | Provider | Edit business profile |
| `/dashboard/bookings/:id` | Customer | Leave review on completed booking |
| `/admin` | Admin | Platform stats + recent bookings |
| `/admin/users` | Admin | Activate / deactivate users |
| `/admin/providers` | Admin | Verify / unverify providers |
| `/admin/bookings` | Admin | All bookings table |

### Customer portal (complete)

| Path | Description |
|------|-------------|
| `/dashboard` | Overview — stats, default address, quick actions |
| `/dashboard/bookings` | All bookings with Active / Completed / Cancelled filters |
| `/dashboard/bookings/:id` | Booking detail, status timeline, cancel, review |
| `/dashboard/reviews` | Reviews you've submitted |
| `/dashboard/notifications` | Booking & review updates (mark read) |
| `/dashboard/profile` | Edit name, phone, area, address |
| `/providers/:id/book` | Book a provider (prefills from profile) |

Run `supabase/add-booking-notifications.sql` in SQL Editor for live notification triggers.

**Services:** `reviewService`, `adminService` (stats, user/provider moderation, audit logging via `log_audit_action` RPC).

### Sprint 4 — Booking routes

| Path | Role | Description |
|------|------|-------------|
| `/providers/:id/book` | Customer | Book a provider |
| `/dashboard` | Customer | Booking overview |
| `/dashboard/bookings/:id` | Customer | View / cancel booking |
| `/provider` | Provider | Job overview |
| `/provider/bookings/:id` | Provider | Confirm / complete job |

### Sprint 3 routes

| Path | Description |
|------|-------------|
| `/services` | All service categories |
| `/services/:slug` | Category detail + services |
| `/providers` | Provider listing with filters |
| `/providers/:id` | Provider profile |
