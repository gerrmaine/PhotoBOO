import { describe, it, expect } from 'vitest'
import { toPixels, coverRect, clamp, hitTest } from './geometry.js'
import { STRIP_LAYOUT as L } from './layout.js'

// The highest-value tests in this project: a coordinate bug makes stickers drift
// between the editor and the exported PNG - obvious to the eye, miserable to
// debug through the UI, trivial to catch here.

describe('normalized coordinates', () => {
  it('render identically at 1x and 2x', () => {
    const sticker = { x: 0.5, y: 0.25, scale: 0.18 }
    const at1x = toPixels(sticker, L.width)
    const at2x = toPixels(sticker, L.width * 2)

    expect(at2x.x / 2).toBeCloseTo(at1x.x)
    expect(at2x.y / 2).toBeCloseTo(at1x.y)
    expect(at2x.width / 2).toBeCloseTo(at1x.width)
  })

  it('maps the centre of the strip to the centre in pixels', () => {
    const { x, y } = toPixels({ x: 0.5, y: 0.5, scale: 0.1 }, L.width)
    expect(x).toBeCloseTo(L.width / 2)
    expect(y).toBeCloseTo(L.height / 2)
  })

  it('clamps out-of-range values', () => {
    expect(clamp(-0.4)).toBe(0)
    expect(clamp(1.7)).toBe(1)
    expect(clamp(0.33)).toBeCloseTo(0.33)
  })
})

describe('slot geometry', () => {
  it('stacks exactly four slots without overlapping the footer', () => {
    const last = L.slotOrigin(L.frameCount - 1)
    expect(last.y + L.slot.height).toBe(L.height - L.footer)
  })

  it('spaces slots by a consistent pitch', () => {
    const pitches = [1, 2, 3].map((i) => L.slotOrigin(i).y - L.slotOrigin(i - 1).y)
    expect(new Set(pitches).size).toBe(1)
    expect(pitches[0]).toBe(L.slotPitch)
  })

  it('keeps slots inside the horizontal padding', () => {
    expect(L.padding + L.slot.width).toBe(L.width - L.padding)
  })
})

describe('coverRect', () => {
  it('crops a 4:3 webcam frame to a 9:8 slot without distorting it', () => {
    const { sw, sh } = coverRect(1280, 960, L.slot.width, L.slot.height)
    // The sampled region must match the destination's aspect ratio exactly,
    // otherwise the drawn image is stretched.
    expect(sw / sh).toBeCloseTo(L.slot.width / L.slot.height)
  })

  it('never samples outside the source image', () => {
    const { sx, sy, sw, sh } = coverRect(640, 480, 360, 320)
    expect(sx).toBeGreaterThanOrEqual(0)
    expect(sy).toBeGreaterThanOrEqual(0)
    expect(sx + sw).toBeLessThanOrEqual(640.001)
    expect(sy + sh).toBeLessThanOrEqual(480.001)
  })

  it('is a no-op when the aspect ratios already match', () => {
    const { sx, sy, sw, sh } = coverRect(800, 400, 400, 200)
    expect([sx, sy, sw, sh]).toEqual([0, 0, 800, 400])
  })
})

describe('hitTest', () => {
  const stickers = [
    { id: 'low', assetId: 'a', x: 0.5, y: 0.5, scale: 0.4, rotation: 0, z: 0 },
    { id: 'high', assetId: 'a', x: 0.5, y: 0.5, scale: 0.4, rotation: 0, z: 1 },
  ]

  it('returns the topmost sticker under the point', () => {
    expect(hitTest(stickers, { x: 0.5, y: 0.5 })?.id).toBe('high')
  })

  it('returns null outside every sticker', () => {
    expect(hitTest(stickers, { x: 0.02, y: 0.98 })).toBeNull()
  })
})
