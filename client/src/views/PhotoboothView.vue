<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePhotoboothStore } from '@/stores/photobooth.js'
import { useWorldStore } from '@/stores/world.js'
import { exportStrip } from '@/lib/composite.js'
import ThemeSelector from '@/components/photobooth/ThemeSelector.vue'
import ThemeSwitcher from '@/components/photobooth/ThemeSwitcher.vue'
import CameraCapture from '@/components/photobooth/CameraCapture.vue'
import StickerEditor from '@/components/photobooth/StickerEditor.vue'
import ExportPanel from '@/components/photobooth/ExportPanel.vue'

const route = useRoute()
const booth = usePhotoboothStore()
const world = useWorldStore()
const exporting = ref(false)
const loadError = ref(null)

// The photobooth never requires a world. If the user happens to be in one, its
// theme is adopted and the strip is attributed to them; otherwise this is null
// and nothing downstream changes.
const lockedTheme = computed(() => (world.hasSession ? world.theme : null))

onMounted(async () => {
  if (world.hasSession && !world.theme && world.world) world.applyState(null)
  if (route.query.edit) {
    try {
      await booth.loadForEdit(String(route.query.edit))
    } catch (err) {
      loadError.value = err.message
    }
  }
})

const steps = [
  { key: 'theme', label: 'Theme' },
  { key: 'camera', label: 'Shoot' },
  { key: 'review', label: 'Review' },
  { key: 'decorate', label: 'Decorate' },
  { key: 'done', label: 'Share' },
]
const stepIndex = computed(() => steps.findIndex((s) => s.key === booth.step))

async function finish() {
  exporting.value = true
  try {
    const blob = await exportStrip({
      frames: booth.frames,
      frameAssetUrl: booth.theme.frameAssetUrl,
      frameColor: booth.frameColor,
      caption: booth.theme.name,
      stickers: booth.stickers,
      stickerUrls: booth.stickerUrls,
      drawings: booth.drawings,
    })
    await booth.save(blob).catch(() => {}) // store keeps the blob either way
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <div class="pb-shell">
    <div v-if="loadError" class="alert alert-danger">{{ loadError }}</div>
    <!-- Progress mirrors the flow state machine exactly, so the UI can never
         disagree with the store about where the user is. -->
    <ol class="list-unstyled d-flex justify-content-center gap-2 gap-md-3 mb-4 flex-wrap">
      <li
        v-for="(s, i) in steps"
        :key="s.key"
        class="small d-flex align-items-center gap-2"
        :class="i <= stepIndex ? '' : 'pb-muted'"
      >
        <span
          class="rounded-circle d-inline-flex align-items-center justify-content-center"
          style="width: 24px; height: 24px; font-size: 0.72rem"
          :style="{
            background: i <= stepIndex ? 'var(--pb-accent)' : 'rgba(255,255,255,.08)',
            color: '#fff',
          }"
        >
          <i v-if="i < stepIndex" class="bi bi-check-lg"></i>
          <template v-else>{{ i + 1 }}</template>
        </span>
        {{ s.label }}
        <i v-if="i < steps.length - 1" class="bi bi-chevron-right pb-muted d-none d-md-inline"></i>
      </li>
    </ol>

    <!-- Available from the moment a theme exists, so a choice made on the first
         screen is never final. -->
    <div v-if="booth.theme && booth.step !== 'done'" class="d-flex justify-content-center mb-4">
      <div style="max-width: 640px; width: 100%">
        <ThemeSwitcher />
      </div>
    </div>

    <ThemeSelector v-if="booth.step === 'theme'" :locked-theme="lockedTheme" />

    <CameraCapture v-else-if="booth.step === 'camera'" />

    <section v-else-if="booth.step === 'review'">
      <div class="text-center mb-4">
        <h1 class="pb-title display-6 mb-1">Happy with these?</h1>
        <p class="pb-muted mb-0">Retake the set, or move on to stickers.</p>
      </div>
      <div class="row g-2 justify-content-center mb-4">
        <div v-for="(url, i) in booth.frameUrls" :key="i" class="col-6 col-md-3">
          <img :src="url" alt="" class="w-100 rounded" style="aspect-ratio: 9/8; object-fit: cover" />
        </div>
      </div>
      <div class="d-flex justify-content-center gap-2">
        <button class="btn btn-ghost" @click="booth.retake()">
          <i class="bi bi-arrow-counterclockwise me-1"></i>Retake all
        </button>
        <button class="btn btn-pb" @click="booth.step = 'decorate'">
          Add stickers<i class="bi bi-arrow-right ms-1"></i>
        </button>
      </div>
    </section>

    <section v-else-if="booth.step === 'decorate'">
      <div class="text-center mb-4">
        <h1 class="pb-title display-6 mb-1">Decorate it</h1>
        <p class="pb-muted mb-0">Everything you see here is exactly what gets downloaded.</p>
      </div>
      <StickerEditor />
      <div class="d-flex justify-content-center gap-2 mt-4">
        <button class="btn btn-ghost" @click="booth.step = 'review'">
          <i class="bi bi-arrow-left me-1"></i>Back
        </button>
        <button class="btn btn-pb btn-lg" :disabled="exporting" @click="finish">
          <span v-if="exporting" class="spinner-border spinner-border-sm me-2"></span>
          <i v-else class="bi bi-stars me-2"></i>
          {{ exporting ? 'Rendering…' : booth.editingId ? 'Save changes' : 'Finish strip' }}
        </button>
      </div>
    </section>

    <ExportPanel v-else-if="booth.step === 'done' && booth.result" />
  </div>
</template>
