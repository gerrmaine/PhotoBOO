import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

export const config = {
  serverRoot,
  port: Number(process.env.PORT ?? 3000),
  publicUrl: process.env.PUBLIC_URL ?? 'http://localhost:5173',
  allowedOrigins: (process.env.ALLOWED_ORIGINS ?? process.env.PUBLIC_URL ?? 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  maxUploadBytes: Number(process.env.MAX_UPLOAD_BYTES ?? 8 * 1024 * 1024),
  memberLimit: Number(process.env.MEMBER_LIMIT ?? 20),
  supabaseUrl: process.env.SUPABASE_URL ?? '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  storageBucket: process.env.SUPABASE_BUCKET ?? 'photobooth',
  imageService: {
    url: process.env.IMAGE_SERVICE_URL || null,
    timeoutMs: Number(process.env.IMAGE_SERVICE_TIMEOUT_MS ?? 1500),
  },
}

export function assertSupabaseConfig() {
  if (!config.supabaseUrl || !config.supabaseServiceKey) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Copy server/.env.example to server/.env and paste the values from your Supabase project.',
    )
  }
}
