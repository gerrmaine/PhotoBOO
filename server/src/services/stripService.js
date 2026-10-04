import { config } from '../config.js'
import { AppError, notFound } from '../lib/errors.js'
import { uuid, generateShareSlug, generateToken, hashToken } from '../lib/ids.js'
import { storage, buildKey } from '../adapters/storage.js'
import { assertRealImage, optimize, pngDimensions } from '../adapters/imageOptimizer.js'
import { stripRepo } from '../repos/strips.js'
import { themeRepo } from '../repos/themes.js'
import { worldRepo, memberRepo } from '../repos/worlds.js'

const MAX_STRIPS_PER_WORLD = 200
const FRAME_COUNT = 4

export const stripService = {
  async create({ buffer, frames = [], themeId, worldId, memberId, frameColor, stickerData, drawingData, authorName }) {
    const theme = await themeRepo.findById(themeId)
    if (!theme) throw notFound('Theme')

    const contentType = assertRealImage(buffer)

    if (worldId) {
      if (!(await worldRepo.findById(worldId))) throw notFound('World')
      if ((await stripRepo.countForWorld(worldId)) >= MAX_STRIPS_PER_WORLD) {
        throw new AppError('WORLD_GALLERY_FULL', 409, 'This world has reached its strip limit.')
      }
    }
    if (memberId && !(await memberRepo.findById(memberId))) throw notFound('Member')

    const optimized = await optimize(buffer, contentType)
    const { width, height } = pngDimensions(optimized)

    const id = uuid()
    const imageUrl = await storage.put(buildKey('strips', id), optimized)
    const edit = generateToken()

    const strip = await stripRepo.insert({
      id,
      shareSlug: generateShareSlug(),
      editTokenHash: edit.hash,
      themeId,
      worldId: worldId ?? null,
      memberId: memberId ?? null,
      authorName: authorName ?? null,
      imageUrl,
      framesData: await storeFrames(id, frames),
      frameColor,
      stickerData,
      drawingData,
      width,
      height,
      byteSize: optimized.byteLength,
    })

    if (worldId) await worldRepo.bumpRevision(worldId)

    return { ...this.present(strip), editToken: edit.token }
  },

  assertCanManage(strip, { member, editToken }) {
    if (member) {
      if (strip.memberId && member.id === strip.memberId) return
      if (strip.worldId && member.isHost && member.worldId === strip.worldId) return
    }
    if (editToken && strip.editTokenHash && hashToken(editToken) === strip.editTokenHash) return
    throw new AppError('FORBIDDEN', 403, 'This strip is not yours to change.')
  },

  async update({ id, buffer, themeId, frameColor, stickerData, drawingData }) {
    const existing = await stripRepo.findById(id)
    if (!existing) throw notFound('Strip')
    if (!(await themeRepo.findById(themeId))) throw notFound('Theme')

    const contentType = assertRealImage(buffer)
    const optimized = await optimize(buffer, contentType)
    const { width, height } = pngDimensions(optimized)

    const imageUrl = await storage.put(buildKey('strips', `${id}-${Date.now()}`), optimized)
    const updated = await stripRepo.update(id, {
      themeId,
      imageUrl,
      frameColor,
      stickerData,
      drawingData,
      width,
      height,
      byteSize: optimized.byteLength,
    })
    await storage.removeByUrl(existing.imageUrl)

    if (updated.worldId) await worldRepo.bumpRevision(updated.worldId)
    return this.present(updated)
  },

  async destroy(id) {
    const strip = await stripRepo.findById(id)
    if (!strip) throw notFound('Strip')

    await storage.removeByUrl(strip.imageUrl)
    for (const url of strip.framesData) await storage.removeByUrl(url)

    await stripRepo.remove(id)
    if (strip.worldId) await worldRepo.bumpRevision(strip.worldId)
  },

  async findById(id) {
    const strip = await stripRepo.findById(id)
    if (!strip) throw notFound('Strip')
    return this.present(strip)
  },

  async findBySlug(slug) {
    const strip = await stripRepo.findBySlug(slug)
    if (!strip) throw notFound('Strip')
    return this.present(strip)
  },

  async listForWorld(worldId) {
    const strips = await stripRepo.listForWorld(worldId)
    return strips.map((s) => this.present(s))
  },

  present(strip) {
    const { editTokenHash, ...safe } = strip
    return {
      ...safe,
      shareUrl: `${config.publicUrl}/s/${strip.shareSlug}`,
      editable: strip.framesData.length === FRAME_COUNT,
    }
  },
}

async function storeFrames(stripId, frames) {
  const urls = []
  for (const [i, file] of frames.entries()) {
    const contentType = assertRealImage(file.buffer)
    const ext = contentType === 'image/png' ? 'png' : 'jpg'
    urls.push(await storage.put(buildKey('frames', `${stripId}-${i}`, ext), file.buffer))
  }
  return urls
}

export const characterService = {
  async save({ member, characterId, buffer, faceBuffer, crop }) {
    const character = await themeRepo.findCharacter(characterId)
    if (!character) throw notFound('Character')

    const optimized = await optimize(buffer, assertRealImage(buffer))
    const stamp = Date.now()
    const imageUrl = await storage.put(buildKey('characters', `${member.id}-${stamp}`), optimized)

    let face = null
    if (faceBuffer) {
      const contentType = assertRealImage(faceBuffer)
      const ext = contentType === 'image/png' ? 'png' : 'jpg'
      face = {
        imageUrl: await storage.put(buildKey('faces', `${member.id}-${stamp}`, ext), faceBuffer),
        crop: crop ?? null,
      }
    }

    const previous = member.characterImageUrl
    const previousFace = faceBuffer ? member.faceImageUrl : null

    const updated = await memberRepo.setCharacter(member.id, characterId, imageUrl, face)
    await worldRepo.bumpRevision(member.worldId)

    await storage.removeByUrl(previous)
    await storage.removeByUrl(previousFace)

    return updated
  },
}
