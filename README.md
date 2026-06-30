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
# Run supabase/seed.sql in SQL Editor after schema
```

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

- **Sprint 3:** Catalog & provider listing UI
- **Sprint 4:** Booking flow
- **Sprint 5:** Dashboards & admin tools
