import express from 'express'
import cors from 'cors'
import { config } from './config.js'
import { errorHandler } from './lib/errors.js'
import { themeRoutes } from './routes/themes.js'
import { worldRoutes } from './routes/worlds.js'
import { stripRoutes } from './routes/strips.js'

const alwaysAllowed = new Set(['http://localhost:5173', 'http://127.0.0.1:5173'])
const allowed = new Set([...config.allowedOrigins, ...alwaysAllowed])

export const app = express()

app.use(
  cors({
    origin(origin, cb) {
      if (!origin || allowed.has(origin)) return cb(null, true)
      cb(null, false)
    },
    credentials: false,
  }),
)
app.use(express.json({ limit: '256kb' }))

app.get('/api/health', (_req, res) =>
  res.json({
    ok: true,
    storage: config.storageBucket,
    uptime: process.uptime(),
  }),
)

app.use('/api', themeRoutes)
app.use('/api', worldRoutes)
app.use('/api', stripRoutes)

app.use((_req, res) =>
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'No such endpoint.' } }),
)
app.use(errorHandler)
