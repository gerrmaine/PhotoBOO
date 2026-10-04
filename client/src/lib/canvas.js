/**
 * Canvas creation and blob export, normalised across browsers.
 *
 * OffscreenCanvas is unavailable in Safari below 16.4, so both paths are hidden
 * behind these two helpers and no call site has to care which one it got.
 */

export function createCanvas(width, height) {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(width, height)
  const canvas = document.createElement('canvas')
  // Width/height must be set as attributes. Setting them via CSS stretches the
  // existing bitmap instead of resizing the drawing surface.
  canvas.width = width
  canvas.height = height
  return canvas
}

export function toBlob(canvas, type = 'image/png', quality) {
  if (typeof canvas.convertToBlob === 'function') return canvas.convertToBlob({ type, quality })
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas export failed.'))),
      type,
      quality,
    ),
  )
}

/**
 * Object URLs are not garbage collected - without the matching revoke, a user
 * who shoots five strips in a row leaks every frame of all five.
 */
export function createObjectUrls(blobs) {
  const urls = blobs.map((b) => URL.createObjectURL(b))
  return { urls, revoke: () => urls.forEach(URL.revokeObjectURL) }
}
