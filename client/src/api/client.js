const BASE = import.meta.env.VITE_API_BASE ?? '/api'

const KEY = 'pb.worlds'
const ACTIVE = 'pb.activeWorldId'

/** You may host this many at once; worlds you merely joined don't count. */
export const MAX_HOSTED_WORLDS = 15

const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback
  } catch {
    return fallback
  }
}

/**
 * Every world you are in, with the bearer token that proves it.
 *
 * There are no accounts, so this list *is* the user's identity. It used to hold
 * a single world, which meant creating a second one silently evicted the first.
 */
export const sessions = {
  all() {
    const list = read(KEY, null)
    if (Array.isArray(list)) return list

    // One-time lift from the single-world keys this replaced.
    const token = localStorage.getItem('pb.memberToken')
    const worldId = localStorage.getItem('pb.worldId')
    const memberId = localStorage.getItem('pb.memberId')
    const migrated = token && worldId ? [{ worldId, memberId, token, code: '', name: 'Your World', isHost: false }] : []
    if (migrated.length) {
      this.write(migrated)
      localStorage.setItem(ACTIVE, worldId)
    }
    return migrated
  },

  write(list) {
    localStorage.setItem(KEY, JSON.stringify(list))
  },

  get activeId() {
    const id = localStorage.getItem(ACTIVE)
    const list = this.all()
    return list.some((w) => w.worldId === id) ? id : (list[0]?.worldId ?? null)
  },

  get active() {
    return this.all().find((w) => w.worldId === this.activeId) ?? null
  },

  find(worldId) {
    return this.all().find((w) => w.worldId === worldId) ?? null
  },

  get hostedCount() {
    return this.all().filter((w) => w.isHost).length
  },

  /** Re-joining a world you are already in updates it rather than duplicating. */
  add(entry) {
    const list = this.all().filter((w) => w.worldId !== entry.worldId)
    list.push({ ...entry, joinedAt: entry.joinedAt ?? new Date().toISOString() })
    this.write(list)
    this.setActive(entry.worldId)
  },

  patch(worldId, changes) {
    this.write(this.all().map((w) => (w.worldId === worldId ? { ...w, ...changes } : w)))
  },

  remove(worldId) {
    const list = this.all().filter((w) => w.worldId !== worldId)
    this.write(list)
    if (this.activeId === worldId || !list.length) localStorage.setItem(ACTIVE, list[0]?.worldId ?? '')
  },

  setActive(worldId) {
    localStorage.setItem(ACTIVE, worldId ?? '')
  },
}

/**
 * The active world, in the shape the rest of the app already expected. Requests
 * can also name a specific world so background calls don't depend on which tab
 * the user is looking at.
 */
export const session = {
  get token() {
    return sessions.active?.token ?? null
  },
  get worldId() {
    return sessions.activeId
  },
  get memberId() {
    return sessions.active?.memberId ?? null
  },
  tokenFor(worldId) {
    return sessions.find(worldId)?.token ?? null
  },
}

/** Locally remembered proof that you made a strip, so you can edit it later. */
export const stripTokens = {
  get(stripId) {
    return read('pb.stripTokens', {})[stripId] ?? null
  },
  set(stripId, token) {
    const map = read('pb.stripTokens', {})
    map[stripId] = token
    localStorage.setItem('pb.stripTokens', JSON.stringify(map))
  },
  forget(stripId) {
    const map = read('pb.stripTokens', {})
    delete map[stripId]
    localStorage.setItem('pb.stripTokens', JSON.stringify(map))
  },
}

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

async function request(method, path, { body, auth = false, raw304 = false, worldId, stripToken } = {}) {
  const headers = {}
  // `worldId` pins the call to one world's token; without it the active one wins.
  const token = auth ? (worldId ? session.tokenFor(worldId) : session.token) : null
  if (token) headers.Authorization = `Bearer ${token}`
  if (stripToken) headers['X-Strip-Token'] = stripToken

  const isFormData = body instanceof FormData
  if (body && !isFormData) headers['Content-Type'] = 'application/json'

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  })

  // The polling endpoint uses 304 as a normal, meaningful answer rather than an
  // error, so callers can opt into seeing it.
  if (res.status === 304 && raw304) return { notModified: true }
  if (res.status === 204) return null

  const payload = await res.json().catch(() => null)

  if (!res.ok) {
    const e = payload?.error ?? {}
    throw new ApiError(res.status, e.code ?? 'UNKNOWN', e.message ?? 'Something went wrong.', e.details)
  }
  return payload
}

export const api = {
  get: (path, opts) => request('GET', path, opts),
  post: (path, body, opts) => request('POST', path, { ...opts, body }),
  patch: (path, body, opts) => request('PATCH', path, { ...opts, body }),
  del: (path, opts) => request('DELETE', path, opts),
}

// --- endpoints -------------------------------------------------------------

export const themesApi = {
  list: () => api.get('/themes').then((r) => r.themes),
}

export const worldsApi = {
  create: (body) => api.post('/worlds', body),
  findByCode: (code) => api.get(`/worlds/code/${code.toUpperCase()}`),
  join: (code, displayName) => api.post(`/worlds/code/${code.toUpperCase()}/members`, { displayName }),
  state: (id, since) => api.get(`/worlds/${id}/state?since=${since}`, { auth: true, worldId: id, raw304: true }),
  setTheme: (id, themeId) => api.patch(`/worlds/${id}`, { themeId }, { auth: true, worldId: id }),
  leave: (id, memberId) => api.del(`/worlds/${id}/members/${memberId}`, { auth: true, worldId: id }),
  destroy: (id) => api.del(`/worlds/${id}`, { auth: true, worldId: id }),
  strips: (id) => api.get(`/worlds/${id}/strips`, { auth: true, worldId: id }).then((r) => r.strips),
  saveCharacter: (form, worldId) => api.post('/members/character', form, { auth: true, worldId }),
}

export const stripsApi = {
  save: (form) => api.post('/photobooth/strips', form, { auth: true }),
  update: (id, form, stripToken) =>
    api.patch(`/photobooth/strips/${id}`, form, { auth: true, stripToken }),
  destroy: (id, stripToken) => api.del(`/photobooth/strips/${id}`, { auth: true, stripToken }),
  findBySlug: (slug) => api.get(`/photobooth/strips/${slug}`),
}
