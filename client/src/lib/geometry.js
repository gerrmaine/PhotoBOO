import { STRIP_LAYOUT as L } from './layout.js'

/**
 * Sticker positions are stored as fractions of the strip (0..1), never pixels.
 *
 * That single choice is what lets the same data render identically in a 300px
 * preview, an 800px editor and a 2x export - and it is why saved strips can be
 * re-opened and re-edited later without a migration.
 */

/** Pointer position within an element -> normalised strip coordinates. */
export function toNormalized(clientX, clientY, rect) {
  return {
    x: clamp((clientX - rect.left) / rect.width),
    y: clamp((clientY - rect.top) / rect.height),
  }
}

/** Normalised coordinates -> pixels at a given rendered strip width. */
export function toPixels(sticker, renderedWidth) {
  const renderedHeight = renderedWidth / L.aspectRatio
  return {
    x: sticker.x * renderedWidth,
    y: sticker.y * renderedHeight,
    width: sticker.scale * renderedWidth,
  }
}

export const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v))

/** Topmost sticker whose box contains the point, or null. */
export function hitTest(stickers, point, aspectByAssetId = {}) {
  for (const s of [...stickers].sort((a, b) => b.z - a.z)) {
    const halfW = s.scale / 2
    const halfH = (s.scale * (aspectByAssetId[s.assetId] ?? 1)) / (2 * L.aspectRatio)
    if (Math.abs(point.x - s.x) <= halfW && Math.abs(point.y - s.y) <= halfH) return s
  }
  return null
}

/**
 * Cover-fit source rectangle: fills the destination box and crops the overflow
 * rather than distorting. The webcam gives 4:3 and a strip slot is 9:8, so a
 * plain drawImage would make every face subtly wide.
 */
export function coverRect(srcW, srcH, destW, destH) {
  const scale = Math.max(destW / srcW, destH / srcH)
  const w = destW / scale
  const h = destH / scale
  return { sx: (srcW - w) / 2, sy: (srcH - h) / 2, sw: w, sh: h }
}

export const degToRad = (deg) => (deg * Math.PI) / 180
