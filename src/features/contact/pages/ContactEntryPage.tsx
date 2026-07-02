import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { contactService } from '@/shared/services/contactService'
import { validateContactForm } from '@/shared/lib/contactValidation'
import { EVENT, GALLE_SCHOOLS } from '@/features/gathering/lib/eventConfig'
import { legacyTheme } from '@/features/gathering/lib/legacyTheme'
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

  const handleChange =
    (field: keyof typeof emptyForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const value = field === 'contactIsWhatsApp' ? (e.target as HTMLInputElement).checked : e.target.value
      setForm((prev) => ({ ...prev, [field]: value }))
    }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const validationError = validateContactForm(form)
    if (validationError) {
      setError(validationError)
      return
    }

    const { error: saveError } = contactService.submit({
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

    if (saveError) {
      setError(saveError)
      return
    }

    setForm(emptyForm)
    navigate('/contact/thank-you', { state: { fromSubmit: true } })
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <div className="px-2 py-4 text-center sm:py-6">
        <img
          src={logoUrl}
          alt={`${EVENT.title} — ${EVENT.tagline}`}
          className="mx-auto h-auto w-full max-w-lg object-contain drop-shadow-[0_4px_24px_rgba(201,169,110,0.15)]"
        />
      </div>

      <form onSubmit={handleSubmit} className={`mt-6 space-y-4 p-6 sm:p-8 ${legacyTheme.card}`}>
        <div className="border-b border-legacy-silver/15 pb-4 text-center">
          <p className={legacyTheme.subheading}>{EVENT.batch}</p>
          <p className={`mt-2 ${legacyTheme.tagline}`}>&ldquo;{EVENT.tagline}&rdquo;</p>
        </div>

        {error && (
          <p className="rounded-lg border border-legacy-red/40 bg-legacy-red/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <label className={legacyTheme.label}>
          Name <span className={legacyTheme.accentRed}>*</span>
          <input value={form.fullName} onChange={handleChange('fullName')} className={legacyTheme.input} required />
        </label>

        <label className={legacyTheme.label}>
          School <span className={legacyTheme.accentRed}>*</span>
          <select
            value={form.school}
            onChange={handleChange('school')}
            className={legacyTheme.input}
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
            <span className={legacyTheme.label}>
              Contact Number <span className={legacyTheme.accentRed}>*</span>
            </span>
            <div className="mt-1.5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <input
                type="tel"
                value={form.contactNumber}
                onChange={handleChange('contactNumber')}
                className={cn(legacyTheme.input, 'mt-0 w-full sm:min-w-[10rem] sm:flex-1')}
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
                  className="h-4 w-4 rounded border-legacy-silver/40 accent-[#c9a96e]"
                />
                <span className="text-sm text-legacy-silver-light">This is my WhatsApp number too</span>
              </label>
            </div>
          </div>

          {!form.contactIsWhatsApp && (
            <label className={legacyTheme.label}>
              WhatsApp Number <span className="text-legacy-silver/60">(optional)</span>
              <input
                type="tel"
                value={form.whatsAppNumber}
                onChange={handleChange('whatsAppNumber')}
                className={legacyTheme.input}
                placeholder="Separate WhatsApp number"
              />
            </label>
          )}
        </div>

        <label className={legacyTheme.label}>
          Email <span className={legacyTheme.accentRed}>*</span>
          <input
            type="email"
            value={form.email}
            onChange={handleChange('email')}
            className={legacyTheme.input}
            required
          />
        </label>

        <label className={legacyTheme.label}>
          Work Place <span className="text-legacy-silver/60">(optional)</span>
          <input
            value={form.workPlace}
            onChange={handleChange('workPlace')}
            className={legacyTheme.input}
            placeholder="Company or organisation"
          />
        </label>

        <label className={legacyTheme.label}>
          Designation <span className="text-legacy-silver/60">(optional)</span>
          <input
            value={form.designation}
            onChange={handleChange('designation')}
            className={legacyTheme.input}
            placeholder="Job title or role"
          />
        </label>

        <label className={legacyTheme.label}>
          Feedback or comments <span className="text-legacy-silver/60">(optional)</span>
          <textarea
            value={form.feedback}
            onChange={handleChange('feedback')}
            rows={3}
            className={cn(legacyTheme.input, 'resize-none')}
            placeholder="Share any thoughts or messages..."
          />
        </label>

        <div className="flex justify-center pt-2 sm:justify-start">
          <button type="submit" className={legacyTheme.btnPrimary}>
            Submit
          </button>
        </div>
      </form>
    </div>
  )
}
