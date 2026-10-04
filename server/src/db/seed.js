// Seeds themes, characters and stickers from the generated asset manifest.
// Idempotent: re-running updates existing rows instead of duplicating them.
//
//   npm run seed      (from server/)

import fs from 'node:fs'
import path from 'node:path'
import { supabase, unwrap } from './index.js'
import { config } from '../config.js'
import { uuid } from '../lib/ids.js'

const manifestPath = path.join(
  config.serverRoot,
  '..',
  'client',
  'public',
  'assets',
  'themes',
  'manifest.json',
)

if (!fs.existsSync(manifestPath)) {
  console.error(`\n  Asset manifest not found at:\n  ${manifestPath}\n`)
  console.error('  Run `npm run assets` from the project root first.\n')
  process.exit(1)
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))

async function existingId(table, filters) {
  let q = supabase.from(table).select('id')
  for (const [col, value] of Object.entries(filters)) {
    q = value === null ? q.is(col, null) : q.eq(col, value)
  }
  const row = unwrap(await q.maybeSingle())
  return row?.id ?? null
}

async function upsertSticker(themeId, s) {
  const id =
    (await existingId('stickers', { theme_id: themeId, slug: s.slug })) ?? uuid()
  unwrap(
    await supabase.from('stickers').upsert(
      {
        id,
        theme_id: themeId,
        slug: s.slug,
        name: s.name,
        mood: s.mood ?? '',
        asset_url: s.assetUrl,
        sort_order: s.sortOrder,
      },
      { onConflict: 'id' },
    ),
  )
}

async function prune(table, themeId, wanted) {
  const keep = new Set(wanted.map((w) => w.slug))
  const rows = unwrap(await supabase.from(table).select('id, slug').eq('theme_id', themeId)) ?? []
  const extra = rows.filter((r) => !keep.has(r.slug)).map((r) => r.id)
  if (extra.length) unwrap(await supabase.from(table).delete().in('id', extra))
}

async function pruneGlobals(wanted) {
  const keep = new Set(wanted.map((w) => w.slug))
  const rows = unwrap(await supabase.from('stickers').select('id, slug').is('theme_id', null)) ?? []
  const extra = rows.filter((r) => !keep.has(r.slug)).map((r) => r.id)
  if (extra.length) unwrap(await supabase.from('stickers').delete().in('id', extra))
}

async function count(table, apply = (q) => q) {
  const { count: n, error } = await apply(
    supabase.from(table).select('*', { count: 'exact', head: true }),
  )
  if (error) throw new Error(error.message)
  return n ?? 0
}

for (const s of manifest.globalStickers) await upsertSticker(null, s)

for (const t of manifest.themes) {
  const themeId = (await existingId('themes', { slug: t.slug })) ?? uuid()

  unwrap(
    await supabase.from('themes').upsert(
      {
        id: themeId,
        slug: t.slug,
        name: t.name,
        tagline: t.tagline,
        frame_asset_url: t.frameAssetUrl,
        thumb_url: t.thumbUrl,
        default_frame_color: t.defaultFrameColor,
        accent_color: t.accentColor,
        is_active: true,
        sort_order: t.sortOrder,
      },
      { onConflict: 'slug' },
    ),
  )

  for (const c of t.characters) {
    const characterId =
      (await existingId('characters', { theme_id: themeId, slug: c.slug })) ?? uuid()
    unwrap(
      await supabase.from('characters').upsert(
        {
          id: characterId,
          theme_id: themeId,
          slug: c.slug,
          name: c.name,
          art_url: c.artUrl,
          face_anchor: c.faceAnchor,
          sort_order: c.sortOrder,
        },
        { onConflict: 'theme_id,slug' },
      ),
    )
  }

  for (const s of t.stickers) await upsertSticker(themeId, s)

  await prune('characters', themeId, t.characters)
  await prune('stickers', themeId, t.stickers)
}

await pruneGlobals(manifest.globalStickers)

console.log(
  `Seeded ${await count('themes')} themes, ${await count('characters')} characters, ` +
    `${await count('stickers', (q) => q.not('theme_id', 'is', null))} theme stickers + ` +
    `${await count('stickers', (q) => q.is('theme_id', null))} global stickers.`,
)
