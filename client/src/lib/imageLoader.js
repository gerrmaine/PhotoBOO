const cache = new Map()

/**
 * Decoded-image loader with memoisation.
 *
 * `img.src = url` followed immediately by `drawImage` silently draws nothing,
 * because the image has not decoded yet. Everything that touches the canvas goes
 * through here so that mistake cannot happen.
 */
export function loadImage(src) {
  if (cache.has(src)) return cache.get(src)

  const promise = new Promise((resolve, reject) => {
    const img = new Image()
    // Without this, a cross-origin image taints the canvas and toBlob() throws
    // a SecurityError at export time - long after the mistake was made.
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Could not load image: ${src}`))
    img.src = src
  })

  cache.set(src, promise)
  // A failed load must not be cached, or a transient network blip poisons the
  // asset for the rest of the session.
  promise.catch(() => cache.delete(src))
  return promise
}

export const loadAll = (sources) => Promise.all(sources.map(loadImage))

/**
 * Warms the cache for a whole theme so nothing pops in mid-session. Individual
 * failures are tolerated: one missing sticker should not block the shoot.
 */
export async function preloadTheme(theme) {
  if (!theme) return
  const urls = [
    theme.frameAssetUrl,
    ...(theme.stickers ?? []).map((s) => s.assetUrl),
    ...(theme.characters ?? []).map((c) => c.artUrl),
  ].filter(Boolean)

  await Promise.allSettled(urls.map(loadImage))
}

export const clearImageCache = () => cache.clear()
