import { supabase } from '@/shared/lib/supabase'

export async function uploadBookingPhoto(file: File, bookingId: string): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${bookingId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage.from('booking-photos').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from('booking-photos').getPublicUrl(path)
  return data.publicUrl
}

export async function uploadBookingPhotos(files: File[], bookingId: string): Promise<string[]> {
  const urls: string[] = []
  for (const file of files) {
    urls.push(await uploadBookingPhoto(file, bookingId))
  }
  return urls
}
