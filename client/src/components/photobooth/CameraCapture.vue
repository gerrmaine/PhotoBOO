<script setup>
import { ref, onMounted, computed } from 'vue'
import { useCamera } from '@/composables/useCamera.js'
import { usePhotoboothStore } from '@/stores/photobooth.js'
import { captureFrame } from '@/lib/composite.js'
import { COUNTDOWN_SECONDS, BETWEEN_SHOTS_MS, STRIP_LAYOUT } from '@/lib/layout.js'

const booth = usePhotoboothStore()
const { status, message, videoRef, start } = useCamera()

const countdown = ref(0)
const shooting = ref(false)
const flash = ref(false)

const slots = computed(() => Array.from({ length: STRIP_LAYOUT.frameCount }, (_, i) => i))

onMounted(start)

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

/** Runs the whole 4-shot sequence so nobody has to keep clicking mid-pose. */
async function shootAll() {
  if (shooting.value || status.value !== 'ready') return
  shooting.value = true
  booth.retake()

  try {
    while (booth.frames.length < STRIP_LAYOUT.frameCount) {
      for (let n = COUNTDOWN_SECONDS; n > 0; n--) {
        countdown.value = n
        await wait(1000)
      }
      countdown.value = 0

      booth.addFrame(await captureFrame(videoRef.value))

      flash.value = true
      setTimeout(() => (flash.value = false), 180)

      if (booth.frames.length < STRIP_LAYOUT.frameCount) await wait(BETWEEN_SHOTS_MS)
    }
  } finally {
    shooting.value = false
    countdown.value = 0
  }
}
</script>

<template>
  <section class="row g-4 align-items-start">
    <div class="col-12 col-lg-8">
      <div class="pb-card position-relative overflow-hidden" style="aspect-ratio: 4/3">
        <!-- Mirrored for the preview only. The capture canvas is never flipped,
             or any text behind the subject would come out backwards. -->
        <video
          ref="videoRef"
          playsinline
          muted
          class="w-100 h-100"
          style="object-fit: cover; transform: scaleX(-1)"
        ></video>

        <div
          v-if="flash"
          class="position-absolute top-0 start-0 w-100 h-100 bg-white"
          style="opacity: 0.85"
        ></div>

        <div
          v-if="countdown"
          class="position-absolute top-50 start-50 translate-middle text-white fw-bold"
          style="font-size: clamp(5rem, 18vw, 11rem); text-shadow: 0 8px 40px rgba(0,0,0,.6)"
        >
          {{ countdown }}
        </div>

        <div
          v-if="shooting && !countdown"
          class="position-absolute top-50 start-50 translate-middle badge bg-danger fs-5 px-3 py-2"
        >
          Snap!
        </div>

        <!-- Camera trouble is a normal state, not a crash. -->
        <div
          v-if="status !== 'ready' && status !== 'starting'"
          class="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center text-center p-4"
          style="background: rgba(10, 6, 22, 0.92)"
        >
          <i class="bi bi-camera-video-off fs-1 mb-3" style="color: var(--pb-accent)"></i>
          <p class="mb-3" style="max-width: 32ch">
            {{ message || 'Allow camera access to start shooting.' }}
          </p>
          <button class="btn btn-pb" @click="start">
            <i class="bi bi-arrow-clockwise me-1"></i>Try again
          </button>
        </div>

        <div
          v-if="status === 'starting'"
          class="position-absolute top-50 start-50 translate-middle pb-muted"
        >
          <div class="spinner-border"></div>
        </div>
      </div>

      <div class="d-flex align-items-center justify-content-between mt-3 flex-wrap gap-2">
        <div class="pb-muted small">
          <i class="bi bi-info-circle me-1"></i>
          {{ shooting ? `Shot ${booth.frames.length} of 4` : '4 photos, 3 seconds apart' }}
        </div>
        <button class="btn btn-pb btn-lg" :disabled="status !== 'ready' || shooting" @click="shootAll">
          <i class="bi bi-camera-fill me-2"></i>
          {{ shooting ? 'Shooting…' : 'Start the shoot' }}
        </button>
      </div>
    </div>

    <aside class="col-12 col-lg-4">
      <div class="pb-card p-3">
        <h2 class="h6 mb-3">Your frames</h2>
        <div class="d-flex flex-lg-column gap-2 flex-wrap">
          <div
            v-for="i in slots"
            :key="i"
            class="flex-grow-1 rounded overflow-hidden d-flex align-items-center justify-content-center"
            style="aspect-ratio: 9/8; min-width: 72px; background: rgba(0,0,0,.3); border: 1px dashed var(--pb-border)"
          >
            <img
              v-if="booth.frameUrls[i]"
              :src="booth.frameUrls[i]"
              alt=""
              class="w-100 h-100"
              style="object-fit: cover"
            />
            <span v-else class="pb-muted small">{{ i + 1 }}</span>
          </div>
        </div>
      </div>
    </aside>
  </section>
</template>
