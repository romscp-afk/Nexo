import { useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/context/AuthProvider'
import { useMyProfile, useUpdateMyProfile } from '@/features/customer/hooks/useProfile'
import { QueryState } from '@/features/catalog/components/CatalogUi'
import { SINGAPORE_AREAS } from '@/shared/lib/constants'

export function CustomerProfilePage() {
  const { user, refreshProfile } = useAuth()
  const { data: profile, isLoading, error } = useMyProfile()
  const updateProfile = useUpdateMyProfile()

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [preferredArea, setPreferredArea] = useState('')
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [success, setSuccess] = useState('')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    const source = profile ?? user
    if (!source) return
    setFullName(source.fullName ?? '')
    setPhone(source.phone ?? '')
    setPreferredArea(source.preferredArea ?? '')
    setAddressLine1(source.addressLine1 ?? '')
    setAddressLine2(source.addressLine2 ?? '')
    setPostalCode(source.postalCode ?? '')
  }, [profile, user])

  const inputClass = 'mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess('')
    setFormError('')
    try {
      await updateProfile.mutateAsync({
        fullName,
        phone: phone || undefined,
        preferredArea: preferredArea || undefined,
        addressLine1: addressLine1 || undefined,
        addressLine2: addressLine2 || undefined,
        postalCode: postalCode || undefined,
      })
      await refreshProfile()
      setSuccess('Profile updated. Future bookings will use this address by default.')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Update failed')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">My profile</h1>
      <p className="mt-1 text-slate-600">
        Manage your contact details and default service location for bookings.
      </p>

      <QueryState loading={isLoading} error={error} empty={!profile && !user}>
        <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-4">
          {formError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>
          )}
          {success && (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p>
          )}

          <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
            Account email: <span className="font-medium text-slate-900">{user?.email}</span>
          </div>

          <label className="block text-sm">
            <span className="font-medium text-slate-700">Full name</span>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputClass}
              required
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-slate-700">Phone (Singapore)</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="91234567"
              pattern="[689]\d{7}"
              className={inputClass}
              required
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-slate-700">Preferred area</span>
            <select
              value={preferredArea}
              onChange={(e) => setPreferredArea(e.target.value)}
              className={inputClass}
              required
            >
              <option value="">Select your area</option>
              {SINGAPORE_AREAS.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="font-medium text-slate-700">Block / street address</span>
            <input
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              placeholder="Blk 123 Tampines Street 11"
              className={inputClass}
              required
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-slate-700">Unit number</span>
            <input
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              placeholder="#08-456"
              className={inputClass}
              required
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-slate-700">Postal code</span>
            <input
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="521123"
              pattern="\d{6}"
              className={inputClass}
              required
            />
          </label>

          <button
            type="submit"
            disabled={updateProfile.isPending}
            className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
          >
            {updateProfile.isPending ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </QueryState>
    </div>
  )
}
