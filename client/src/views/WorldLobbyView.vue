<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWorldStore } from '@/stores/world.js'
import { usePhotoboothStore } from '@/stores/photobooth.js'
import { usePolling } from '@/composables/usePolling.js'
import { worldsApi, stripsApi, stripTokens } from '@/api/client.js'
import { canManageStrip } from '@/lib/ownership.js'
import CharacterPicker from '@/components/world/CharacterPicker.vue'

const route = useRoute()
const router = useRouter()
const world = useWorldStore()
const booth = usePhotoboothStore()

const copied = ref(false)
const strips = ref([])
const showPicker = ref(false)
const pickerStart = ref(null)
const busyStrip = ref(null)

const { active } = usePolling(
  async () => {
    const state = await worldsApi.state(route.params.id, world.world?.revision ?? -1)
    return world.applyState(state)
  },
  { onUpdate: loadStrips },
)

onMounted(async () => {
  await booth.loadThemes()
  loadStrips()
})

async function loadStrips() {
  try {
    strips.value = await worldsApi.strips(route.params.id)
  } catch {
    /* gallery is non-essential */
  }
}

async function copyCode() {
  await navigator.clipboard.writeText(world.world.code)
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}

function openPicker(character = null) {
  pickerStart.value = character
  showPicker.value = true
}

async function confirmLeave() {
  const ok = window.confirm(
    `Leave "${world.world.name}"? You'll need the code ${world.world.code} to get back in.`,
  )
  if (!ok) return
  await world.leave()
  router.push('/')
}

async function confirmDestroy() {
  const ok = window.confirm(
    `Delete "${world.world.name}" for everyone? The gallery goes with it. This cannot be undone.`,
  )
  if (!ok) return
  await world.destroy()
  router.push('/')
}

function owns(strip) {
  return canManageStrip(strip, { isHost: world.isHost, worldId: world.world?.id })
}

function editStrip(strip) {
  router.push({ name: 'photobooth', query: { edit: strip.shareSlug } })
}

async function deleteStrip(strip) {
  if (!window.confirm(`Delete ${strip.authorName ? strip.authorName + "'s" : 'this'} strip?`)) return
  busyStrip.value = strip.id
  try {
    await stripsApi.destroy(strip.id, stripTokens.get(strip.id))
    strips.value = strips.value.filter((s) => s.id !== strip.id)
  } catch (err) {
    window.alert(err.message)
  } finally {
    busyStrip.value = null
  }
}

const themeName = computed(() => world.theme?.name ?? 'Not chosen yet')
const characters = computed(() => world.theme?.characters ?? [])
</script>

<template>
  <div v-if="world.world" class="pb-shell">
    <section class="pb-card p-4 mb-4">
      <div class="d-flex flex-wrap justify-content-between align-items-start gap-3">
        <div>
          <h1 class="pb-title h3 mb-1">{{ world.world.name }}</h1>
          <p class="pb-muted mb-0 small">
            <i class="bi bi-people-fill me-1"></i>
            {{ world.members.length }} / {{ world.world.memberLimit }} here
            <span class="mx-2">·</span>
            <i class="bi bi-palette-fill me-1"></i>{{ themeName }}
            <span v-if="active" class="ms-2 spinner-border spinner-border-sm" style="width: .7rem; height: .7rem"></span>
          </p>
        </div>

        <div class="text-end">
          <div class="pb-muted small mb-1">Share this code</div>
          <button class="btn btn-ghost pb-code fs-5" @click="copyCode">
            {{ world.world.code }}
            <i class="bi ms-2" :class="copied ? 'bi-check-lg' : 'bi-clipboard'"></i>
          </button>
        </div>
      </div>
    </section>

    <div class="row g-4">
      <div class="col-12 col-lg-8">
        <!-- Theme first, in the compact circle style that Who's here uses. -->
        <div class="pb-card p-4 mb-4">
          <h2 class="h6 mb-1">1. Theme</h2>
          <p class="pb-muted small mb-3">
            {{ world.isHost ? 'You pick it for everyone.' : 'Only the host can change this.' }}
          </p>
          <div class="row g-3">
            <div v-for="theme in booth.themes" :key="theme.id" class="col-4 col-sm-3 col-md-2 text-center">
              <button
                class="btn p-0 border-0 bg-transparent pb-selectable w-100"
                :class="{ 'is-selected': world.world.themeId === theme.id }"
                :aria-pressed="world.world.themeId === theme.id"
                :disabled="!world.isHost"
                :title="world.isHost ? theme.name : 'Host only'"
                @click="world.setTheme(theme.id)"
              >
                <div
                  class="rounded-circle mx-auto overflow-hidden"
                  style="width: 72px; height: 72px; border: 1px solid var(--pb-border)"
                >
                  <img :src="theme.thumbUrl" :alt="theme.name" class="w-100 h-100" style="object-fit: cover" />
                </div>
                <div class="small mt-2 text-truncate">{{ theme.name }}</div>
              </button>
            </div>
          </div>
        </div>

        <!-- Characters next, in the card grid the theme picker used to use. -->
        <div class="pb-card p-4 mb-4">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h2 class="h6 mb-1">2. Your character</h2>
              <p class="pb-muted small mb-0">
                {{ world.theme ? 'Pick one, then take or upload a photo. Changing character keeps your picture.' : 'Waiting for a theme.' }}
              </p>
            </div>
            <button
              v-if="world.theme"
              class="btn btn-ghost btn-sm"
              @click="openPicker()"
            >
              <i class="bi bi-camera-fill me-1"></i>
              {{ world.me?.characterImageUrl ? 'Edit photo' : 'Add photo' }}
            </button>
          </div>

          <div v-if="!characters.length" class="pb-muted small">
            The host picks a theme first — then these fill up with characters.
          </div>
          <div v-else class="row g-2">
            <div v-for="c in characters" :key="c.id" class="col-6 col-sm-4 col-md-3">
              <button
                class="btn p-0 w-100 pb-selectable border-0 overflow-hidden"
                :class="{ 'is-selected': world.me?.characterId === c.id }"
                :aria-pressed="world.me?.characterId === c.id"
                @click="openPicker(c)"
              >
                <img :src="c.artUrl" :alt="c.name" class="w-100 d-block" />
                <div class="small py-1 px-1 text-truncate">{{ c.name }}</div>
              </button>
            </div>
          </div>
        </div>

        <div class="pb-card p-4 mb-4">
          <h2 class="h6 mb-3">Who's here</h2>
          <div class="row g-3">
            <div v-for="member in world.members" :key="member.id" class="col-4 col-md-3 col-lg-2 text-center">
              <div
                class="rounded-circle mx-auto mb-2 d-flex align-items-center justify-content-center overflow-hidden"
                style="width: 76px; height: 76px; background: rgba(255,255,255,.07); border: 1px solid var(--pb-border)"
              >
                <img
                  v-if="member.characterImageUrl"
                  :src="member.characterImageUrl" alt=""
                  class="w-100 h-100" style="object-fit: cover"
                />
                <span v-else class="fs-4 fw-bold pb-muted">{{ member.displayName[0] }}</span>
              </div>
              <div class="small text-truncate">{{ member.displayName }}</div>
              <div v-if="member.isHost" class="badge" style="background: var(--pb-accent)">Host</div>
            </div>
          </div>
        </div>

        <div class="pb-card p-4">
          <h2 class="h6 mb-3">
            <i class="bi bi-images me-1"></i>World gallery
            <span class="pb-muted small fw-normal">({{ strips.length }})</span>
          </h2>
          <div v-if="!strips.length" class="pb-muted small">
            No strips yet. Head into the photobooth and make the first one.
          </div>
          <div v-else class="d-flex gap-3 overflow-auto pb-2">
            <div v-for="strip in strips" :key="strip.id" class="flex-shrink-0" style="width: 120px">
              <RouterLink :to="`/s/${strip.shareSlug}`" class="text-decoration-none d-block">
                <img :src="strip.imageUrl" :alt="`Strip by ${strip.authorName}`" class="w-100" style="border-radius: 8px" />
                <div class="small text-center pb-muted mt-1 text-truncate">{{ strip.authorName }}</div>
              </RouterLink>
              <div v-if="owns(strip)" class="d-flex gap-1 mt-1">
                <button
                  class="btn btn-ghost btn-sm flex-grow-1 py-1"
                  :disabled="!strip.editable || busyStrip === strip.id"
                  :title="strip.editable ? 'Edit decorations' : 'This strip was saved before editing existed'"
                  @click="editStrip(strip)"
                >
                  <i class="bi bi-pencil"></i>
                </button>
                <button
                  class="btn btn-ghost btn-sm flex-grow-1 py-1"
                  style="color: #ff8787"
                  :disabled="busyStrip === strip.id"
                  @click="deleteStrip(strip)"
                >
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <aside class="col-12 col-lg-4">
        <RouterLink to="/photobooth" class="btn btn-pb btn-lg w-100 mb-3">
          <i class="bi bi-camera-fill me-2"></i>Open the photobooth
        </RouterLink>

        <RouterLink to="/" class="btn btn-ghost w-100 mb-2">
          <i class="bi bi-house-door-fill me-1"></i>Home
        </RouterLink>

        <button class="btn btn-ghost w-100 mb-2" style="color: #ff8787" @click="confirmLeave">
          <i class="bi bi-box-arrow-left me-1"></i>Leave this World
        </button>

        <button
          v-if="world.isHost"
          class="btn btn-ghost w-100"
          style="color: #ff6b6b"
          @click="confirmDestroy"
        >
          <i class="bi bi-trash me-1"></i>Delete this World
        </button>
      </aside>
    </div>

    <CharacterPicker
      v-if="showPicker"
      :start-with="pickerStart"
      @close="showPicker = false"
    />
  </div>

  <div v-else class="pb-shell text-center py-5 pb-muted">
    <div class="spinner-border mb-2"></div>
    <div>Loading your World…</div>
  </div>
</template>
