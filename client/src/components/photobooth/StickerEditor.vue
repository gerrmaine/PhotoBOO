<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { usePhotoboothStore } from '@/stores/photobooth.js'
import { renderStrip, drawStroke } from '@/lib/composite.js'
import { useDraggable } from '@/composables/useDraggable.js'
import { STRIP_LAYOUT as L, FRAME_COLORS, INK_COLORS } from '@/lib/layout.js'

const booth = usePhotoboothStore()

const stageRef = ref(null)
const inkRef = ref(null)        // overlay canvas for freehand strokes
const baseUrl = ref(null)       // strip without stickers/ink, used as backdrop
const rendering = ref(true)
const palette = ref('theme')    // theme | global
const activeStroke = ref(null)

/**
 * The base strip (photos + frame art + footer) is rasterised once and reused.
 * Stickers stay as DOM elements and ink lives on a light overlay canvas, so a
 * pointer move never triggers a full recomposite.
 */
async function renderBase() {
  rendering.value = true
  try {
    const blob = await renderStrip({
      frames: booth.frames,
      frameAssetUrl: booth.theme.frameAssetUrl,
      frameColor: booth.frameColor,
      caption: booth.theme.name,
      stickers: [],
      drawings: [],
    })
    if (baseUrl.value) URL.revokeObjectURL(baseUrl.value)
    baseUrl.value = URL.createObjectURL(blob)
  } finally {
    rendering.value = false
  }
}

onMounted(async () => {
  await renderBase()
  await nextTick()
  redrawInk()
})

// Strip colour and theme both change the baked-in backdrop.
watch(() => [booth.frameColor, booth.theme?.id], renderBase)
watch(() => booth.drawings, redrawInk, { deep: true })

onUnmounted(() => baseUrl.value && URL.revokeObjectURL(baseUrl.value))

function redrawInk() {
  const canvas = inkRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  // The overlay is a scaled copy of the strip, so the same normalised stroke
  // data used at export renders here without a second code path.
  ctx.scale(canvas.width / L.width, canvas.height / L.height)
  booth.drawings.forEach((s) => drawStroke(ctx, s))
}

const rect = () => stageRef.value.getBoundingClientRect()
const toPoint = (e) => {
  const r = rect()
  return [
    Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
    Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
  ]
}

// --- sticker dragging ------------------------------------------------------

const { dragging, begin } = useDraggable(rect, {
  onStart: (s) => {
    booth.selectedStickerId = s.id
    booth.bringToFront(s.id)
  },
  onMove: (id, pos) => booth.updateSticker(id, pos),
})

function onStickerPointerDown(event, sticker) {
  if (booth.tool !== 'select') return   // drawing passes straight through
  begin(event, sticker)
}

// --- drawing ---------------------------------------------------------------

function onStagePointerDown(event) {
  if (booth.tool === 'select') {
    if (event.target === stageRef.value || event.target.dataset.stage) booth.selectedStickerId = null
    return
  }
  event.preventDefault()
  stageRef.value.setPointerCapture?.(event.pointerId)
  const point = toPoint(event)

  if (booth.tool === 'erase') {
    booth.eraseStrokeNear(point)
  } else {
    activeStroke.value = booth.startStroke(point)
  }

  window.addEventListener('pointermove', onStagePointerMove)
  window.addEventListener('pointerup', onStagePointerUp)
  window.addEventListener('pointercancel', onStagePointerUp)
}

function onStagePointerMove(event) {
  const point = toPoint(event)
  if (booth.tool === 'erase') booth.eraseStrokeNear(point)
  else if (activeStroke.value) booth.extendStroke(activeStroke.value, point)
}

function onStagePointerUp() {
  activeStroke.value = null
  window.removeEventListener('pointermove', onStagePointerMove)
  window.removeEventListener('pointerup', onStagePointerUp)
  window.removeEventListener('pointercancel', onStagePointerUp)
}

// --- misc ------------------------------------------------------------------

const selected = computed(() => booth.selectedSticker)
const visibleStickers = computed(() =>
  palette.value === 'theme' ? booth.themeStickers : booth.globalStickers,
)

function styleFor(sticker) {
  return {
    left: `${sticker.x * 100}%`,
    top: `${sticker.y * 100}%`,
    width: `${sticker.scale * 100}%`,
    transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg)`,
    zIndex: sticker.z + 1,
    cursor: booth.tool !== 'select' ? 'inherit' : dragging.value === sticker.id ? 'grabbing' : 'grab',
    pointerEvents: booth.tool === 'select' ? 'auto' : 'none',
  }
}

function onKey(e) {
  if (e.key === 'Escape') booth.tool = 'select'
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && booth.drawings.length) {
    e.preventDefault()
    booth.undoStroke()
  }
  if ((e.key === 'Delete' || e.key === 'Backspace') && selected.value) {
    e.preventDefault()
    booth.removeSticker(selected.value.id)
  }
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="row g-4">
    <!-- ---------------------------------------------------------------- -->
    <div class="col-12 col-lg-6 d-flex justify-content-center">
      <div
        ref="stageRef"
        data-stage="1"
        class="position-relative pb-strip-shadow"
        :style="{
          width: 'min(352px, 84vw)',
          aspectRatio: `${L.width}/${L.height}`,
          background: booth.frameColor,
          cursor: booth.tool === 'draw' ? 'crosshair' : booth.tool === 'erase' ? 'cell' : 'default',
          touchAction: booth.tool === 'select' ? 'auto' : 'none',
        }"
        @pointerdown="onStagePointerDown"
      >
        <img v-if="baseUrl" :src="baseUrl" alt="Your photo strip" class="w-100 h-100 d-block" data-stage="1" />

        <!-- Ink sits above the photos but below the stickers. -->
        <canvas
          ref="inkRef"
          :width="L.width"
          :height="L.height"
          class="position-absolute top-0 start-0 w-100 h-100"
          style="pointer-events: none"
        ></canvas>

        <div v-if="rendering" class="position-absolute top-50 start-50 translate-middle pb-muted">
          <div class="spinner-border spinner-border-sm"></div>
        </div>

        <img
          v-for="sticker in booth.stickers"
          :key="sticker.id"
          :src="booth.stickerUrls[sticker.assetId]"
          alt=""
          draggable="false"
          class="position-absolute user-select-none"
          :class="{ 'outline-selected': booth.tool === 'select' && selected?.id === sticker.id }"
          :style="styleFor(sticker)"
          @pointerdown="onStickerPointerDown($event, sticker)"
        />
      </div>
    </div>

    <!-- ---------------------------------------------------------------- -->
    <div class="col-12 col-lg-6">
      <!-- tools -->
      <div class="pb-card p-3 mb-3">
        <div class="btn-group w-100 mb-3">
          <button
            v-for="t in [
              { id: 'select', icon: 'bi-cursor-fill', label: 'Select' },
              { id: 'draw', icon: 'bi-pencil-fill', label: 'Draw' },
              { id: 'erase', icon: 'bi-eraser-fill', label: 'Erase' },
            ]"
            :key="t.id"
            class="btn btn-sm"
            :class="booth.tool === t.id ? 'btn-pb' : 'btn-ghost'"
            @click="booth.tool = t.id"
          >
            <i class="bi me-1" :class="t.icon"></i>{{ t.label }}
          </button>
        </div>

        <template v-if="booth.tool === 'draw'">
          <label class="form-label small pb-muted mb-1">Ink</label>
          <div class="d-flex flex-wrap gap-2 mb-3">
            <button
              v-for="color in INK_COLORS"
              :key="color"
              class="rounded-circle border-0"
              style="width: 28px; height: 28px"
              :style="{
                background: color,
                outline: booth.ink === color ? '3px solid var(--pb-accent)' : '1px solid var(--pb-border)',
                outlineOffset: '2px',
              }"
              :title="`Ink ${color}`"
              :aria-label="`Ink colour ${color}`"
              @click="booth.ink = color"
            ></button>
          </div>

          <label class="form-label small pb-muted mb-1">Brush size</label>
          <input type="range" class="form-range" min="0.004" max="0.06" step="0.002" v-model.number="booth.brush" />
        </template>

        <div v-if="booth.drawings.length" class="d-flex gap-2 mt-2">
          <button class="btn btn-ghost btn-sm flex-grow-1" @click="booth.undoStroke()">
            <i class="bi bi-arrow-counterclockwise me-1"></i>Undo stroke
          </button>
          <button class="btn btn-ghost btn-sm" @click="booth.clearDrawings()">Clear ink</button>
        </div>
        <p v-else-if="booth.tool === 'draw'" class="pb-muted small mb-0 mt-2">
          Draw anywhere on the strip. Ctrl+Z undoes.
        </p>
      </div>

      <!-- stickers -->
      <div class="pb-card p-3 mb-3">
        <div class="btn-group w-100 mb-3">
          <button class="btn btn-sm" :class="palette === 'theme' ? 'btn-pb' : 'btn-ghost'" @click="palette = 'theme'">
            {{ booth.theme.name }}
          </button>
          <button class="btn btn-sm" :class="palette === 'global' ? 'btn-pb' : 'btn-ghost'" @click="palette = 'global'">
            Everyday
          </button>
        </div>

        <div class="d-flex flex-wrap gap-2" style="max-height: 230px; overflow-y: auto">
          <button
            v-for="asset in visibleStickers"
            :key="asset.id"
            class="sticker-chip d-flex align-items-center justify-content-center"
            :title="asset.name"
            @click="booth.addSticker(asset)"
          >
            <img :src="asset.assetUrl" :alt="asset.name" width="34" height="34" />
          </button>
        </div>
      </div>

      <!-- strip colour -->
      <div class="pb-card p-3 mb-3">
        <h2 class="h6 mb-2">Strip colour</h2>
        <div class="d-flex flex-wrap gap-2">
          <button
            v-for="color in FRAME_COLORS"
            :key="color"
            class="rounded-circle border-0"
            style="width: 30px; height: 30px"
            :style="{
              background: color,
              outline: booth.frameColor === color ? '3px solid var(--pb-accent)' : '1px solid var(--pb-border)',
              outlineOffset: '2px',
            }"
            :title="`Strip ${color}`"
            :aria-label="`Strip colour ${color}`"
            @click="booth.frameColor = color"
          ></button>
          <label
            class="rounded-circle d-flex align-items-center justify-content-center"
            style="width: 30px; height: 30px; border: 1px dashed var(--pb-border); cursor: pointer"
            title="Custom colour"
          >
            <i class="bi bi-eyedropper" style="font-size: 0.7rem"></i>
            <input type="color" class="d-none" :value="booth.frameColor" @input="booth.frameColor = $event.target.value" />
          </label>
        </div>
      </div>

      <!-- selected sticker -->
      <div class="pb-card p-3">
        <h2 class="h6 mb-2">Selected sticker</h2>
        <div v-if="!selected" class="pb-muted small">Nothing selected. Tap a sticker on the strip.</div>
        <div v-else>
          <label class="form-label small pb-muted mb-1">Size</label>
          <input
            type="range" class="form-range" min="0.06" max="0.9" step="0.01"
            :value="selected.scale"
            @input="booth.updateSticker(selected.id, { scale: Number($event.target.value) })"
          />
          <label class="form-label small pb-muted mb-1">Rotation</label>
          <input
            type="range" class="form-range" min="-180" max="180" step="1"
            :value="selected.rotation"
            @input="booth.updateSticker(selected.id, { rotation: Number($event.target.value) })"
          />
          <div class="d-flex gap-2 mt-2">
            <button class="btn btn-ghost btn-sm flex-grow-1" @click="booth.removeSticker(selected.id)">
              <i class="bi bi-trash me-1"></i>Remove
            </button>
            <button class="btn btn-ghost btn-sm" :disabled="!booth.stickers.length" @click="booth.clearStickers()">
              Clear all
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.outline-selected {
  outline: 2px dashed var(--pb-accent);
  outline-offset: 3px;
}

/* Stickers are drawn to sit on light photos, so the palette needs a light chip
   or the dark-ink ones (arrow-label, shades, film-strip) vanish. */
.sticker-chip {
  width: 56px;
  height: 56px;
  padding: 0.5rem;
  border: 1px solid var(--pb-border);
  border-radius: 12px;
  background: #f4f1fa;
  transition: transform 0.12s ease, border-color 0.12s ease;
}
.sticker-chip:hover {
  transform: translateY(-2px);
  border-color: var(--pb-accent);
}
</style>
