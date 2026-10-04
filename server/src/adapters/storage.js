import { supabase } from '../db/index.js'
import { config } from '../config.js'

const bucket = () => config.storageBucket

/**
 * Uploads land in a public Supabase Storage bucket. Rows store the public URL,
 * so the rest of the app never cares whether the bytes live here or on disk.
 */
export const storage = {
  async put(key, buffer, contentType) {
    const path = key.split('\\').join('/')
    const { error } = await supabase.storage.from(bucket()).upload(path, buffer, {
      contentType: contentType ?? guessType(path),
      upsert: true,
      cacheControl: '31536000',
    })
    if (error) throw new Error(error.message)
    return this.url(path)
  },

  async remove(key) {
    const path = key.split('\\').join('/')
    const { error } = await supabase.storage.from(bucket()).remove([path])
    if (error) console.warn('[storage] remove failed:', error.message)
  },

  async removeByUrl(url) {
    const key = keyFromPublicUrl(url)
    if (key) await this.remove(key)
  },

  url(key) {
    const { data } = supabase.storage.from(bucket()).getPublicUrl(key.split('\\').join('/'))
    return data.publicUrl
  },
}

export function buildKey(prefix, id, ext = 'png') {
  const day = new Date().toISOString().slice(0, 10)
  return `${prefix}/${day}/${id}.${ext}`
}

function guessType(key) {
  if (/\.png$/i.test(key)) return 'image/png'
  if (/\.jpe?g$/i.test(key)) return 'image/jpeg'
  if (/\.webp$/i.test(key)) return 'image/webp'
  return 'application/octet-stream'
}

function keyFromPublicUrl(url) {
  if (typeof url !== 'string') return null
  const marker = `/object/public/${bucket()}/`
  const i = url.indexOf(marker)
  if (i === -1) return null
  return decodeURIComponent(url.slice(i + marker.length))
}
