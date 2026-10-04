import { config } from '../config.js'
import { AppError, notFound } from '../lib/errors.js'
import { uuid, generateJoinCode, generateToken } from '../lib/ids.js'
import { isUniqueViolation } from '../db/index.js'
import { worldRepo, memberRepo } from '../repos/worlds.js'
import { stripRepo } from '../repos/strips.js'
import { themeRepo } from '../repos/themes.js'
import { storage } from '../adapters/storage.js'

export const worldService = {
  async create({ name, hostName, themeId }) {
    if (themeId && !(await themeRepo.findById(themeId))) throw notFound('Theme')

    const world = await insertWithUniqueCode({ name, themeId })
    const { token, hash } = generateToken()
    try {
      const member = await memberRepo.insert({
        id: uuid(),
        worldId: world.id,
        displayName: hostName,
        tokenHash: hash,
        isHost: true,
      })
      return { world: this.present(world), member, memberToken: token }
    } catch (err) {
      await worldRepo.remove(world.id)
      throw err
    }
  },

  async findByCode(code) {
    const world = await worldRepo.findByCode(code)
    if (!world) throw notFound('World')
    return {
      ...this.present(world),
      memberCount: await memberRepo.countForWorld(world.id),
    }
  },

  async join(code, displayName) {
    const world = await worldRepo.findByCode(code)
    if (!world) throw notFound('World')

    if ((await memberRepo.countForWorld(world.id)) >= world.memberLimit) {
      throw new AppError('WORLD_FULL', 409, `This world is full (${world.memberLimit} members).`)
    }

    const { token, hash } = generateToken()
    let member
    try {
      member = await memberRepo.insert({
        id: uuid(),
        worldId: world.id,
        displayName,
        tokenHash: hash,
        isHost: false,
      })
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new AppError('NAME_TAKEN', 409, `Someone in this world is already called "${displayName}".`)
      }
      throw err
    }

    await worldRepo.bumpRevision(world.id)
    return { world: this.present(await worldRepo.findById(world.id)), member, memberToken: token }
  },

  async state(worldId) {
    const world = await worldRepo.findById(worldId)
    if (!world) throw notFound('World')
    return {
      ...this.present(world),
      members: await memberRepo.listForWorld(worldId),
      theme: world.themeId ? await themeRepo.findById(world.themeId) : null,
    }
  },

  async setTheme(worldId, themeId) {
    const theme = await themeRepo.findById(themeId)
    if (!theme) throw notFound('Theme')
    await worldRepo.setTheme(worldId, themeId)
    return this.state(worldId)
  },

  async leave(member) {
    await memberRepo.remove(member.id)
    await worldRepo.bumpRevision(member.worldId)
  },

  async destroy(worldId) {
    const world = await worldRepo.findById(worldId)
    if (!world) throw notFound('World')

    const strips = await stripRepo.listForWorld(worldId, 1000)
    for (const strip of strips) {
      await storage.removeByUrl(strip.imageUrl)
      for (const url of strip.framesData) await storage.removeByUrl(url)
    }
    for (const member of await memberRepo.listForWorld(worldId)) {
      await storage.removeByUrl(member.characterImageUrl)
      await storage.removeByUrl(member.faceImageUrl)
    }

    for (const s of strips) await stripRepo.remove(s.id)
    await worldRepo.remove(worldId)

    return { deletedStrips: strips.length }
  },

  present(world) {
    return {
      id: world.id,
      code: world.joinCode,
      name: world.name,
      themeId: world.themeId,
      revision: world.revision,
      memberLimit: world.memberLimit,
      createdAt: world.createdAt,
    }
  },
}

async function insertWithUniqueCode({ name, themeId }, attempts = 5) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await worldRepo.insert({
        id: uuid(),
        joinCode: generateJoinCode(),
        name,
        themeId: themeId ?? null,
        memberLimit: config.memberLimit,
      })
    } catch (err) {
      if (!isUniqueViolation(err) || i === attempts - 1) throw err
    }
  }
}
