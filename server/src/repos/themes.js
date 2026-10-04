import { supabase, unwrap, asJson } from '../db/index.js'

const hydrate = (t) =>
  t && {
    id: t.id,
    slug: t.slug,
    name: t.name,
    tagline: t.tagline,
    frameAssetUrl: t.frame_asset_url,
    thumbUrl: t.thumb_url,
    defaultFrameColor: t.default_frame_color,
    accentColor: t.accent_color,
  }

const hydrateCharacter = (c) =>
  c && {
    id: c.id,
    themeId: c.theme_id,
    slug: c.slug,
    name: c.name,
    artUrl: c.art_url,
    faceAnchor: asJson(c.face_anchor, { x: 0.5, y: 0.39, radius: 0.22 }),
  }

const hydrateSticker = (s) =>
  s && {
    id: s.id,
    themeId: s.theme_id,
    slug: s.slug,
    name: s.name,
    mood: s.mood,
    assetUrl: s.asset_url,
    isGlobal: s.theme_id === null,
  }

export const themeRepo = {
  async listActive() {
    const rows = unwrap(
      await supabase.from('themes').select('*').eq('is_active', true).order('sort_order').order('name'),
    )
    return Promise.all((rows ?? []).map((t) => this.withAssets(hydrate(t))))
  },

  async findById(id) {
    const row = unwrap(await supabase.from('themes').select('*').eq('id', id).maybeSingle())
    return this.withAssets(hydrate(row))
  },

  async findBySlug(slug) {
    const row = unwrap(await supabase.from('themes').select('*').eq('slug', slug).maybeSingle())
    return this.withAssets(hydrate(row))
  },

  async withAssets(theme) {
    if (!theme) return null
    const [characters, stickers] = await Promise.all([
      this.charactersFor(theme.id),
      this.stickersFor(theme.id),
    ])
    return { ...theme, characters, stickers }
  },

  async charactersFor(themeId) {
    const rows = unwrap(
      await supabase.from('characters').select('*').eq('theme_id', themeId).order('sort_order').order('name'),
    )
    return (rows ?? []).map(hydrateCharacter)
  },

  async stickersFor(themeId) {
    const rows = unwrap(
      await supabase
        .from('stickers')
        .select('*')
        .or(`theme_id.eq.${themeId},theme_id.is.null`)
        .order('sort_order')
        .order('name'),
    )
    return (rows ?? [])
      .sort((a, b) => Number(a.theme_id === null) - Number(b.theme_id === null))
      .map(hydrateSticker)
  },

  async globalStickers() {
    const rows = unwrap(
      await supabase.from('stickers').select('*').is('theme_id', null).order('sort_order').order('name'),
    )
    return (rows ?? []).map(hydrateSticker)
  },

  async findCharacter(id) {
    const row = unwrap(await supabase.from('characters').select('*').eq('id', id).maybeSingle())
    return hydrateCharacter(row)
  },
}
