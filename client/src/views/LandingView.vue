<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useWorldStore } from '@/stores/world.js'

const router = useRouter()
const world = useWorldStore()

const mode = ref('create') // create | join
const form = ref({ worldName: '', hostName: '', code: '', displayName: '' })
const error = ref(null)

async function submit() {
  error.value = null
  try {
    const created =
      mode.value === 'create'
        ? await world.create({ name: form.value.worldName.trim(), hostName: form.value.hostName.trim() })
        : await world.join({ code: form.value.code.trim(), displayName: form.value.displayName.trim() })

    router.push(`/world/${created.id}`)
  } catch (err) {
    error.value = err.message
  }
}

function enter(worldId) {
  world.switchTo(worldId)
  router.push(`/world/${worldId}`)
}
</script>

<template>
  <div class="pb-shell">
    <section v-if="world.joined.length" class="pb-card p-3 p-md-4 mb-4">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <div>
          <div class="pb-muted small mb-1">Your Worlds</div>
          <h2 class="h5 mb-0">
            {{ world.joined.length }} {{ world.joined.length === 1 ? 'World' : 'Worlds' }}
            <span class="pb-muted fw-normal small ms-2">hosting {{ world.hostedCount }}/{{ world.maxWorlds }}</span>
          </h2>
        </div>
      </div>

      <div class="row g-2">
        <div v-for="entry in world.joined" :key="entry.worldId" class="col-12">
          <button
            class="btn btn-ghost w-100 text-start d-flex align-items-center gap-3 py-2"
            @click="enter(entry.worldId)"
          >
            <i class="bi" :class="entry.isHost ? 'bi-star-fill' : 'bi-door-open-fill'" style="color: var(--pb-accent)"></i>
            <span class="flex-grow-1 text-truncate">{{ entry.name || 'Untitled World' }}</span>
            <span class="pb-code small" style="color: var(--pb-accent)">{{ entry.code }}</span>
            <span v-if="entry.isHost" class="badge" style="background: var(--pb-accent)">Host</span>
            <i class="bi bi-chevron-right pb-muted"></i>
          </button>
        </div>
      </div>
    </section>

    <section class="text-center py-4 py-md-5">
      <h1 class="pb-title display-4 mb-3">Photobooth, together</h1>
      <p class="pb-muted fs-5 mx-auto mb-4" style="max-width: 46ch">
        Start a private World, share the code with friends, pick a theme, and shoot
        four-frame strips you can actually keep.
      </p>
      <RouterLink to="/photobooth" class="btn btn-pb btn-lg">
        <i class="bi bi-camera-fill me-2"></i>Just open the photobooth
      </RouterLink>
      <p class="pb-muted small mt-2 mb-0">No account, no sign-up — works on its own.</p>
    </section>

    <div class="row justify-content-center">
      <div class="col-12 col-md-8 col-lg-6">
        <div class="pb-card p-4">
          <div class="btn-group w-100 mb-4">
            <button
              class="btn" :class="mode === 'create' ? 'btn-pb' : 'btn-ghost'"
              @click="mode = 'create'; error = null"
            >
              Create a World
            </button>
            <button
              class="btn" :class="mode === 'join' ? 'btn-pb' : 'btn-ghost'"
              @click="mode = 'join'; error = null"
            >
              Join with a code
            </button>
          </div>

          <form @submit.prevent="submit">
            <template v-if="mode === 'create'">
              <label class="form-label small pb-muted">World name</label>
              <input
                v-model="form.worldName" class="form-control pb-input mb-3"
                placeholder="Friday night crew" maxlength="40" required
                :disabled="!world.canCreateMore"
              />
              <label class="form-label small pb-muted">Your name</label>
              <input
                v-model="form.hostName" class="form-control pb-input mb-4"
                placeholder="Germaine" maxlength="24" required
                :disabled="!world.canCreateMore"
              />
            </template>

            <template v-else>
              <label class="form-label small pb-muted">Join code</label>
              <input
                v-model="form.code"
                class="form-control pb-input pb-code text-center mb-3"
                placeholder="ABC123" maxlength="6" minlength="6" required
                autocapitalize="characters" autocomplete="off"
                @input="form.code = form.code.toUpperCase()"
              />
              <label class="form-label small pb-muted">Your name</label>
              <input
                v-model="form.displayName" class="form-control pb-input mb-4"
                placeholder="Alex" maxlength="24" required
              />
            </template>

            <div v-if="error" class="alert alert-danger py-2 small">{{ error }}</div>
            <div v-else-if="mode === 'create' && !world.canCreateMore" class="alert alert-warning py-2 small">
              You're hosting the maximum of {{ world.maxWorlds }} Worlds. Delete one to make room.
            </div>

            <button
              class="btn btn-pb w-100 btn-lg"
              :disabled="world.loading || (mode === 'create' && !world.canCreateMore)"
            >
              <span v-if="world.loading" class="spinner-border spinner-border-sm me-2"></span>
              {{ mode === 'create' ? 'Create World' : 'Join World' }}
            </button>
          </form>
        </div>

        <p class="pb-muted small text-center mt-3 mb-0">
          Worlds stay until the host deletes them. You can host up to {{ world.maxWorlds }} at once.
        </p>
      </div>
    </div>
  </div>
</template>
