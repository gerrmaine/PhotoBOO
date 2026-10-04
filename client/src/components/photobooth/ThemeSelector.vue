<script setup>
import { ref, onMounted } from 'vue'
import { usePhotoboothStore } from '@/stores/photobooth.js'

const props = defineProps({
  lockedTheme: { type: Object, default: null }, // set by the world host
})

const booth = usePhotoboothStore()
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
  try {
    await booth.loadThemes()
    // When entering from a lobby the host has already decided - skip the step
    // rather than inviting a choice that would then be overridden.
    if (props.lockedTheme) {
      const match = booth.themes.find((t) => t.id === props.lockedTheme.id)
      if (match) await booth.selectTheme(match)
    }
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section>
    <div class="text-center mb-4">
      <h1 class="pb-title display-6 mb-1">Pick a theme</h1>
      <p class="pb-muted mb-0">It sets your strip frame, stickers and characters.</p>
    </div>

    <div v-if="loading" class="text-center py-5 pb-muted">
      <div class="spinner-border mb-2"></div>
      <div>Loading themes…</div>
    </div>

    <div v-else-if="error" class="alert alert-danger">
      Could not load themes: {{ error }}
      <div class="small mt-1">Is the API running on port 3000?</div>
    </div>

    <div v-else class="row g-3 g-md-4">
      <div v-for="theme in booth.themes" :key="theme.id" class="col-12 col-md-4">
        <article
          class="pb-card pb-selectable h-100 overflow-hidden"
          :class="{ 'is-selected': booth.theme?.id === theme.id }"
          role="button"
          tabindex="0"
          :aria-pressed="booth.theme?.id === theme.id"
          @click="booth.selectTheme(theme)"
          @keydown.enter.prevent="booth.selectTheme(theme)"
          @keydown.space.prevent="booth.selectTheme(theme)"
        >
          <img :src="theme.thumbUrl" :alt="theme.name" class="w-100 d-block" style="aspect-ratio: 320/220; object-fit: cover" />
          <div class="p-3">
            <h2 class="h5 mb-1 d-flex align-items-center gap-2">
              <span class="rounded-circle d-inline-block" :style="{ width: '10px', height: '10px', background: theme.accentColor }"></span>
              {{ theme.name }}
            </h2>
            <p class="pb-muted small mb-3">{{ theme.tagline }}</p>
            <div class="d-flex gap-1 flex-wrap">
              <img
                v-for="sticker in theme.stickers.slice(0, 6)"
                :key="sticker.id"
                :src="sticker.assetUrl"
                :alt="sticker.name"
                width="28"
                height="28"
              />
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
