<script setup>
import { ref } from 'vue'
import { usePhotoboothStore } from '@/stores/photobooth.js'
import { useWorldStore } from '@/stores/world.js'

const booth = usePhotoboothStore()
const world = useWorldStore()
const open = ref(false)
const notice = ref('')

async function pick(theme) {
  if (theme.id === booth.theme?.id) return (open.value = false)

  const { droppedStickers } = await booth.changeTheme(theme)
  open.value = false
  // Say so rather than letting stickers silently vanish.
  notice.value = droppedStickers
    ? `Switched to ${theme.name}. ${droppedStickers} sticker${droppedStickers > 1 ? 's were' : ' was'} removed — they belonged to the old theme.`
    : ''
  if (notice.value) setTimeout(() => (notice.value = ''), 6000)
}
</script>

<template>
  <div>
    <button class="btn btn-ghost btn-sm" @click="open = !open">
      <i class="bi bi-palette me-1"></i>
      Theme: <strong class="ms-1">{{ booth.theme?.name }}</strong>
      <i class="bi ms-1" :class="open ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
    </button>

    <!-- In a World the host's theme is the shared one, so changing it here
         would desync the group. Say why instead of silently disabling. -->
    <p v-if="world.hasSession && world.theme" class="pb-muted small mt-2 mb-0">
      <i class="bi bi-info-circle me-1"></i>
      Your World is set to {{ world.theme.name }}. Changing it here only affects this strip.
    </p>

    <div v-if="open" class="pb-card p-3 mt-2">
      <div class="row g-2">
        <div v-for="theme in booth.themes" :key="theme.id" class="col-4 col-md-3">
          <button
            class="btn p-0 w-100 pb-selectable border-0 overflow-hidden"
            :class="{ 'is-selected': booth.theme?.id === theme.id }"
            :aria-pressed="booth.theme?.id === theme.id"
            @click="pick(theme)"
          >
            <img :src="theme.thumbUrl" :alt="theme.name" class="w-100 d-block" />
            <div class="small py-1 px-1 text-truncate">{{ theme.name }}</div>
          </button>
        </div>
      </div>
    </div>

    <div v-if="notice" class="alert alert-info py-2 small mt-2 mb-0">{{ notice }}</div>
  </div>
</template>
