function Placeholder({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <p className="mt-2 text-slate-600">{description}</p>
      <p className="mt-4 text-xs text-slate-400">Built in Sprint 1 · Feature UI coming in later sprints</p>
    </div>
  )
}

export function DashboardPage() {
  return (
    <Placeholder
      title="Customer Dashboard"
      description="Track bookings, leave reviews — placeholder route /dashboard"
    />
  )
}

export function ProviderPage() {
  return (
    <Placeholder
      title="Provider Dashboard"
      description="Manage profile and bookings — placeholder route /provider"
    />
  )
}

export function AdminPage() {
  return (
    <Placeholder
      title="Admin Dashboard"
      description="Manage users, providers, and reports — placeholder route /admin"
    />
  )
}

export function NotFoundPage() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <p className="text-6xl font-bold text-slate-200">404</p>
      <h1 className="mt-4 text-xl font-semibold">Page not found</h1>
      <a href="/" className="mt-4 text-sm text-teal-700 hover:underline">
        Back to home
      </a>
    </div>
  )
}
