import { Link } from 'react-router-dom'
import { CalendarCheck, MessageCircle, Repeat } from 'lucide-react'
import { CLEANING_RECURRING_PLANS_NOTE, CLEANING_SERVICE_PLANS } from '@/shared/lib/cleaningContent'

const PLAN_ICONS = {
  'one-time': CalendarCheck,
  weekly: Repeat,
  monthly: Repeat,
} as const

function contactHref(subject: string) {
  return `/support?subject=${encodeURIComponent(subject)}`
}

export function CleaningServicePlansSection({
  compact = false,
  className = '',
}: {
  compact?: boolean
  className?: string
}) {
  return (
    <section
      className={`rounded-xl border border-nexo-200 bg-nexo-50/60 p-5 ${className}`.trim()}
    >
      <h2 className={compact ? 'text-sm font-semibold text-slate-900' : 'text-lg font-semibold text-slate-900'}>
        Service plans
      </h2>
      <p className={`mt-2 text-slate-600 ${compact ? 'text-xs' : 'text-sm'}`}>
        {CLEANING_RECURRING_PLANS_NOTE}
      </p>

      <ul className={`mt-4 space-y-3 ${compact ? 'text-xs' : 'text-sm'}`}>
        {CLEANING_SERVICE_PLANS.map((plan) => {
          const Icon = PLAN_ICONS[plan.id]
          return (
            <li
              key={plan.id}
              className="flex gap-3 rounded-lg border border-white/80 bg-white px-3 py-3 shadow-sm"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-nexo-100 text-nexo-700">
                <Icon className="h-4 w-4" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-slate-900">{plan.label}</p>
                  {plan.bookOnline ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
                      Book online
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                      Contact us
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-slate-600">{plan.description}</p>
                {!plan.bookOnline && 'contactSubject' in plan && (
                  <Link
                    to={contactHref(plan.contactSubject)}
                    className="mt-2 inline-flex items-center gap-1 font-medium text-nexo-700 hover:underline"
                  >
                    <MessageCircle className="h-3.5 w-3.5" aria-hidden />
                    Contact us for {plan.label.toLowerCase()} plans
                  </Link>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
