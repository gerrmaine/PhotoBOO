import { Router } from 'express'
import multer from 'multer'
import { z } from 'zod'
import rateLimit from 'express-rate-limit'
import { config } from '../config.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import { AppError } from '../lib/errors.js'
import { requireWorldMember, requireHost, requireMember } from '../lib/auth.js'
import { worldService } from '../services/worldService.js'
import { characterService, stripService } from '../services/stripService.js'
import { worldRepo, memberRepo } from '../repos/worlds.js'

export const worldRoutes = Router()

const displayName = z.string().trim().min(1, 'Pick a name.').max(24, 'Keep it under 24 characters.')
const worldName = z.string().trim().min(1, 'Give your world a name.').max(40)

// 887M possible codes, but rate-limit lookups anyway so the space can't be swept.
const lookupLimiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many attempts. Wait a minute.' } },
})

// `image` is the finished character; `face` is the raw photo behind it.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxUploadBytes, files: 2 },
}).fields([
  { name: 'image', maxCount: 1 },
  { name: 'face', maxCount: 1 },
])

// --- create / find ---------------------------------------------------------

worldRoutes.post(
  '/worlds',
  asyncHandler(async (req, res) => {
    const body = z
      .object({ name: worldName, hostName: displayName, themeId: z.string().uuid().nullish() })
      .parse(req.body)

    res.status(201).json(await worldService.create(body))
  }),
)

worldRoutes.get(
  '/worlds/code/:code',
  lookupLimiter,
  asyncHandler(async (req, res) => {
    const code = z.string().length(6).parse(req.params.code)
    res.json(await worldService.findByCode(code))
  }),
)

worldRoutes.post(
  '/worlds/code/:code/members',
  lookupLimiter,
  asyncHandler(async (req, res) => {
    const code = z.string().length(6).parse(req.params.code)
    const { displayName: name } = z.object({ displayName }).parse(req.body)
    res.status(201).json(await worldService.join(code, name))
  }),
)

// --- lobby -----------------------------------------------------------------

/**
 * Polling endpoint. `?since=<revision>` returns 304 when nothing has changed,
 * which costs a few bytes and no database join for an idle lobby.
 */
worldRoutes.get(
  '/worlds/:id/state',
  requireWorldMember,
  asyncHandler(async (req, res) => {
    const world = await worldRepo.findById(req.params.id)
    if (!world) throw new AppError('NOT_FOUND', 404, 'World not found.')

    const since = Number(req.query.since ?? -1)
    if (Number.isFinite(since) && since >= world.revision) return res.status(304).end()

    res.json(await worldService.state(req.params.id))
  }),
)

worldRoutes.patch(
  '/worlds/:id',
  requireHost,
  asyncHandler(async (req, res) => {
    const { themeId } = z.object({ themeId: z.string().uuid() }).parse(req.body)
    res.json(await worldService.setTheme(req.params.id, themeId))
  }),
)

/** Permanent, host-only, and takes the gallery with it. */
worldRoutes.delete(
  '/worlds/:id',
  requireHost,
  asyncHandler(async (req, res) => {
    res.json(await worldService.destroy(req.params.id))
  }),
)

worldRoutes.delete(
  '/worlds/:id/members/:memberId',
  requireWorldMember,
  asyncHandler(async (req, res) => {
    const target = await memberRepo.findById(req.params.memberId)
    if (!target || target.worldId !== req.params.id) throw new AppError('NOT_FOUND', 404, 'Member not found.')

    const isSelf = target.id === req.member.id
    if (!isSelf && !req.member.isHost) throw new AppError('FORBIDDEN', 403, 'Only the host can remove others.')
    if (target.isHost && !isSelf) throw new AppError('FORBIDDEN', 403, 'The host cannot be removed.')

    await worldService.leave(target)
    res.status(204).end()
  }),
)

worldRoutes.get(
  '/worlds/:id/strips',
  requireWorldMember,
  asyncHandler(async (req, res) => {
    res.json({ strips: await stripService.listForWorld(req.params.id) })
  }),
)

// --- character -------------------------------------------------------------

const cropSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  zoom: z.number().min(0.5).max(6),
})

worldRoutes.post(
  '/members/character',
  requireMember,
  upload,
  asyncHandler(async (req, res) => {
    const image = req.files?.image?.[0]
    if (!image) throw new AppError('FILE_REQUIRED', 400, 'No image was uploaded.')
    const { characterId } = z.object({ characterId: z.string().uuid() }).parse(req.body)

    let crop = null
    if (req.body.crop) {
      try {
        crop = cropSchema.parse(JSON.parse(req.body.crop))
      } catch {
        throw new AppError('INVALID_CROP', 400, 'Crop settings were malformed.')
      }
    }

    const member = await characterService.save({
      member: req.member,
      characterId,
      buffer: image.buffer,
      faceBuffer: req.files?.face?.[0]?.buffer ?? null,
      crop,
    })
    res.json({ member })
  }),
)
