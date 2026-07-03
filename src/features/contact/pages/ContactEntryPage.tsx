import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { contactService } from '@/shared/services/contactService'
import { validateContactForm } from '@/shared/lib/contactValidation'
import { EVENT, GALLE_SCHOOLS } from '@/features/gathering/lib/eventConfig'
import { entryTheme } from '@/features/gathering/lib/legacyTheme'
import { SCHOOL_LOGOS } from '@/features/gathering/lib/schoolLogos'
import { cn } from '@/shared/lib/utils'
import logoUrl from '@/assets/silver-legacy-logo.png'

const emptyForm = {
  fullName: '',
  school: '',
  contactNumber: '',
  contactIsWhatsApp: true,
  whatsAppNumber: '',
  email: '',
  workPlace: '',
  designation: '',
  feedback: '',
}

export function ContactEntryPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleChange =
    (field: keyof typeof emptyForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const value = field === 'contactIsWhatsApp' ? (e.target as HTMLInputElement).checked : e.target.value
      setForm((prev) => ({ ...prev, [field]: value }))
    }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const validationError = validateContactForm(form)
    if (validationError) {
      setError(validationError)
      return
    }

    setSubmitting(true)
    const { error: saveError } = await contactService.submit({
      fullName: form.fullName,
      school: form.school,
      contactNumber: form.contactNumber,
      contactIsWhatsApp: form.contactIsWhatsApp,
      whatsAppNumber: form.contactIsWhatsApp ? undefined : form.whatsAppNumber,
      email: form.email,
      workPlace: form.workPlace,
      designation: form.designation,
      feedback: form.feedback,
    })
    setSubmitting(false)

    if (saveError) {
      setError(saveError)
      return
    }

    setForm(emptyForm)
    navigate('/contact/thank-you', { state: { fromSubmit: true } })
  }

  return (
    <div className={`${entryTheme.pageShell} pb-10`}>
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <div className="mb-2 flex items-center justify-between">
          <Link
            to="/contact"
            className="font-[DM_Mono,monospace] text-[10px] uppercase tracking-[0.3em] text-slate-400 transition hover:text-[#a67c3d]"
          >
            ← Back
          </Link>
          <span className="font-[DM_Mono,monospace] text-[10px] uppercase tracking-[0.3em] text-slate-400">
            Contact form
          </span>
        </div>

        <div className="px-2 py-4 text-center sm:py-6">
          <img
            src={logoUrl}
            alt={`${EVENT.title} — ${EVENT.tagline}`}
            className="mx-auto h-auto w-full max-w-md object-contain drop-shadow-[0_6px_20px_rgba(15,23,42,0.08)]"
          />
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {SCHOOL_LOGOS.map((school) => (
            <div
              key={school.name}
              title={school.name}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white p-1 shadow-sm sm:h-10 sm:w-10"
            >
              <img src={school.src} alt={school.shortName} className="h-full w-full object-contain" />
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className={`space-y-4 p-6 sm:p-8 ${entryTheme.card}`}>
          <div className={`border-b ${entryTheme.divider} pb-4 text-center`}>
            <p className={entryTheme.subheading}>{EVENT.batch}</p>
            <p className={`mt-2 ${entryTheme.tagline}`}>&ldquo;{EVENT.tagline}&rdquo;</p>
          </div>

          {error && <p className={entryTheme.errorBox}>{error}</p>}

          <label className={entryTheme.label}>
            Name <span className={entryTheme.accentRed}>*</span>
            <input value={form.fullName} onChange={handleChange('fullName')} className={entryTheme.input} required />
          </label>

          <label className={entryTheme.label}>
            School <span className={entryTheme.accentRed}>*</span>
            <select
              value={form.school}
              onChange={handleChange('school')}
              className={entryTheme.input}
              required
            >
              <option value="">Select your school</option>
              {GALLE_SCHOOLS.map((school) => (
                <option key={school} value={school}>
                  {school}
                </option>
              ))}
            </select>
          </label>

          <div className="space-y-3">
            <div>
              <span className={entryTheme.label}>
                Contact Number <span className={entryTheme.accentRed}>*</span>
              </span>
              <div className="mt-1.5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <input
                  type="tel"
                  value={form.contactNumber}
                  onChange={handleChange('contactNumber')}
                  className={cn(entryTheme.input, 'mt-0 w-full sm:min-w-[10rem] sm:flex-1')}
                  placeholder="077 123 4567"
                  required
                />
                <label
                  htmlFor="contactIsWhatsApp"
                  className="flex shrink-0 cursor-pointer items-center gap-2"
                >
                  <input
                    type="checkbox"
                    id="contactIsWhatsApp"
                    checked={form.contactIsWhatsApp}
                    onChange={handleChange('contactIsWhatsApp')}
                    className="h-4 w-4 rounded border-slate-300 accent-[#c9a96e]"
                  />
                  <span className={`text-sm ${entryTheme.muted}`}>This is my WhatsApp number too</span>
                </label>
              </div>
            </div>

            {!form.contactIsWhatsApp && (
              <label className={entryTheme.label}>
                WhatsApp Number <span className={entryTheme.muted}>(optional)</span>
                <input
                  type="tel"
                  value={form.whatsAppNumber}
                  onChange={handleChange('whatsAppNumber')}
                  className={entryTheme.input}
                  placeholder="Separate WhatsApp number"
                />
              </label>
            )}
          </div>

          <label className={entryTheme.label}>
            Email <span className={entryTheme.accentRed}>*</span>
            <input
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              className={entryTheme.input}
              required
            />
          </label>

          <label className={entryTheme.label}>
            Work Place <span className={entryTheme.muted}>(optional)</span>
            <input
              value={form.workPlace}
              onChange={handleChange('workPlace')}
              className={entryTheme.input}
              placeholder="Company or organisation"
            />
          </label>

          <label className={entryTheme.label}>
            Designation <span className={entryTheme.muted}>(optional)</span>
            <input
              value={form.designation}
              onChange={handleChange('designation')}
              className={entryTheme.input}
              placeholder="Job title or role"
            />
          </label>

          <label className={entryTheme.label}>
            Feedback or comments <span className={entryTheme.muted}>(optional)</span>
            <textarea
              value={form.feedback}
              onChange={handleChange('feedback')}
              rows={3}
              className={cn(entryTheme.input, 'resize-none')}
              placeholder="Share any thoughts or messages..."
            />
          </label>

          <div className="flex justify-center pt-2 sm:justify-start">
            <button type="submit" disabled={submitting} className={entryTheme.btnPrimary}>
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
