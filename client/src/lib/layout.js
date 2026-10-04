/**
 * Strip geometry lives here and nowhere else. Every drawing routine reads these
 * numbers, so switching to a 3-frame or landscape layout is an edit to this file
 * rather than a hunt through the canvas code.
 *
 * Must stay in sync with STRIP in tools/art.mjs, which positions the frame art.
 */
export const STRIP_LAYOUT = {
  width: 400,
  height: 1480,
  padding: 22,
  footer: 132,
  frameCount: 4,
  slot: { width: 356, height: 318, gap: 18 },

  /** Vertical distance between the top of one slot and the next. */
  get slotPitch() {
    return this.slot.height + this.slot.gap
  },

  /** Top-left corner of photo slot `i`, in strip coordinates. */
  slotOrigin(i) {
    return { x: this.padding, y: this.padding + i * this.slotPitch }
  },

  get aspectRatio() {
    return this.width / this.height
  },
}

/** Strips export at 2x so they stay crisp on retina screens and when printed. */
export const EXPORT_SCALE = 2

/** Webcam request. 4:3 is the most widely supported capture shape. */
export const CAPTURE_CONSTRAINTS = {
  video: { width: { ideal: 1280 }, height: { ideal: 960 }, facingMode: 'user' },
  audio: false,
}

export const COUNTDOWN_SECONDS = 3

/** Pause after a shot so people can see the frame they just took. */
export const BETWEEN_SHOTS_MS = 900

/** Strip background colours. Frame art is transparent, so these are fully visible. */
export const FRAME_COLORS = [
  '#FFFFFF', '#FBF3E6', '#E6F7FB', '#EAF9FF', '#F0F7EC', '#FFF0F6',
  '#FFF6E5', '#FDE68A', '#A5F3FC', '#F9A8D4', '#C4B5FD', '#7CFC9E',
  '#D97A2B', '#0FA3BF', '#D6336C', '#7048E8', '#2F9E5B', '#120B24',
]

/** Ink colours for the drawing tool. */
export const INK_COLORS = [
  '#1C1C22', '#FFFFFF', '#E03131', '#F76707', '#FFD43B',
  '#2F9E5B', '#22D3EE', '#4C6EF5', '#7048E8', '#F72585',
]

/**
 * Perceived lightness of a hex colour, 0..1.
 * Uses the sRGB luma weights - the green channel dominates how bright a colour
 * looks, so a plain channel average picks the wrong text colour on saturated hues.
 */
export function luminance(hex) {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
}

/** Readable ink for text drawn directly on the strip background. */
export const contrastInk = (hex) => (luminance(hex) > 0.55 ? '#2B2B33' : '#FFFFFF')
