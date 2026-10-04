import { config } from '../config.js'
import { AppError } from '../lib/errors.js'

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff])

/**
 * The browser-declared MIME type is attacker-controlled, so verify the real
 * bytes before anything touches the filesystem.
 */
export function assertRealImage(buffer) {
  const isPng = buffer.subarray(0, 8).equals(PNG_MAGIC)
  const isJpeg = buffer.subarray(0, 3).equals(JPEG_MAGIC)
  if (!isPng && !isJpeg) {
    throw new AppError('UNSUPPORTED_MEDIA_TYPE', 400, 'That file is not a valid PNG or JPEG image.')
  }
  return isPng ? 'image/png' : 'image/jpeg'
}

/**
 * Best-effort pass through the optional Python sidecar, which shrinks the file
 * and strips EXIF (phone selfies carry GPS coordinates). Never blocks the user:
 * any failure or timeout falls back to the original bytes.
 */
export async function optimize(buffer, contentType = 'image/png') {
  if (!config.imageService.url) return buffer

  try {
    const form = new FormData()
    form.append('image', new Blob([buffer], { type: contentType }), 'upload')

    const res = await fetch(`${config.imageService.url}/optimize`, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(config.imageService.timeoutMs),
    })
    if (!res.ok) throw new Error(`optimizer returned ${res.status}`)

    return Buffer.from(await res.arrayBuffer())
  } catch (err) {
    console.warn('[image-optimizer] falling back to original bytes:', err.message)
    return buffer
  }
}

/** Reads width/height straight from the PNG IHDR chunk - no image library needed. */
export function pngDimensions(buffer) {
  if (!buffer.subarray(0, 8).equals(PNG_MAGIC)) return { width: 0, height: 0 }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
}
