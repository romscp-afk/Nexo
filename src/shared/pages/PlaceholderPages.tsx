export function NotFoundPage() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <p className="text-6xl font-bold text-slate-200">404</p>
      <h1 className="mt-4 text-xl font-semibold">Page not found</h1>
      <a href="/" className="mt-4 text-sm text-nexo-700 hover:underline">
        Back to home
      </a>
    </div>
  )
}
