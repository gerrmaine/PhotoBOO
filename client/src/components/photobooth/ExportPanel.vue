<script setup>
import { ref } from 'vue'
import { usePhotoboothStore } from '@/stores/photobooth.js'

const booth = usePhotoboothStore()
const copied = ref(false)

function download() {
  const a = document.createElement('a')
  a.href = booth.result.objectUrl
  a.download = `photostrip-${booth.result.slug ?? Date.now()}.png`
  a.click()
}

async function copyLink() {
  await navigator.clipboard.writeText(booth.result.shareUrl)
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}
</script>

<template>
  <section class="text-center">
    <h1 class="pb-title display-6 mb-1">Looking good</h1>
    <p class="pb-muted">Your strip is ready.</p>

    <img
      :src="booth.result.objectUrl"
      alt="Your finished photo strip"
      class="pb-strip-shadow mb-4"
      style="width: min(300px, 70vw)"
    />

    <!-- The upload can fail while the strip itself is perfectly fine, so the
         download stays available either way rather than being lost to an error. -->
    <div v-if="booth.error" class="alert alert-warning mx-auto mb-3" style="max-width: 34rem">
      <i class="bi bi-exclamation-triangle me-1"></i>
      Couldn't save to the server ({{ booth.error }}), but your strip is safe — download it below.
    </div>

    <div class="d-flex flex-wrap justify-content-center gap-2 mb-4">
      <button class="btn btn-pb btn-lg" @click="download">
        <i class="bi bi-download me-2"></i>Download PNG
      </button>

      <button v-if="booth.result.shareUrl" class="btn btn-ghost btn-lg" @click="copyLink">
        <i class="bi me-2" :class="copied ? 'bi-check-lg' : 'bi-link-45deg'"></i>
        {{ copied ? 'Copied!' : 'Copy share link' }}
      </button>

      <button class="btn btn-ghost btn-lg" @click="booth.reset()">
        <i class="bi bi-arrow-repeat me-2"></i>Shoot another
      </button>
    </div>

    <p v-if="booth.result.shareUrl" class="pb-muted small">
      Anyone with this link can view the strip:
      <a :href="booth.result.shareUrl" class="text-decoration-none" style="color: var(--pb-accent)">
        {{ booth.result.shareUrl }}
      </a>
    </p>
  </section>
</template>
