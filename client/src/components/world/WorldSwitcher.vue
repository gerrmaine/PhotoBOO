<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWorldStore } from '@/stores/world.js'

const router = useRouter()
const world = useWorldStore()
const open = ref(false)
const rootRef = ref(null)

const current = computed(() => world.world)
const others = computed(() => world.joined.filter((w) => w.worldId !== current.value?.id))

function go(worldId) {
  open.value = false
  world.switchTo(worldId)
  router.push(`/world/${worldId}`)
}

// A dropdown that ignores outside clicks feels broken on touch devices.
function onDocumentClick(event) {
  if (open.value && rootRef.value && !rootRef.value.contains(event.target)) open.value = false
}
onMounted(() => document.addEventListener('click', onDocumentClick))
onUnmounted(() => document.removeEventListener('click', onDocumentClick))
</script>

<template>
  <div v-if="world.joined.length" ref="rootRef" class="position-relative">
    <button class="btn btn-ghost btn-sm d-flex align-items-center gap-1" @click="open = !open">
      <i class="bi bi-door-open-fill"></i>
      <span v-if="current" class="pb-code small">{{ current.code }}</span>
      <span v-else class="small">Worlds</span>
      <span class="badge rounded-pill" style="background: rgba(255,255,255,.12); font-size: .62rem">
        {{ world.joined.length }}
      </span>
      <i class="bi" :class="open ? 'bi-chevron-up' : 'bi-chevron-down'" style="font-size: .62rem"></i>
    </button>

    <div
      v-if="open"
      class="pb-card p-2 position-absolute end-0 mt-2"
      style="width: 272px; z-index: 1040; background: #1a1134; max-height: 70vh; overflow-y: auto"
    >
      <div class="pb-muted small px-2 pt-1 pb-2">
        You're in {{ world.joined.length }}
        {{ world.joined.length === 1 ? 'World' : 'Worlds' }} · hosting {{ world.hostedCount }}/{{ world.maxWorlds }}
      </div>

      <button
        v-for="entry in world.joined"
        :key="entry.worldId"
        class="btn btn-ghost btn-sm w-100 text-start d-flex align-items-center gap-2 mb-1"
        :class="{ 'is-current': entry.worldId === current?.id }"
        @click="go(entry.worldId)"
      >
        <i class="bi" :class="entry.isHost ? 'bi-star-fill' : 'bi-person-fill'" style="color: var(--pb-accent)"></i>
        <span class="flex-grow-1 text-truncate">{{ entry.name || 'Untitled World' }}</span>
        <span class="pb-code" style="font-size: .62rem">{{ entry.code }}</span>
        <i v-if="entry.worldId === current?.id" class="bi bi-check-lg"></i>
      </button>

      <RouterLink to="/" class="btn btn-pb btn-sm w-100 mt-1" @click="open = false">
        <i class="bi bi-plus-lg me-1"></i>New or join a World
      </RouterLink>

      <p v-if="!world.canCreateMore" class="pb-muted mb-0 mt-2 px-2" style="font-size: .7rem">
        You're hosting the maximum of {{ world.maxWorlds }}. Delete one to host another.
      </p>
    </div>
  </div>
</template>

<style scoped>
.is-current {
  background: rgba(214, 51, 108, 0.16);
  border-color: var(--pb-accent);
}
</style>
