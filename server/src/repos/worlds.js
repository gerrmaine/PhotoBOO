import { supabase, unwrap, asJson } from '../db/index.js'

const hydrate = (w) =>
  w && {
    id: w.id,
    joinCode: w.join_code,
    name: w.name,
    themeId: w.theme_id,
    revision: w.revision,
    memberLimit: w.member_limit,
    createdAt: w.created_at,
  }

const hydrateMember = (m) =>
  m && {
    id: m.id,
    worldId: m.world_id,
    displayName: m.display_name,
    isHost: !!m.is_host,
    characterId: m.character_id,
    characterImageUrl: m.character_image_url,
    faceImageUrl: m.face_image_url ?? null,
    faceCrop: asJson(m.face_crop, null),
    joinedAt: m.joined_at,
  }

export const worldRepo = {
  async insert({ id, joinCode, name, themeId, memberLimit }) {
    unwrap(
      await supabase.from('worlds').insert({
        id,
        join_code: joinCode,
        name,
        theme_id: themeId ?? null,
        member_limit: memberLimit,
      }),
    )
    return this.findById(id)
  },

  async findById(id) {
    const row = unwrap(await supabase.from('worlds').select('*').eq('id', id).maybeSingle())
    return hydrate(row)
  },

  async findByCode(code) {
    const row = unwrap(
      await supabase.from('worlds').select('*').eq('join_code', code.toUpperCase()).maybeSingle(),
    )
    return hydrate(row)
  },

  async bumpRevision(id) {
    const current = await this.findById(id)
    if (!current) return
    unwrap(await supabase.from('worlds').update({ revision: current.revision + 1 }).eq('id', id))
  },

  async setTheme(id, themeId) {
    const current = await this.findById(id)
    unwrap(
      await supabase
        .from('worlds')
        .update({ theme_id: themeId, revision: (current?.revision ?? 0) + 1 })
        .eq('id', id),
    )
    return this.findById(id)
  },

  async remove(id) {
    unwrap(await supabase.from('worlds').delete().eq('id', id))
  },
}

export const memberRepo = {
  async insert({ id, worldId, displayName, tokenHash, isHost }) {
    unwrap(
      await supabase.from('members').insert({
        id,
        world_id: worldId,
        display_name: displayName,
        member_token: tokenHash,
        is_host: Boolean(isHost),
      }),
    )
    return this.findById(id)
  },

  async findById(id) {
    const row = unwrap(await supabase.from('members').select('*').eq('id', id).maybeSingle())
    return hydrateMember(row)
  },

  async findByTokenHash(hash) {
    const row = unwrap(await supabase.from('members').select('*').eq('member_token', hash).maybeSingle())
    return hydrateMember(row)
  },

  async listForWorld(worldId) {
    const rows = unwrap(
      await supabase
        .from('members')
        .select('*')
        .eq('world_id', worldId)
        .order('is_host', { ascending: false })
        .order('joined_at'),
    )
    return (rows ?? []).map(hydrateMember)
  },

  async countForWorld(worldId) {
    const { count, error } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('world_id', worldId)
    if (error) throw new Error(error.message)
    return count ?? 0
  },

  async setCharacter(id, characterId, imageUrl, face) {
    const patch = { character_id: characterId, character_image_url: imageUrl }
    if (face) {
      patch.face_image_url = face.imageUrl
      patch.face_crop = face.crop ?? null
    }
    unwrap(await supabase.from('members').update(patch).eq('id', id))
    return this.findById(id)
  },

  async touch(id) {
    unwrap(await supabase.from('members').update({ last_seen_at: new Date().toISOString() }).eq('id', id))
  },

  async remove(id) {
    unwrap(await supabase.from('members').delete().eq('id', id))
  },
}
