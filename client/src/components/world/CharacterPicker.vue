<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useWorldStore } from '@/stores/world.js'
import { useCamera } from '@/composables/useCamera.js'
import { compositeCharacter, drawCropPreview } from '@/lib/crop.js'
import { captureFrame } from '@/lib/composite.js'
import { worldsApi } from '@/api/client.js'

const props = defineProps({
  startWith: { type: Object, default: null },
})
const emit = defineEmits(['close', 'saved'])
const world = useWorldStore()

const PREVIEW = 220

const character = ref(null)
const faceBlob = ref(null)
const faceUrl = ref(null)
const faceChanged = ref(false)
const crop = ref({ x: 0.5, y: 0.5, zoom: 1 })
const previewRef = ref(null)
const photoMode = ref('ready') // ready | camera | file
const saving = ref(false)
const error = ref(null)
const restoring = ref(false)

const { status, message, videoRef, start, stop } = useCamera()

const characters = computed(() => world.theme?.characters ?? [])
const ready = computed(() => character.value && faceBlob.value)

function setFace(blob, { resetCrop = true, changed = true } = {}) {
  if (faceUrl.value?.startsWith('blob:')) URL.revokeObjectURL(faceUrl.value)
  faceBlob.value = blob
  faceUrl.value = URL.createObjectURL(blob)
  if (resetCrop) crop.value = { x: 0.5, y: 0.5, zoom: 1 }
  faceChanged.value = changed
}

function pickFile(event) {
  const file = event.target.files?.[0]
  if (!file) return
  setFace(file)
  photoMode.value = 'ready'
}

async function openCamera() {
  photoMode.value = 'camera'
  await nextTick()
  await start()
}

function closeCamera() {
  stop()
  photoMode.value = 'ready'
}

async function snap() {
  if (status.value !== 'ready') return
  const blob = await captureFrame(videoRef.value)
  setFace(blob)
  closeCamera()
}

// Switching character must not throw away a photo the user already framed.
function pickCharacter(c) {
  character.value = c
}

watch(crop, () => {
  if (faceBlob.value && !restoring.value) faceChanged.value = true
}, { deep: true })

watch([faceUrl, crop], async () => {
  if (faceUrl.value && previewRef.value) {
    await drawCropPreview(previewRef.value, faceUrl.value, crop.value, PREVIEW)
  }
}, { deep: true, flush: 'post' })

onMounted(async () => {
  const mine = world.me
  const wantedId = props.startWith?.id ?? mine?.characterId
  character.value = characters.value.find((c) => c.id === wantedId) ?? characters.value[0] ?? null

  if (mine?.faceImageUrl) {
    restoring.value = true
    try {
      const res = await fetch(mine.faceImageUrl)
      if (res.ok) {
        setFace(await res.blob(), { resetCrop: false, changed: false })
        if (mine.faceCrop) crop.value = { ...mine.faceCrop }
      }
    } catch {
      /* a missing face just means they start from scratch */
    } finally {
      restoring.value = false
    }
  }
})

onUnmounted(() => {
  stop()
  if (faceUrl.value?.startsWith('blob:')) URL.revokeObjectURL(faceUrl.value)
})

async function save() {
  saving.value = true
  error.value = null
  try {
    const blob = await compositeCharacter({
      characterUrl: character.value.artUrl,
      faceBlob: faceBlob.value,
      faceAnchor: character.value.faceAnchor,
      crop: crop.value,
    })

    const form = new FormData()
    form.append('image', blob, 'character.png')
    form.append('characterId', character.value.id)
    // Only resend the raw photo when it actually changed. Switching character
    // re-composites from the stored face so nobody is asked to pose again.
    if (faceChanged.value && faceBlob.value) {
      form.append('face', faceBlob.value, 'face.jpg')
      form.append('crop', JSON.stringify(crop.value))
    }

    await worldsApi.saveCharacter(form, world.world.id)
    emit('saved')
    emit('close')
  } catch (err) {
    error.value = err.message
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div
    class="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
    style="background: rgba(8, 4, 18, 0.82); z-index: 1050"
    @click.self="emit('close')"
  >
    <div class="pb-card p-4 w-100 overflow-auto" style="max-width: 760px; max-height: 92vh; background: #1a1134">
      <div class="d-flex justify-content-between align-items-start mb-3">
        <div>
          <h2 class="h5 mb-1">Make your character</h2>
          <p class="pb-muted small mb-0">
            Pick a character, then take a photo or choose a file. Switching characters keeps your picture.
          </p>
        </div>
        <button class="btn-close btn-close-white" @click="emit('close')"></button>
      </div>

      <div v-if="!characters.length" class="alert alert-info">
        The host hasn't picked a theme yet — characters appear once they do.
      </div>

      <template v-else>
        <div class="row g-2 mb-4">
          <div v-for="c in characters" :key="c.id" class="col-4 col-sm-3">
            <button
              class="btn p-0 w-100 pb-selectable border-0 overflow-hidden"
              :class="{ 'is-selected': character?.id === c.id }"
              :aria-pressed="character?.id === c.id"
              @click="pickCharacter(c)"
            >
              <img :src="c.artUrl" :alt="c.name" class="w-100 d-block" />
              <div class="small py-1 px-1 text-truncate">{{ c.name }}</div>
            </button>
          </div>
        </div>

        <div class="row g-4 align-items-center">
          <div class="col-12 col-md-6">
            <label class="form-label small pb-muted">Your photo</label>
            <div class="d-flex gap-2 mb-3">
              <button
                class="btn btn-sm flex-grow-1"
                :class="photoMode === 'camera' ? 'btn-pb' : 'btn-ghost'"
                @click="photoMode === 'camera' ? closeCamera() : openCamera()"
              >
                <i class="bi bi-camera-fill me-1"></i>Take a photo
              </button>
              <label class="btn btn-sm btn-ghost flex-grow-1 mb-0">
                <i class="bi bi-image me-1"></i>Choose a file
                <input type="file" accept="image/*" class="d-none" @change="pickFile" />
              </label>
            </div>

            <div v-if="photoMode === 'camera'" class="mb-3">
              <div class="position-relative overflow-hidden rounded" style="aspect-ratio: 1; background: #0b0616">
                <video
                  ref="videoRef"
                  playsinline
                  muted
                  class="w-100 h-100"
                  style="object-fit: cover; transform: scaleX(-1)"
                ></video>
                <div
                  v-if="status !== 'ready'"
                  class="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3 text-center small"
                >
                  <span v-if="status === 'starting'" class="spinner-border spinner-border-sm"></span>
                  <span v-else class="pb-muted">{{ message || 'Starting camera…' }}</span>
                </div>
              </div>
              <button class="btn btn-pb w-100 mt-2" :disabled="status !== 'ready'" @click="snap">
                <i class="bi bi-camera me-1"></i>Snap
              </button>
            </div>

            <p v-if="faceUrl && !faceChanged" class="pb-muted small mb-2">
              Using your existing photo. Take or upload a new one only if you want to replace it.
            </p>

            <template v-if="faceUrl && photoMode !== 'camera'">
              <label class="form-label small pb-muted mb-1">Zoom</label>
              <input type="range" class="form-range" min="1" max="3" step="0.02" v-model.number="crop.zoom" />
              <label class="form-label small pb-muted mb-1">Move across</label>
              <input type="range" class="form-range" min="0" max="1" step="0.01" v-model.number="crop.x" />
              <label class="form-label small pb-muted mb-1">Move up and down</label>
              <input type="range" class="form-range" min="0" max="1" step="0.01" v-model.number="crop.y" />
            </template>
          </div>

          <div class="col-12 col-md-6 text-center">
            <canvas
              v-show="faceUrl && photoMode !== 'camera'"
              ref="previewRef"
              :width="PREVIEW" :height="PREVIEW"
              class="rounded-circle"
              style="max-width: 100%; border: 3px solid var(--pb-accent)"
            ></canvas>
            <div v-if="restoring" class="pb-muted small py-5">
              <div class="spinner-border spinner-border-sm mb-2"></div>
              <div>Loading your photo…</div>
            </div>
            <div v-else-if="!faceUrl && photoMode !== 'camera'" class="pb-muted small py-5">
              <i class="bi bi-person-bounding-box fs-1 d-block mb-2"></i>
              Take a photo or choose a file — your crop preview appears here
            </div>
          </div>
        </div>

        <div v-if="error" class="alert alert-danger py-2 small mt-3 mb-0">{{ error }}</div>

        <div class="d-flex justify-content-end gap-2 mt-4">
          <button class="btn btn-ghost" @click="emit('close')">Cancel</button>
          <button class="btn btn-pb" :disabled="!ready || saving" @click="save">
            <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
            Save character
          </button>
        </div>
      </template>
    </div>
  </div>
</template>
