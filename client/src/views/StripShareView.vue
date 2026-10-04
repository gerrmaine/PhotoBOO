<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { stripsApi, stripTokens } from '@/api/client.js'
import { useWorldStore } from '@/stores/world.js'
import { canManageStrip } from '@/lib/ownership.js'

const route = useRoute()
const router = useRouter()
const world = useWorldStore()
const strip = ref(null)
const error = ref(null)
const copied = ref(false)
const busy = ref(false)

onMounted(async () => {
  try {
    strip.value = await stripsApi.findBySlug(route.params.slug)
  } catch (err) {
    error.value = err.message
  }
})

const mine = computed(() =>
  canManageStrip(strip.value, { isHost: world.isHost, worldId: world.world?.id }),
)

async function copyLink() {
  await navigator.clipboard.writeText(window.location.href)
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}

function edit() {
  router.push({ name: 'photobooth', query: { edit: strip.value.shareSlug } })
}

async function destroy() {
  if (!window.confirm('Delete this strip? The share link will stop working.')) return
  busy.value = true
  try {
    await stripsApi.destroy(strip.value.id, stripTokens.get(strip.value.id))
    router.push(world.world ? `/world/${world.world.id}` : '/')
  } catch (err) {
    error.value = err.message
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="pb-shell text-center">
    <div v-if="error && !strip" class="pb-card p-5 mx-auto" style="max-width: 32rem">
      <i class="bi bi-camera fs-1 pb-muted"></i>
      <h1 class="h4 mt-3 mb-2">Strip not found</h1>
      <p class="pb-muted">This link may have been removed.</p>
      <RouterLink to="/photobooth" class="btn btn-pb">Make your own</RouterLink>
    </div>

    <template v-else-if="strip">
      <h1 class="pb-title h3 mb-1">
        {{ strip.authorName ? `${strip.authorName}'s strip` : 'A photo strip' }}
      </h1>
      <p class="pb-muted mb-4">{{ strip.themeName }}</p>

      <img :src="strip.imageUrl" alt="Photo strip" class="pb-strip-shadow mb-4" style="width: min(320px, 76vw)" />

      <div v-if="error" class="alert alert-danger mx-auto mb-3" style="max-width: 28rem">{{ error }}</div>

      <div class="d-flex justify-content-center gap-2 flex-wrap">
        <a :href="strip.imageUrl" :download="`photostrip-${strip.shareSlug}.png`" class="btn btn-pb">
          <i class="bi bi-download me-2"></i>Download
        </a>
        <button class="btn btn-ghost" @click="copyLink">
          <i class="bi me-2" :class="copied ? 'bi-check-lg' : 'bi-link-45deg'"></i>
          {{ copied ? 'Copied!' : 'Copy link' }}
        </button>
        <button v-if="mine && strip.editable" class="btn btn-ghost" @click="edit">
          <i class="bi bi-pencil me-2"></i>Edit
        </button>
        <button v-if="mine" class="btn btn-ghost" style="color: #ff8787" :disabled="busy" @click="destroy">
          <i class="bi bi-trash me-2"></i>Delete
        </button>
        <RouterLink to="/photobooth" class="btn btn-ghost">
          <i class="bi bi-camera-fill me-2"></i>Make your own
        </RouterLink>
      </div>
    </template>

    <div v-else class="py-5 pb-muted"><div class="spinner-border"></div></div>
  </div>
</template>
