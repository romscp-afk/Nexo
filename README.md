# Sprint 1 — Project Foundation

Nexo marketplace MVP. This sprint sets up routing, auth, layouts, and state — no database or feature UI yet.

## Run the app

```bash
npm install
cp .env.example .env   # optional for Sprint 1 browsing; required for auth
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Folder structure

```
src/
├── app/                    # Bootstrap
│   ├── App.tsx
│   ├── providers.tsx       # QueryClient + AuthProvider
│   └── router.tsx          # Route definitions
│
├── features/               # Feature modules (vertical slices)
│   ├── auth/
│   │   ├── context/        # AuthProvider (session only)
│   │   └── pages/          # Login, Register
│   ├── home/
│   │   └── pages/          # Landing /
│   ├── bookings/           # Sprint 3+ (scaffolded)
│   ├── catalog/            # Sprint 3+ (scaffolded)
│   ├── providers/          # Sprint 3+ (scaffolded)
│   └── admin/              # Sprint 3+ (scaffolded)
│
└── shared/
    ├── components/layout/  # AppLayout, AuthLayout, DashboardLayout
    ├── guards/             # ProtectedRoute, RoleRoute, GuestRoute
    ├── lib/                # env, supabase, constants, utils
    ├── pages/              # Shared placeholder pages
    ├── services/           # Service layer (Sprint 2+)
    ├── stores/             # Zustand appStore
    └── types/              # Shared TypeScript types
```

## Routes

| Path | Access | Layout |
|------|--------|--------|
| `/` | Public | AppLayout |
| `/login` | Guest | AuthLayout |
| `/register` | Guest | AuthLayout |
| `/dashboard` | Customer | DashboardLayout |
| `/provider` | Provider | DashboardLayout |
| `/admin` | Admin | DashboardLayout |

## Next sprints

- **Sprint 2:** Database schema, service layer, profile sync
- **Sprint 3:** Catalog & provider listing
- **Sprint 4:** Booking flow
- **Sprint 5:** Dashboards & admin
