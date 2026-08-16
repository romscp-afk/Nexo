type StickyFormActionProps = {
  formId: string
  label: string
  total?: string
  loading?: boolean
  disabled?: boolean
}

/** Fixed bottom bar on mobile — keeps booking submit visible while scrolling long forms. */
export function StickyFormAction({ formId, label, total, loading, disabled }: StickyFormActionProps) {
  return (
    <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {total && (
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-500">Estimated total</p>
            <p className="truncate text-lg font-semibold text-slate-900">{total}</p>
          </div>
        )}
        <button
          type="submit"
          form={formId}
          disabled={disabled || loading}
          className="shrink-0 rounded-xl bg-nexo-700 px-6 py-3 text-sm font-semibold text-white hover:bg-nexo-800 disabled:opacity-50"
        >
          {loading ? 'Please wait…' : label}
        </button>
      </div>
    </div>
  )
}
