import { supabase } from './supabase'

export async function uploadImage(file: File): Promise<string | null> {
  try {
    const timestamp = Date.now()
    const filename = `${timestamp}_${file.name}`
    
    const { data, error } = await supabase.storage
      .from('pickly-images')
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('pickly-images')
      .getPublicUrl(filename)

    return publicUrl
  } catch (error) {
    console.error('Error uploading image:', error)
    return null
  }
}
