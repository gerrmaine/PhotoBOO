import { STRIP_LAYOUT as L, EXPORT_SCALE, contrastInk } from './layout.js'
import { loadImage, loadAll } from './imageLoader.js'
import { createCanvas, toBlob, createObjectUrls } from './canvas.js'
import { coverRect, degToRad } from './geometry.js'

/**
 * Renders a complete photo strip at any scale.
 *
 * Paint order matters:
 *   1. strip colour      - the user's chosen background
 *   2. photos            - into the slots
 *   3. frame art         - DECORATIVE AND TRANSPARENT, never an opaque cover
 *   4. footer caption    - drawn here, not in the SVG, so it can contrast (3)
 *   5. drawings          - freehand ink over everything structural
 *   6. stickers          - always on top
 *
 * Step 3 is the one to be careful with. Frame SVGs used to paint an opaque
 * border and footer, which covered the strip colour completely and made the
 * colour picker do nothing at all. Frames now only draw outlines and motifs.
 */
export async function renderStrip({
  frames,
  frameAssetUrl,
  frameColor = '#FFFFFF',
  caption = '',
  stickers = [],
  stickerUrls = {},
  drawings = [],
  scale = 1,
}) {
  const canvas = createCanvas(L.width * scale, L.height * scale)
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.scale(scale, scale)

  // 1 - strip colour
  ctx.fillStyle = frameColor
  ctx.fillRect(0, 0, L.width, L.height)

  // 2 - the captured photos, all decoded before anything is drawn
  const { urls, revoke } = createObjectUrls(frames)
  try {
    const images = await loadAll(urls)
    images.forEach((img, i) => {
      const { x, y } = L.slotOrigin(i)
      drawCover(ctx, img, x, y, L.slot.width, L.slot.height)
    })
  } finally {
    revoke()
  }

  // 3 - decorative frame art
  if (frameAssetUrl) {
    const frameImg = await loadImage(frameAssetUrl)
    ctx.drawImage(frameImg, 0, 0, L.width, L.height)
  }

  // 4 - footer caption, inked to stay readable on any strip colour
  drawFooter(ctx, caption, frameColor)

  // 5 - freehand drawings
  for (const stroke of drawings) drawStroke(ctx, stroke)

  // 6 - stickers, in paint order
  for (const sticker of [...stickers].sort((a, b) => a.z - b.z)) {
    const url = stickerUrls[sticker.assetId]
    if (url) await drawSticker(ctx, sticker, url)
  }

  return toBlob(canvas)
}

export const exportStrip = (options) => renderStrip({ ...options, scale: EXPORT_SCALE })

/** Fills the slot and crops the overflow instead of squashing the subject. */
export function drawCover(ctx, img, dx, dy, dw, dh) {
  const { sx, sy, sw, sh } = coverRect(
    img.width || img.naturalWidth,
    img.height || img.naturalHeight,
    dw,
    dh,
  )
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
}

/** Theme name plus the classic "PHOTOBOOTH" line, centred in the footer band. */
function drawFooter(ctx, caption, frameColor) {
  const ink = contrastInk(frameColor)
  const top = L.height - L.footer

  ctx.save()
  ctx.textAlign = 'center'
  ctx.fillStyle = ink

  if (caption) {
    ctx.font = 'bold 26px Verdana, Geneva, sans-serif'
    ctx.fillText(caption.toUpperCase(), L.width / 2, top + 62, L.width - 56)
  }

  ctx.globalAlpha = 0.65
  ctx.font = '15px Verdana, Geneva, sans-serif'
  ctx.fillText('P H O T O B O O T H', L.width / 2, top + 96, L.width - 56)
  ctx.restore()
}

/** Stickers rotate about their own centre, which is what dragging implies. */
async function drawSticker(ctx, sticker, assetUrl) {
  const img = await loadImage(assetUrl)
  const width = sticker.scale * L.width
  const height = width * ((img.naturalHeight || img.height) / (img.naturalWidth || img.width))

  ctx.save()
  ctx.translate(sticker.x * L.width, sticker.y * L.height)
  ctx.rotate(degToRad(sticker.rotation))
  ctx.drawImage(img, -width / 2, -height / 2, width, height)
  ctx.restore()
}

/**
 * One freehand stroke. Points and width are normalised, so the same stroke data
 * renders identically in the editor and in the 2x export.
 */
export function drawStroke(ctx, stroke) {
  // Strokes can arrive from the server as well as the editor, so one malformed
  // entry must not take the whole export down with it.
  const points = stroke?.points?.filter?.(
    (p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]),
  )
  if (!points?.length) return

  ctx.save()
  ctx.strokeStyle = stroke.color
  ctx.fillStyle = stroke.color
  ctx.lineWidth = stroke.width * L.width
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // A tap produces a single point, which stroke() will not render at all.
  if (points.length === 1) {
    const [x, y] = points[0]
    ctx.beginPath()
    ctx.arc(x * L.width, y * L.height, (stroke.width * L.width) / 2, 0, Math.PI * 2)
    ctx.fill()
  } else {
    ctx.beginPath()
    points.forEach(([x, y], i) => {
      const px = x * L.width
      const py = y * L.height
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
    })
    ctx.stroke()
  }

  ctx.restore()
}

/**
 * Captures one frame from a live video element.
 *
 * Mirrored by default so the strip matches the preview people posed against -
 * un-mirroring here is technically "correct" but makes everyone feel their shot
 * came out wrong. The cost is that text in the background reads backwards, so
 * the flag is exposed rather than hard-coded.
 */
export async function captureFrame(videoEl, { mirror = true } = {}) {
  const width = videoEl.videoWidth
  const height = videoEl.videoHeight
  if (!width || !height) throw new Error('The camera is not ready yet.')

  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  if (mirror) {
    ctx.translate(width, 0)
    ctx.scale(-1, 1)
  }
  ctx.drawImage(videoEl, 0, 0, width, height)

  return toBlob(canvas, 'image/jpeg', 0.92)
}
