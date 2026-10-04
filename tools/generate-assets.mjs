// Writes every theme's SVG art into client/public/assets/themes/<slug>/, plus a
// shared set under _global/, and emits the manifest the database seeder reads.
//
//   npm run assets      (from the project root)

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { THEMES } from './themes.mjs'
import { GLOBAL_STICKERS } from './stickers-global.mjs'
import { FACE_ANCHOR } from './art.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'client', 'public', 'assets', 'themes')

fs.rmSync(outDir, { recursive: true, force: true })

let fileCount = 0
const write = (file, contents) => {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, contents.replace(/\s*\n\s*/g, ' ').trim())
  fileCount++
}

// --- shared stickers, available no matter which theme is active ------------

const globals = GLOBAL_STICKERS.map((s, i) => {
  write(path.join(outDir, '_global', 'stickers', `${s.slug}.svg`), s.art())
  return {
    slug: s.slug,
    name: s.name,
    mood: s.mood,
    assetUrl: `/assets/themes/_global/stickers/${s.slug}.svg`,
    sortOrder: i,
  }
})

// --- per-theme art ---------------------------------------------------------

const themes = THEMES.map((theme, i) => {
  const dir = path.join(outDir, theme.slug)
  const base = `/assets/themes/${theme.slug}`

  write(path.join(dir, 'frame.svg'), theme.frame())
  write(path.join(dir, 'thumb.svg'), theme.thumb())

  const characters = theme.characters.map((c, j) => {
    write(path.join(dir, 'characters', `${c.slug}.svg`), c.art())
    return {
      slug: c.slug,
      name: c.name,
      artUrl: `${base}/characters/${c.slug}.svg`,
      faceAnchor: FACE_ANCHOR,
      sortOrder: j,
    }
  })

  const stickers = theme.stickers.map((s, j) => {
    write(path.join(dir, 'stickers', `${s.slug}.svg`), s.art())
    return { slug: s.slug, name: s.name, assetUrl: `${base}/stickers/${s.slug}.svg`, sortOrder: j }
  })

  return {
    slug: theme.slug,
    name: theme.name,
    tagline: theme.tagline,
    frameAssetUrl: `${base}/frame.svg`,
    thumbUrl: `${base}/thumb.svg`,
    defaultFrameColor: theme.defaultFrameColor,
    accentColor: theme.accentColor,
    sortOrder: i,
    characters,
    stickers,
  }
})

const manifest = { themes, globalStickers: globals }
write(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2))

const count = (key) => themes.reduce((n, t) => n + t[key].length, 0)
console.log(
  `Generated ${fileCount} files: ${themes.length} themes, ${count('characters')} characters, ` +
    `${count('stickers')} theme stickers, ${globals.length} global stickers.`,
)
