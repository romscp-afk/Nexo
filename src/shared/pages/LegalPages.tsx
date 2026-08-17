import { Link } from 'react-router-dom'

type LegalPlaceholderPageProps = {
  title: string
}

/** Safe placeholder until business approves policy text. */
export function LegalPlaceholderPage({ title }: LegalPlaceholderPageProps) {
  return (
    <div className="mx-auto max-w-2xl py-8">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
        <p className="font-medium">Content pending business approval</p>
        <p className="mt-2">
          This page is a placeholder. The final {title.toLowerCase()} must be reviewed and approved
          before production deployment. Do not treat this text as legal advice or a binding policy.
        </p>
      </div>
      <p className="mt-6 text-sm text-slate-600">
        For urgent questions, visit{' '}
        <Link to="/support" className="font-medium text-nexo-700 hover:underline">
          Contact
        </Link>
        .
      </p>
    </div>
  )
}

export function TermsPage() {
  return <LegalPlaceholderPage title="Terms of Service" />
}

export function PrivacyPage() {
  return <LegalPlaceholderPage title="Privacy Policy" />
}

export function CancellationPolicyPage() {
  return <LegalPlaceholderPage title="Cancellation Policy" />
}
