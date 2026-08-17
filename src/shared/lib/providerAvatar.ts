import { supabase } from '@/shared/lib/supabase'

const MAX_BYTES = 5 * 1024 * 1024
const BUCKET = 'provider-avatars'

function extensionFor(file: File): string {
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  return 'jpg'
}

export function validateProviderAvatarFile(file: File): string | null {
  if (!file.type.startsWith('image/')) {
    return 'Please upload a JPG, PNG or WebP photo.'
  }
  if (file.size > MAX_BYTES) {
    return 'Photo must be under 5 MB.'
  }
  return null
}

export async function uploadProviderAvatarFile(file: File, userId: string): Promise<string> {
  const validationError = validateProviderAvatarFile(file)
  if (validationError) throw new Error(validationError)

  const ext = extensionFor(file)
  const path = `${userId}/profile.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
    contentType: file.type,
  })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  const publicUrl = `${data.publicUrl}?v=${Date.now()}`
  return publicUrl
}
