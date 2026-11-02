import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Export client. If env vars are missing during local dev or build, this fallback
// prevents crashing while allowing safe mock/fallback handling in client.js.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)

/**
 * Uploads a File object to the Supabase Storage 'media' bucket.
 * Returns the public URL string.
 */
export async function uploadMedia(file, folder = 'general') {
  if (!file) return null
  if (!isSupabaseConfigured) {
    // Local preview placeholder if not configured
    return URL.createObjectURL(file)
  }

  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const filePath = `${folder}/${Date.now()}_${cleanName}`

  const { data, error } = await supabase.storage.from('media').upload(filePath, file, {
    cacheControl: '31536000',
    upsert: true,
  })

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`)
  }

  const { data: publicUrlData } = supabase.storage.from('media').getPublicUrl(data.path)
  return publicUrlData.publicUrl
}
