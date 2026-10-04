import { supabase, unwrap, asJson } from '../db/index.js'

const hydrate = (s) =>
  s && {
    id: s.id,
    shareSlug: s.share_slug,
    themeId: s.theme_id,
    themeName: s.theme_name ?? s.themes?.name ?? null,
    worldId: s.world_id,
    memberId: s.member_id,
    authorName: s.author_name,
    imageUrl: s.image_url,
    framesData: asJson(s.frames_data, []),
    frameColor: s.frame_color,
    stickerData: asJson(s.sticker_data, []),
    drawingData: asJson(s.drawing_data, []),
    width: s.width,
    height: s.height,
    byteSize: s.byte_size,
    createdAt: s.created_at,
    updatedAt: s.updated_at ?? null,
    editTokenHash: s.edit_token ?? null,
  }

const WITH_THEME = '*, themes(name)'

const fromRow = (row) => {
  if (!row) return null
  return hydrate({ ...row, theme_name: row.themes?.name ?? row.theme_name ?? null })
}

export const stripRepo = {
  async insert(s) {
    unwrap(
      await supabase.from('photo_strips').insert({
        id: s.id,
        share_slug: s.shareSlug,
        theme_id: s.themeId,
        world_id: s.worldId ?? null,
        member_id: s.memberId ?? null,
        author_name: s.authorName ?? null,
        image_url: s.imageUrl,
        frames_data: s.framesData ?? [],
        frame_color: s.frameColor,
        sticker_data: s.stickerData ?? [],
        drawing_data: s.drawingData ?? [],
        width: s.width,
        height: s.height,
        byte_size: s.byteSize,
        edit_token: s.editTokenHash ?? null,
      }),
    )
    return this.findById(s.id)
  },

  async update(id, s) {
    unwrap(
      await supabase
        .from('photo_strips')
        .update({
          theme_id: s.themeId,
          image_url: s.imageUrl,
          frame_color: s.frameColor,
          sticker_data: s.stickerData ?? [],
          drawing_data: s.drawingData ?? [],
          width: s.width,
          height: s.height,
          byte_size: s.byteSize,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id),
    )
    return this.findById(id)
  },

  async findById(id) {
    const row = unwrap(await supabase.from('photo_strips').select(WITH_THEME).eq('id', id).maybeSingle())
    return fromRow(row)
  },

  async findBySlug(slug) {
    const row = unwrap(
      await supabase.from('photo_strips').select(WITH_THEME).eq('share_slug', slug).maybeSingle(),
    )
    return fromRow(row)
  },

  async listForWorld(worldId, limit = 50) {
    const rows = unwrap(
      await supabase
        .from('photo_strips')
        .select(WITH_THEME)
        .eq('world_id', worldId)
        .order('created_at', { ascending: false })
        .limit(limit),
    )
    return (rows ?? []).map(fromRow)
  },

  async countForWorld(worldId) {
    const { count, error } = await supabase
      .from('photo_strips')
      .select('*', { count: 'exact', head: true })
      .eq('world_id', worldId)
    if (error) throw new Error(error.message)
    return count ?? 0
  },

  async remove(id) {
    unwrap(await supabase.from('photo_strips').delete().eq('id', id))
  },
}
