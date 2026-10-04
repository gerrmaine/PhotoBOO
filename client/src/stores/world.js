import { defineStore } from 'pinia'
import { worldsApi, session, sessions, MAX_HOSTED_WORLDS } from '@/api/client.js'

export const useWorldStore = defineStore('world', {
  state: () => ({
    world: null,       // { id, code, name, themeId, revision, memberLimit }
    members: [],
    theme: null,
    memberId: session.memberId,
    joined: sessions.all(),   // every world this browser belongs to
    error: null,
    loading: false,
  }),

  getters: {
    me: (s) => s.members.find((m) => m.id === s.memberId) ?? null,
    isHost: (s) => s.members.find((m) => m.id === s.memberId)?.isHost ?? false,
    isFull: (s) => Boolean(s.world) && s.members.length >= s.world.memberLimit,
    hasSession: () => Boolean(session.token && session.worldId),
    hostedCount: (s) => s.joined.filter((w) => w.isHost).length,
    canCreateMore: (s) => s.joined.filter((w) => w.isHost).length < MAX_HOSTED_WORLDS,
    maxWorlds: () => MAX_HOSTED_WORLDS,
  },

  actions: {
    async create({ name, hostName }) {
      if (!this.canCreateMore) {
        throw new Error(`You can host ${MAX_HOSTED_WORLDS} Worlds at once. Delete one to make room.`)
      }
      this.loading = true
      try {
        const res = await worldsApi.create({ name, hostName })
        this.adoptSession(res)
        return res.world
      } finally {
        this.loading = false
      }
    },

    async join({ code, displayName }) {
      this.loading = true
      try {
        const res = await worldsApi.join(code, displayName)
        this.adoptSession(res)
        return res.world
      } finally {
        this.loading = false
      }
    },

    adoptSession({ world, member, memberToken }) {
      sessions.add({
        worldId: world.id,
        memberId: member.id,
        token: memberToken,
        code: world.code,
        name: world.name,
        isHost: member.isHost,
      })
      this.joined = sessions.all()
      this.world = world
      this.memberId = member.id
      this.members = [member]
      this.theme = null
    },

    /**
     * Points the store at another world the user already belongs to. The lobby
     * polls immediately afterwards, so only the identity has to be swapped here.
     */
    switchTo(worldId) {
      const entry = sessions.find(worldId)
      if (!entry) return false
      sessions.setActive(worldId)
      this.world = { id: entry.worldId, code: entry.code, name: entry.name, themeId: null, revision: -1, memberLimit: 20 }
      this.memberId = entry.memberId
      this.members = []
      this.theme = null
      return true
    },

    /**
     * Applies a lobby snapshot. Returns false when the server answered 304,
     * which lets the poller skip the re-render entirely.
     */
    applyState(state) {
      if (!state || state.notModified) return false
      this.world = {
        id: state.id,
        code: state.code,
        name: state.name,
        themeId: state.themeId,
        revision: state.revision,
        memberLimit: state.memberLimit,
      }
      this.members = state.members
      this.theme = state.theme

      // The cached list is what the switcher renders, so keep its labels honest.
      const me = state.members.find((m) => m.id === this.memberId)
      sessions.patch(state.id, { code: state.code, name: state.name, isHost: me?.isHost ?? false })
      this.joined = sessions.all()
      return true
    },

    async setTheme(themeId) {
      this.applyState(await worldsApi.setTheme(this.world.id, themeId))
    },

    /** Leaves one world but stays signed in to the others. */
    async leave(worldId = this.world?.id) {
      const entry = sessions.find(worldId)
      try {
        if (entry) await worldsApi.leave(worldId, entry.memberId)
      } finally {
        this.forget(worldId)
      }
    },

    /** Host only. Deletes the world and its gallery for everyone. */
    async destroy(worldId = this.world?.id) {
      const result = await worldsApi.destroy(worldId)
      this.forget(worldId)
      return result
    },

    forget(worldId) {
      sessions.remove(worldId)
      this.joined = sessions.all()
      if (this.world?.id === worldId) {
        this.world = null
        this.members = []
        this.theme = null
        this.memberId = sessions.active?.memberId ?? null
      }
    },
  },
})
