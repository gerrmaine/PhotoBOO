import { defineStore } from 'pinia'
import { STRIP_LAYOUT as L } from '@/lib/layout.js'
import { preloadTheme } from '@/lib/imageLoader.js'
import { themesApi, stripsApi, session, stripTokens } from '@/api/client.js'

let seq = 0
const nextId = (p) => `${p}${Date.now().toString(36)}${seq++}`

export const usePhotoboothStore = defineStore('photobooth', {
  state: () => ({
    // Mirrors the flow state machine: every component renders off this single
    // value rather than a scatter of independent booleans.
    step: 'theme',          // theme | camera | review | decorate | done
    themes: [],
    theme: null,
    frames: [],             // Blob[] - blobs, not data URLs: a third the memory
    frameUrls: [],          // object URLs for display, revoked on reset
    stickers: [],
    drawings: [],           // [{ id, color, width, points: [[x,y], ...] }]
    frameColor: '#FFFFFF',
    selectedStickerId: null,
    tool: 'select',         // select | draw | erase
    ink: '#1C1C22',
    brush: 0.012,           // stroke width as a fraction of strip width
    result: null,
    saving: false,
    error: null,
    editingId: null,
    editToken: null,
  }),

  getters: {
    isComplete: (s) => s.frames.length === L.frameCount,
    remaining: (s) => L.frameCount - s.frames.length,
    selectedSticker: (s) => s.stickers.find((x) => x.id === s.selectedStickerId) ?? null,
    stickerUrls: (s) => Object.fromEntries((s.theme?.stickers ?? []).map((x) => [x.id, x.assetUrl])),
    topZ: (s) => s.stickers.reduce((m, x) => Math.max(m, x.z), -1),
    isInWorld: () => Boolean(session.token),
    hasEdits: (s) => s.stickers.length > 0 || s.drawings.length > 0,

    /** Theme stickers and the shared global set, split for the palette tabs. */
    themeStickers: (s) => (s.theme?.stickers ?? []).filter((x) => !x.isGlobal),
    globalStickers: (s) => (s.theme?.stickers ?? []).filter((x) => x.isGlobal),
  },

  actions: {
    async loadThemes() {
      if (this.themes.length) return this.themes
      this.themes = await themesApi.list()
      return this.themes
    },

    async selectTheme(theme) {
      this.theme = theme
      this.frameColor = theme.defaultFrameColor
      this.step = 'camera'
      // Warm the cache now rather than at capture time - a sticker that pops in
      // halfway through a drag feels broken.
      await preloadTheme(theme)
    },

    /**
     * Switches theme mid-session without losing the photos.
     *
     * Stickers belong to the old theme's asset set, so they are dropped; the
     * alternative is dangling references that render as blank gaps. Drawings
     * are theme-independent and survive.
     */
    async changeTheme(theme, { keepColor = false } = {}) {
      const hadStickers = this.stickers.length
      this.theme = theme
      this.stickers = []
      this.selectedStickerId = null
      if (!keepColor) this.frameColor = theme.defaultFrameColor
      await preloadTheme(theme)
      return { droppedStickers: hadStickers }
    },

    addFrame(blob) {
      if (this.frames.length >= L.frameCount) return
      this.frames.push(blob)
      this.frameUrls.push(URL.createObjectURL(blob))
      if (this.frames.length === L.frameCount) this.step = 'review'
    },

    retake() {
      this.frameUrls.forEach(URL.revokeObjectURL)
      this.frames = []
      this.frameUrls = []
      this.step = 'camera'
    },

    // --- stickers ---------------------------------------------------------

    addSticker(stickerAsset, at = { x: 0.5, y: 0.45 }) {
      const sticker = {
        id: nextId('s'),
        assetId: stickerAsset.id,
        x: at.x,
        y: at.y,
        scale: 0.22,
        rotation: 0,
        z: this.topZ + 1,
      }
      this.stickers.push(sticker)
      this.selectedStickerId = sticker.id
      return sticker
    },

    updateSticker(id, patch) {
      const s = this.stickers.find((x) => x.id === id)
      if (s) Object.assign(s, patch)
    },

    bringToFront(id) {
      this.updateSticker(id, { z: this.topZ + 1 })
    },

    removeSticker(id) {
      this.stickers = this.stickers.filter((x) => x.id !== id)
      if (this.selectedStickerId === id) this.selectedStickerId = null
    },

    clearStickers() {
      this.stickers = []
      this.selectedStickerId = null
    },

    // --- drawing ----------------------------------------------------------

    startStroke(point) {
      const stroke = { id: nextId('d'), color: this.ink, width: this.brush, points: [point] }
      this.drawings.push(stroke)
      return stroke.id
    },

    extendStroke(id, point) {
      const stroke = this.drawings.find((d) => d.id === id)
      if (!stroke) return
      // Skip points closer than ~0.3% of the strip: raw pointer events fire far
      // faster than the stroke needs, and every extra point costs payload size.
      const [lx, ly] = stroke.points.at(-1)
      if (Math.hypot(point[0] - lx, point[1] - ly) < 0.003) return
      if (stroke.points.length < 600) stroke.points.push(point)
    },

    /** Erases whole strokes rather than pixels - simple, and always undoable. */
    eraseStrokeNear(point, radius = 0.025) {
      const hit = [...this.drawings].reverse().find((stroke) =>
        stroke.points.some(([x, y]) => Math.hypot(x - point[0], y - point[1]) < radius + stroke.width),
      )
      if (hit) this.drawings = this.drawings.filter((d) => d.id !== hit.id)
      return Boolean(hit)
    },

    undoStroke() {
      this.drawings.pop()
    },

    clearDrawings() {
      this.drawings = []
    },

    // --- save -------------------------------------------------------------

    /**
     * Re-opens a saved strip at the decorate step. Source frames are fetched
     * back so the composite can be rebuilt; stickers and ink come from the row.
     */
    async loadForEdit(slug) {
      await this.loadThemes()
      const strip = await stripsApi.findBySlug(slug)
      if (!strip.editable || !strip.framesData?.length) {
        throw new Error('This strip cannot be re-edited — the original photos were not kept.')
      }
      const theme = this.themes.find((t) => t.id === strip.themeId)
      if (!theme) throw new Error('The theme for this strip is gone.')

      this.frameUrls.forEach(URL.revokeObjectURL)
      const frames = await Promise.all(
        strip.framesData.map(async (url) => {
          const res = await fetch(url)
          if (!res.ok) throw new Error('Could not load the original photos.')
          return res.blob()
        }),
      )

      this.theme = theme
      this.frames = frames
      this.frameUrls = frames.map((b) => URL.createObjectURL(b))
      this.stickers = strip.stickerData ?? []
      this.drawings = strip.drawingData ?? []
      this.frameColor = strip.frameColor
      this.editingId = strip.id
      this.editToken = stripTokens.get(strip.id)
      this.step = 'decorate'
      await preloadTheme(theme)
      return strip
    },

    async save(blob) {
      this.saving = true
      this.error = null
      try {
        const form = new FormData()
        form.append('strip', blob, 'strip.png')
        form.append('themeId', this.theme.id)
        form.append('frameColor', this.frameColor)
        form.append('stickerData', JSON.stringify(this.stickers))
        form.append('drawingData', JSON.stringify(this.drawings))

        let saved
        if (this.editingId) {
          saved = await stripsApi.update(this.editingId, form, this.editToken)
        } else {
          this.frames.forEach((frame, i) => form.append('frames', frame, `frame-${i}.jpg`))
          saved = await stripsApi.save(form)
          if (saved.editToken) stripTokens.set(saved.id, saved.editToken)
        }

        this.result = {
          blob,
          objectUrl: URL.createObjectURL(blob),
          shareUrl: saved.shareUrl,
          slug: saved.shareSlug,
          imageUrl: saved.imageUrl,
        }
        this.step = 'done'
        return this.result
      } catch (err) {
        // A failed upload must not lose the strip - keep it downloadable locally.
        this.error = err.message
        this.result = { blob, objectUrl: URL.createObjectURL(blob), shareUrl: null, slug: null }
        this.step = 'done'
        throw err
      } finally {
        this.saving = false
      }
    },

    reset() {
      this.frameUrls.forEach(URL.revokeObjectURL)
      if (this.result?.objectUrl) URL.revokeObjectURL(this.result.objectUrl)
      const themes = this.themes
      this.$reset()
      this.themes = themes
    },
  },
})
