<script setup>
import { RouterView, RouterLink, useRoute } from 'vue-router'
import { onMounted } from 'vue'
import { useWorldStore } from '@/stores/world.js'
import { worldsApi, session } from '@/api/client.js'
import WorldSwitcher from '@/components/world/WorldSwitcher.vue'

const route = useRoute()
const world = useWorldStore()

/**
 * Worlds live in localStorage, so they survive navigating away. Rehydrating the
 * active one here means the header can offer a way back from anywhere in the
 * app without the lobby having to be the page you came from.
 */
onMounted(async () => {
  if (!session.token || !session.worldId || world.world) return
  try {
    world.applyState(await worldsApi.state(session.worldId, -1))
  } catch {
    // Deleted by its host, or the token was revoked: drop it and keep the rest.
    world.forget(session.worldId)
  }
})
</script>

<template>
  <header class="border-bottom" style="border-color: var(--pb-border) !important">
    <nav class="pb-shell d-flex align-items-center justify-content-between py-3 gap-2" style="padding-bottom: 0.75rem">
      <RouterLink to="/" class="text-decoration-none d-flex align-items-center gap-2 flex-shrink-0">
        <i class="bi bi-camera-reels-fill fs-4" style="color: var(--pb-accent)"></i>
        <span class="pb-title fs-5 d-none d-sm-inline">Friends Photobooth</span>
      </RouterLink>

      <div class="d-flex align-items-center gap-2">
        <!-- Leaving the lobby page is not the same as leaving the World, so Home
             is always available and never destructive. -->
        <RouterLink v-if="route.name !== 'home'" to="/" class="btn btn-ghost btn-sm" title="Home">
          <i class="bi bi-house-door-fill"></i>
          <span class="d-none d-md-inline ms-1">Home</span>
        </RouterLink>

        <WorldSwitcher />

        <RouterLink v-if="route.name !== 'photobooth'" to="/photobooth" class="btn btn-pb btn-sm">
          <i class="bi bi-camera-fill me-1"></i>
          <span class="d-none d-sm-inline">Photobooth</span>
        </RouterLink>
      </div>
    </nav>
  </header>

  <main>
    <RouterView />
  </main>
</template>
