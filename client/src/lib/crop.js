import { loadImage } from './imageLoader.js'
import { createCanvas, toBlob } from './canvas.js'
import { coverRect } from './geometry.js'

const SIZE = 512

/**
 * Stamps a circular crop of the user's photo onto a character's face anchor.
 *
 * Deliberately no face detection: the user frames themselves with pan and zoom,
 * which is predictable, works offline, costs nothing, and never embarrasses
 * anyone by mis-detecting.
 *
 * `crop` is { x, y, zoom } where x/y are the normalised centre of the chosen
 * region in the source photo and zoom >= 1 magnifies it.
 */
export async function compositeCharacter({ characterUrl, faceBlob, faceAnchor, crop }) {
  const faceUrl = URL.createObjectURL(faceBlob)

  try {
    const [charImg, faceImg] = await Promise.all([loadImage(characterUrl), loadImage(faceUrl)])

    const canvas = createCanvas(SIZE, SIZE)
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingQuality = 'high'

    const r = faceAnchor.radius * SIZE
    const cx = faceAnchor.x * SIZE
    const cy = faceAnchor.y * SIZE

    // Face first, clipped to the circle; character art is drawn after so any
    // outline or hair in the art overlaps the photo naturally.
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.clip()
    drawFace(ctx, faceImg, cx, cy, r, crop)
    ctx.restore()

    ctx.drawImage(charImg, 0, 0, SIZE, SIZE)

    // Redraw the face above the art, masked, so the art's own head colour does
    // not cover it - the anchor region is meant to be the user's photo.
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.clip()
    drawFace(ctx, faceImg, cx, cy, r, crop)
    ctx.restore()

    return toBlob(canvas)
  } finally {
    URL.revokeObjectURL(faceUrl)
  }
}

function drawFace(ctx, img, cx, cy, r, crop = { x: 0.5, y: 0.5, zoom: 1 }) {
  const srcW = img.naturalWidth || img.width
  const srcH = img.naturalHeight || img.height
  const box = r * 2

  const base = coverRect(srcW, srcH, box, box)
  const sw = base.sw / crop.zoom
  const sh = base.sh / crop.zoom

  // Keep the sampled window inside the source image however far the user pans.
  const sx = Math.min(Math.max(crop.x * srcW - sw / 2, 0), srcW - sw)
  const sy = Math.min(Math.max(crop.y * srcH - sh / 2, 0), srcH - sh)

  ctx.drawImage(img, sx, sy, sw, sh, cx - r, cy - r, box, box)
}

/** Preview used by the crop UI - same maths, drawn straight to a visible canvas. */
export async function drawCropPreview(canvasEl, faceUrl, crop, diameter) {
  const img = await loadImage(faceUrl)
  const ctx = canvasEl.getContext('2d')
  const r = diameter / 2

  ctx.clearRect(0, 0, diameter, diameter)
  ctx.save()
  ctx.beginPath()
  ctx.arc(r, r, r, 0, Math.PI * 2)
  ctx.clip()
  drawFace(ctx, img, r, r, r, crop)
  ctx.restore()
}
