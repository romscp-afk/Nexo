import { useEffect, useState } from 'react'
import { useMyProvider, useUpdateMyProvider } from '@/features/providers/hooks/useMyProvider'
import { QueryState } from '@/features/catalog/components/CatalogUi'

export function ProviderProfilePage() {
  const { data: provider, isLoading, error } = useMyProvider()
  const updateProvider = useUpdateMyProvider()

  const [businessName, setBusinessName] = useState('')
  const [bio, setBio] = useState('')
  const [yearsExperience, setYearsExperience] = useState('0')
  const [hourlyRate, setHourlyRate] = useState('0')
  const [serviceAreas, setServiceAreas] = useState('')
  const [success, setSuccess] = useState('')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (provider) {
      setBusinessName(provider.businessName)
      setBio(provider.bio ?? '')
      setYearsExperience(String(provider.yearsExperience))
      setHourlyRate(String(provider.hourlyRate))
      setServiceAreas(provider.serviceAreas.join(', '))
    }
  }, [provider])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess('')
    setFormError('')
    try {
      await updateProvider.mutateAsync({
        businessName,
        bio,
        yearsExperience: Number(yearsExperience) || 0,
        hourlyRate: Number(hourlyRate) || 0,
        serviceAreas: serviceAreas
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean),
      })
      setSuccess('Profile updated successfully.')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Update failed')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Business profile</h1>
      <p className="mt-1 text-slate-600">Update how customers see your listing.</p>

      <QueryState loading={isLoading} error={error} empty={!provider}>
        {provider && (
          <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-4">
            {formError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>
            )}
            {success && (
              <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p>
            )}

            <label className="block text-sm">
              <span className="font-medium text-slate-700">Business name</span>
              <input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                required
              />
            </label>

            <label className="block text-sm">
              <span className="font-medium text-slate-700">Bio</span>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="font-medium text-slate-700">Years experience</span>
                <input
                  type="number"
                  min={0}
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-slate-700">Hourly rate (SGD)</span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </label>
            </div>

            <label className="block text-sm">
              <span className="font-medium text-slate-700">Service areas</span>
              <input
                value={serviceAreas}
                onChange={(e) => setServiceAreas(e.target.value)}
                placeholder="Tampines, Bedok, CBD"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              />
              <span className="mt-1 block text-xs text-slate-500">Comma-separated</span>
            </label>

            <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
              Verified: {provider.isVerified ? 'Yes' : 'Pending admin review'} · Rating:{' '}
              {provider.ratingAvg.toFixed(1)} ({provider.ratingCount} reviews)
            </div>

            <button
              type="submit"
              disabled={updateProvider.isPending}
              className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
            >
              {updateProvider.isPending ? 'Saving…' : 'Save profile'}
            </button>
          </form>
        )}
      </QueryState>
    </div>
  )
}
