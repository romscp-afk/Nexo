import { useRef, useState } from 'react'
import { Camera, Upload } from 'lucide-react'
import { ProviderAvatar } from '@/features/providers/components/ProviderAvatar'
import { useUploadProviderAvatar } from '@/features/providers/hooks/useProviderAvatar'
import { validateProviderAvatarFile } from '@/shared/lib/providerAvatar'

type ProviderVerificationPhotoProps = {
  businessName: string
  avatarUrl?: string | null
  isVerified: boolean
}

export function ProviderVerificationPhoto({
  businessName,
  avatarUrl,
  isVerified,
}: ProviderVerificationPhotoProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const uploadAvatar = useUploadProviderAvatar()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState('')

  const displayUrl = previewUrl ?? avatarUrl

  const handleFile = async (file: File | null) => {
    if (!file) return
    setError('')
    const validationError = validateProviderAvatarFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    try {
      await uploadAvatar.mutateAsync(file)
      setPreviewUrl(null)
    } catch (err) {
      setPreviewUrl(null)
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      URL.revokeObjectURL(objectUrl)
    }
  }

  return (
    <section className="rounded-xl border border-nexo-200 bg-nexo-50/60 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <ProviderAvatar name={businessName} avatarUrl={displayUrl} size="lg" />

        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-slate-900">Profile photo for verification</h2>
          <p className="mt-1 text-sm text-slate-600">
            Upload a clear photo of your face. Nexo admins review this before marking your listing
            as verified. Customers will see this photo on your cleaner profile.
          </p>

          {!avatarUrl && (
            <p className="mt-2 text-sm text-amber-800" role="status">
              Recommended before admin verification
            </p>
          )}

          {isVerified && avatarUrl && (
            <p className="mt-2 text-sm text-green-800" role="status">
              Your listing is verified. Uploading a new photo will require admin review again.
            </p>
          )}

          {error && (
            <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploadAvatar.isPending}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-nexo-700 px-4 py-2 text-sm font-medium text-white hover:bg-nexo-800 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nexo-600"
            >
              {uploadAvatar.isPending ? (
                'Uploading…'
              ) : avatarUrl ? (
                <>
                  <Camera className="h-4 w-4" aria-hidden />
                  Replace photo
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" aria-hidden />
                  Upload profile photo
                </>
              )}
            </button>
          </div>

          <p className="mt-2 text-xs text-slate-500">JPG, PNG or WebP · max 5 MB · face clearly visible</p>
        </div>
      </div>
    </section>
  )
}
