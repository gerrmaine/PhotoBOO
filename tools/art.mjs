// ---------------------------------------------------------------------------
// SVG drawing primitives shared by every theme.
//
// All artwork in this project is generated from code: no downloads, no API, no
// licensing. Keeping the primitives here means a theme definition reads as a
// description of a picture rather than a wall of path data.
// ---------------------------------------------------------------------------

export const STRIP = {
  width: 400,
  height: 1480,
  padding: 22,
  footer: 132,
  slot: { w: 356, h: 318, gap: 18 },
}
STRIP.pitch = STRIP.slot.h + STRIP.slot.gap // 336

// Characters are drawn at 512x512 around an empty head circle. The user's
// cropped face is stamped at this anchor, so nothing detailed is drawn inside it.
export const HEAD = { cx: 256, cy: 198, r: 112 }
export const FACE_ANCHOR = { x: HEAD.cx / 512, y: HEAD.cy / 512, radius: HEAD.r / 512 }

export const svg = (w, h, body, defs = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
  (defs ? `<defs>${defs}</defs>` : '') +
  `${body}</svg>`

export const sticker = (body, defs = '') => svg(256, 256, body, defs)

// --- gradients -------------------------------------------------------------

let gradSeq = 0
const gid = () => `g${gradSeq++}`

/** Returns [defsMarkup, url] so callers can drop the fill straight into a shape. */
export function linear(from, to, { x1 = 0, y1 = 0, x2 = 0, y2 = 1 } = {}) {
  const id = gid()
  return [
    `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">` +
      `<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient>`,
    `url(#${id})`,
  ]
}

export function radial(from, to, { cx = 0.5, cy = 0.5, r = 0.5 } = {}) {
  const id = gid()
  return [
    `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">` +
      `<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></radialGradient>`,
    `url(#${id})`,
  ]
}

// --- shapes ----------------------------------------------------------------

export const polar = (cx, cy, r, angle) => [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]

export function star(cx, cy, outer, inner, points, fill, extra = '') {
  const pts = []
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 ? inner : outer
    const [x, y] = polar(cx, cy, r, (i / (points * 2)) * Math.PI * 2 - Math.PI / 2)
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`)
  }
  return `<polygon points="${pts.join(' ')}" fill="${fill}" ${extra}/>`
}

/** Four-point twinkle with concave sides - reads as "sparkle" far better than a star. */
export function sparkle(cx, cy, r, fill, opacity = 1) {
  const k = r * 0.2
  return (
    `<path fill="${fill}" opacity="${opacity}" d="M${cx} ${cy - r} Q${cx + k} ${cy - k} ${cx + r} ${cy} ` +
    `Q${cx + k} ${cy + k} ${cx} ${cy + r} Q${cx - k} ${cy + k} ${cx - r} ${cy} Q${cx - k} ${cy - k} ${cx} ${cy - r} Z"/>`
  )
}

export function heart(cx, cy, size, fill, extra = '') {
  const s = size / 100
  return (
    `<path fill="${fill}" ${extra} transform="translate(${cx} ${cy}) scale(${s})" ` +
    `d="M0 62 C-78 10 -70 -50 -30 -58 c20 -4 26 10 30 20 c4 -10 10 -24 30 -20 c40 8 48 68 -30 120z"/>`
  )
}

/** Organic lump - good for clouds, foliage, slime and bread. */
export function blob(cx, cy, r, fill, seed = 1, wobble = 0.16) {
  const n = 9
  const pts = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    const rr = r * (1 + Math.sin(seed * 3.3 + i * 2.1) * wobble)
    pts.push(polar(cx, cy, rr, a))
  }
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
  for (let i = 0; i < n; i++) {
    const cur = pts[i]
    const next = pts[(i + 1) % n]
    const mid = [(cur[0] + next[0]) / 2, (cur[1] + next[1]) / 2]
    d += ` Q${cur[0].toFixed(1)} ${cur[1].toFixed(1)} ${mid[0].toFixed(1)} ${mid[1].toFixed(1)}`
  }
  return `<path d="${d}Z" fill="${fill}"/>`
}

export const rrect = (x, y, w, h, r, fill, extra = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${extra}/>`

export const circle = (cx, cy, r, fill, extra = '') =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${extra}/>`

export const ellipse = (cx, cy, rx, ry, fill, extra = '') =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`

export const path = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`

export const stroke = (d, color, width, extra = '') =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`

/** Soft top-left highlight that makes a flat circle read as a sphere. */
export const gloss = (cx, cy, r, opacity = 0.35) =>
  ellipse(cx - r * 0.3, cy - r * 0.38, r * 0.42, r * 0.3, '#FFFFFF', `opacity="${opacity}" transform="rotate(-28 ${cx - r * 0.3} ${cy - r * 0.38})"`)

export const text = (x, y, content, { size = 28, fill = '#fff', weight = 'bold', anchor = 'middle', spacing = 0, family = 'Verdana,Geneva,sans-serif', extra = '' } = {}) =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${family}" font-size="${size}" ` +
  `font-weight="${weight}" letter-spacing="${spacing}" fill="${fill}" ${extra}>${content}</text>`

// --- character scaffolding -------------------------------------------------

/**
 * Builds a 512x512 character around the face anchor.
 *
 * `behind` draws under the body (tails, wings, limbs), `body` is the torso,
 * `front` sits above the head hole (hats, hair, ears that overlap the face).
 * The head itself is flat colour because the user's photo covers it.
 */
/**
 * Kahoot-style mascot: a saturated round body, stubby arms, and a bold ring.
 * Used to grow each theme's roster without inventing a new silhouette language.
 */
export function kahootBuddy({ body, accent, ears = '', hat = '' }) {
  return character({
    behind: ears,
    body:
      ellipse(256, 352, 124, 108, body) +
      ellipse(138, 354, 28, 17, body) +
      ellipse(374, 354, 28, 17, body),
    front: hat,
    headFill: '#FFE8D2',
    ring: accent,
    ringWidth: 10,
  })
}

export function character({ behind = '', body = '', front = '', headFill = '#F6D5BC', ring = null, ringWidth = 12, defs = '' }) {
  const ringMarkup = ring
    ? `<circle cx="${HEAD.cx}" cy="${HEAD.cy}" r="${HEAD.r + ringWidth / 2}" fill="none" stroke="${ring}" stroke-width="${ringWidth}"/>`
    : ''
  return svg(
    512,
    512,
    `${behind}${body}${circle(HEAD.cx, HEAD.cy, HEAD.r, headFill)}${ringMarkup}${front}`,
    defs,
  )
}

// --- strip frame scaffolding ----------------------------------------------

/**
 * Thin outline around each photo slot.
 *
 * Critically, frames draw NO opaque background: the strip's colour comes from
 * the canvas underneath, which is what makes the colour picker actually work.
 */
export function slotOutlines(color, width = 3, opacity = 0.5) {
  const { padding: p, slot, pitch } = STRIP
  return Array.from({ length: 4 }, (_, i) => {
    const y = p + i * pitch
    return `<rect x="${p}" y="${y}" width="${slot.w}" height="${slot.h}" fill="none" stroke="${color}" stroke-width="${width}" opacity="${opacity}"/>`
  }).join('')
}

/** Rounded corner brackets in the four corners of the strip. */
export function cornerBrackets(color, len = 42, width = 7) {
  const { width: W, height: H, padding: p } = STRIP
  const o = p / 2
  return [
    stroke(`M${o} ${o + len} V${o} H${o + len}`, color, width),
    stroke(`M${W - o - len} ${o} H${W - o} V${o + len}`, color, width),
    stroke(`M${o} ${H - o - len} V${H - o} H${o + len}`, color, width),
    stroke(`M${W - o - len} ${H - o} H${W - o} V${H - o - len}`, color, width),
  ].join('')
}

/** Decorations tucked into the gaps between photos, where there is real space. */
export function gapMotifs(render) {
  const { padding: p, slot, pitch } = STRIP
  return [0, 1, 2]
    .map((i) => render(STRIP.width / 2, p + i * pitch + slot.h + slot.gap / 2, i))
    .join('')
}

/** Narrow vertical margins either side of the photos. */
export function edgeMotifs(render, count = 8) {
  const { width: W, padding: p } = STRIP
  const top = p + 40
  const span = STRIP.height - STRIP.footer - top - 40
  return Array.from({ length: count }, (_, i) => {
    const y = top + (i / (count - 1)) * span
    return render(i % 2 ? W - p / 2 : p / 2, y, i)
  }).join('')
}
