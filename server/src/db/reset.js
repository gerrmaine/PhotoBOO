// Wipes all user-generated data - worlds, members and strips - and the files
// that belong to them in Supabase Storage. Themes and artwork are left alone.
//
//   npm run reset      (from server/)

import { supabase, unwrap } from './index.js'
import { config } from '../config.js'
import { storage } from '../adapters/storage.js'

async function count(table) {
  const { count: n, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
  if (error) throw new Error(error.message)
  return n ?? 0
}

const before = {
  worlds: await count('worlds'),
  strips: await count('photo_strips'),
}

const strips = unwrap(await supabase.from('photo_strips').select('image_url, frames_data')) ?? []
for (const strip of strips) {
  await storage.removeByUrl(strip.image_url)
  const frames = Array.isArray(strip.frames_data) ? strip.frames_data : []
  for (const url of frames) await storage.removeByUrl(url)
}

const members = unwrap(await supabase.from('members').select('character_image_url, face_image_url')) ?? []
for (const member of members) {
  await storage.removeByUrl(member.character_image_url)
  await storage.removeByUrl(member.face_image_url)
}

unwrap(await supabase.from('photo_strips').delete().neq('id', ''))
unwrap(await supabase.from('members').delete().neq('id', ''))
unwrap(await supabase.from('worlds').delete().neq('id', ''))

console.log(
  `Cleared ${before.worlds} world(s) and ${before.strips} strip(s) from ${config.storageBucket}. Themes kept.`,
)
