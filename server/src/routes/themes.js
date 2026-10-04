import { Router } from 'express'
import { themeRepo } from '../repos/themes.js'
import { notFound } from '../lib/errors.js'
import { asyncHandler } from '../lib/asyncHandler.js'

export const themeRoutes = Router()

// Returns themes with their characters and stickers embedded, so the client can
// preload an entire theme's assets from a single response.
themeRoutes.get(
  '/themes',
  asyncHandler(async (_req, res) => {
    res.json({ themes: await themeRepo.listActive() })
  }),
)

themeRoutes.get(
  '/themes/:id/stickers',
  asyncHandler(async (req, res) => {
    if (!(await themeRepo.findById(req.params.id))) throw notFound('Theme')
    res.json({ stickers: await themeRepo.stickersFor(req.params.id) })
  }),
)

themeRoutes.get(
  '/themes/:id/characters',
  asyncHandler(async (req, res) => {
    if (!(await themeRepo.findById(req.params.id))) throw notFound('Theme')
    res.json({ characters: await themeRepo.charactersFor(req.params.id) })
  }),
)
