import { Router } from 'express'
import multer from 'multer'
import { z } from 'zod'
import rateLimit from 'express-rate-limit'
import { config } from '../config.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import { AppError } from '../lib/errors.js'
import { optionalMember } from '../lib/auth.js'
import { stripService } from '../services/stripService.js'
import { stripRepo } from '../repos/strips.js'

export const stripRoutes = Router()

// One composite plus the four source photos that produced it.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxUploadBytes, files: 5 },
}).fields([
  { name: 'strip', maxCount: 1 },
  { name: 'frames', maxCount: 4 },
])

const uploadLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Slow down a moment.' } },
})

const stickerSchema = z.array(
  z.object({
    id: z.string(),
    assetId: z.string(),
    x: z.number().min(-1).max(2),
    y: z.number().min(-1).max(2),
    scale: z.number().min(0.01).max(2),
    rotation: z.number().min(-360).max(360),
    z: z.number().int().min(0),
  }),
).max(60)

// A stroke is a polyline in normalised strip coordinates. Capped so a stuck
// pointer or a hostile client cannot post a megabyte of points.
const drawingSchema = z.array(
  z.object({
    id: z.string(),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    width: z.number().min(0.001).max(0.2),
    points: z.array(z.tuple([z.number().min(-1).max(2), z.number().min(-1).max(2)])).max(600),
  }),
).max(80)

const bodySchema = z.object({
  themeId: z.string().uuid(),
  worldId: z.string().uuid().nullish(),
  memberId: z.string().uuid().nullish(),
  authorName: z.string().trim().max(24).nullish(),
  frameColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Expected a hex colour.'),
  stickerData: z.string().max(20_000),
  drawingData: z.string().max(200_000).optional(),
})

// Multipart fields arrive as strings; coerce the ones that are really optional.
const blankToNull = (v) => (v === '' || v === 'null' || v === undefined ? null : v)

/** Shared by create and update: both post a composite plus decoration JSON. */
function parseDecoration(req) {
  const body = bodySchema.parse({
    ...req.body,
    worldId: blankToNull(req.body.worldId),
    memberId: blankToNull(req.body.memberId),
    authorName: blankToNull(req.body.authorName),
  })

  let stickerData
  try {
    stickerData = stickerSchema.parse(JSON.parse(body.stickerData))
  } catch {
    throw new AppError('INVALID_STICKER_DATA', 400, 'Sticker data was malformed.')
  }

  let drawingData = []
  try {
    if (body.drawingData) drawingData = drawingSchema.parse(JSON.parse(body.drawingData))
  } catch {
    throw new AppError('INVALID_DRAWING_DATA', 400, 'Drawing data was malformed.')
  }

  return { ...body, stickerData, drawingData }
}

const compositeOf = (req) => {
  const file = req.files?.strip?.[0]
  if (!file) throw new AppError('FILE_REQUIRED', 400, 'No strip image was uploaded.')
  return file.buffer
}

const editToken = (req) => {
  const header = req.get('x-strip-token')
  return typeof header === 'string' && header ? header : null
}

stripRoutes.post(
  '/photobooth/strips',
  uploadLimiter,
  optionalMember,
  upload,
  asyncHandler(async (req, res) => {
    const buffer = compositeOf(req)
    const body = parseDecoration(req)

    // A caller may only attribute a strip to themselves.
    const memberId = req.member ? req.member.id : null
    const worldId = req.member ? req.member.worldId : null

    const strip = await stripService.create({
      buffer,
      frames: req.files?.frames ?? [],
      themeId: body.themeId,
      worldId,
      memberId,
      authorName: req.member?.displayName ?? body.authorName ?? null,
      frameColor: body.frameColor,
      stickerData: body.stickerData,
      drawingData: body.drawingData,
    })

    res.status(201).json(strip)
  }),
)

stripRoutes.patch(
  '/photobooth/strips/:id',
  uploadLimiter,
  optionalMember,
  upload,
  asyncHandler(async (req, res) => {
    const buffer = compositeOf(req)
    const body = parseDecoration(req)

    const existing = await stripRepo.findById(req.params.id)
    if (!existing) throw new AppError('NOT_FOUND', 404, 'Strip not found.')
    stripService.assertCanManage(existing, { member: req.member, editToken: editToken(req) })

    res.json(
      await stripService.update({
        id: req.params.id,
        buffer,
        themeId: body.themeId,
        frameColor: body.frameColor,
        stickerData: body.stickerData,
        drawingData: body.drawingData,
      }),
    )
  }),
)

stripRoutes.delete(
  '/photobooth/strips/:id',
  optionalMember,
  asyncHandler(async (req, res) => {
    const existing = await stripRepo.findById(req.params.id)
    if (!existing) throw new AppError('NOT_FOUND', 404, 'Strip not found.')
    stripService.assertCanManage(existing, { member: req.member, editToken: editToken(req) })

    await stripService.destroy(req.params.id)
    res.status(204).end()
  }),
)

stripRoutes.get(
  '/photobooth/strips/:slug',
  asyncHandler(async (req, res) => {
    res.json(await stripService.findBySlug(req.params.slug))
  }),
)
