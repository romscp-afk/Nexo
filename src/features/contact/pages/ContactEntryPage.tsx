import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { contactService } from '@/shared/services/contactService'
import { validateContactForm } from '@/shared/lib/contactValidation'
import { PhoneNumberField } from '@/features/contact/components/PhoneNumberField'
import { EVENT, GALLE_SCHOOLS } from '@/features/gathering/lib/eventConfig'
import { entryFormTheme, entryTheme } from '@/features/gathering/lib/legacyTheme'
import { combinePhoneNumber, DEFAULT_PHONE_COUNTRY_CODE } from '@/features/gathering/lib/phoneCodes'
import { SCHOOL_LOGOS } from '@/features/gathering/lib/schoolLogos'
import { cn } from '@/shared/lib/utils'
import logoUrl from '@/assets/silver-legacy-logo.png'

const emptyForm = {
  fullName: '',
  school: '',
  contactCountryCode: DEFAULT_PHONE_COUNTRY_CODE,
  contactLocalNumber: '',
  contactIsWhatsApp: true,
  whatsAppCountryCode: DEFAULT_PHONE_COUNTRY_CODE,
  whatsAppLocalNumber: '',
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
    const contactNumber = combinePhoneNumber(form.contactCountryCode, form.contactLocalNumber)
    const whatsAppNumber = form.contactIsWhatsApp
      ? undefined
      : combinePhoneNumber(form.whatsAppCountryCode, form.whatsAppLocalNumber) || undefined

    const { error: saveError } = await contactService.submit({
      fullName: form.fullName,
      school: form.school,
      contactNumber,
      contactIsWhatsApp: form.contactIsWhatsApp,
      whatsAppNumber,
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

        <form onSubmit={handleSubmit} className={`space-y-4 p-6 sm:p-8 ${entryFormTheme.card}`}>
          <div className={`border-b ${entryFormTheme.divider} pb-4 text-center`}>
            <p className={entryFormTheme.subheading}>{EVENT.batch}</p>
            <p className={`mt-2 ${entryFormTheme.tagline}`}>&ldquo;{EVENT.tagline}&rdquo;</p>
          </div>

          {error && <p className={entryFormTheme.errorBox}>{error}</p>}

          <label className={entryFormTheme.label}>
            Name <span className={entryFormTheme.accentRed}>*</span>
            <input value={form.fullName} onChange={handleChange('fullName')} className={entryFormTheme.input} required />
          </label>

          <label className={entryFormTheme.label}>
            School <span className={entryFormTheme.accentRed}>*</span>
            <select
              value={form.school}
              onChange={handleChange('school')}
              className={entryFormTheme.input}
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
            <PhoneNumberField
              idPrefix="contact"
              label="Contact Number"
              required
              countryCode={form.contactCountryCode}
              localNumber={form.contactLocalNumber}
              onCountryCodeChange={(value) => setForm((prev) => ({ ...prev, contactCountryCode: value }))}
              onLocalNumberChange={(value) => setForm((prev) => ({ ...prev, contactLocalNumber: value }))}
              labelClassName={entryFormTheme.label}
              inputClassName={entryFormTheme.input}
              accentClassName={entryFormTheme.accentRed}
              mutedClassName={entryFormTheme.muted}
            />

            <label
              htmlFor="contactIsWhatsApp"
              className="flex cursor-pointer items-center gap-2"
            >
              <input
                type="checkbox"
                id="contactIsWhatsApp"
                checked={form.contactIsWhatsApp}
                onChange={handleChange('contactIsWhatsApp')}
                className="h-4 w-4 rounded border-legacy-silver/40 accent-[#c9a96e]"
              />
              <span className={`text-sm ${entryFormTheme.muted}`}>This is my WhatsApp number too</span>
            </label>

            {!form.contactIsWhatsApp && (
              <PhoneNumberField
                idPrefix="whatsapp"
                label="WhatsApp Number"
                optional
                countryCode={form.whatsAppCountryCode}
                localNumber={form.whatsAppLocalNumber}
                onCountryCodeChange={(value) => setForm((prev) => ({ ...prev, whatsAppCountryCode: value }))}
                onLocalNumberChange={(value) => setForm((prev) => ({ ...prev, whatsAppLocalNumber: value }))}
                labelClassName={entryFormTheme.label}
                inputClassName={entryFormTheme.input}
                accentClassName={entryFormTheme.accentRed}
                mutedClassName={entryFormTheme.muted}
              />
            )}
          </div>

          <label className={entryFormTheme.label}>
            Email <span className={entryFormTheme.accentRed}>*</span>
            <input
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              className={entryFormTheme.input}
              required
            />
          </label>

          <label className={entryFormTheme.label}>
            Work Place <span className={entryFormTheme.muted}>(optional)</span>
            <input
              value={form.workPlace}
              onChange={handleChange('workPlace')}
              className={entryFormTheme.input}
              placeholder="Company or organisation"
            />
          </label>

          <label className={entryFormTheme.label}>
            Designation <span className={entryFormTheme.muted}>(optional)</span>
            <input
              value={form.designation}
              onChange={handleChange('designation')}
              className={entryFormTheme.input}
              placeholder="Job title or role"
            />
          </label>

          <label className={entryFormTheme.label}>
            Feedback or comments <span className={entryFormTheme.muted}>(optional)</span>
            <textarea
              value={form.feedback}
              onChange={handleChange('feedback')}
              rows={3}
              className={cn(entryFormTheme.input, 'resize-none')}
              placeholder="Share any thoughts or messages..."
            />
          </label>

          <div className="flex justify-center pt-2 sm:justify-start">
            <button type="submit" disabled={submitting} className={entryFormTheme.btnPrimary}>
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
