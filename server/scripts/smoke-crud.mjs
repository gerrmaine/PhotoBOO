/**
 * Exercises the Request E server surface: strips keep their source frames and
 * can be edited or deleted, and a host can delete a whole World.
 * Run against a live dev API: node scripts/smoke-crud.mjs
 */
const BASE = 'http://localhost:3000/api'
const STRIPS = `${BASE}/photobooth/strips`

// Smallest valid PNG the image sniffer will accept, as raw bytes.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

const ok = (label, cond, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${extra ? `  ${extra}` : ''}`)
  if (!cond) process.exitCode = 1
}

const json = async (res) => {
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(body)}`)
  return body
}

const file = (form, field, name) =>
  form.append(field, new Blob([PNG], { type: 'image/png' }), name)

const themes = await json(await fetch(`${BASE}/themes`))
const theme = themes.themes[0]

const world = await json(
  await fetch(`${BASE}/worlds`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'CRUD smoke', hostName: 'Host', themeId: theme.id }),
  }),
)
const token = world.memberToken
const auth = { authorization: `Bearer ${token}` }
ok('world created without an expiry', !('expiresAt' in world.world), JSON.stringify(Object.keys(world.world)))

// --- character keeps its face photo across a switch -------------------------
const charForm = new FormData()
charForm.append('characterId', theme.characters[0].id)
charForm.append('crop', JSON.stringify({ x: 0.4, y: 0.3, zoom: 1.8 }))
file(charForm, 'image', 'c.png')
file(charForm, 'face', 'f.png')
const withFace = await json(
  await fetch(`${BASE}/members/character`, { method: 'POST', headers: auth, body: charForm }),
)
ok('face photo stored', !!withFace.member.faceImageUrl, withFace.member.faceImageUrl)
ok('crop stored', withFace.member.faceCrop?.zoom === 1.8, JSON.stringify(withFace.member.faceCrop))

const switchForm = new FormData()
switchForm.append('characterId', theme.characters[1].id)
file(switchForm, 'image', 'c2.png')
const switched = await json(
  await fetch(`${BASE}/members/character`, { method: 'POST', headers: auth, body: switchForm }),
)
ok('face survives a character switch', switched.member.faceImageUrl === withFace.member.faceImageUrl)
ok('crop survives a character switch', switched.member.faceCrop?.zoom === 1.8)

// --- strips: create with frames, edit, delete -------------------------------
const stripForm = new FormData()
stripForm.append('themeId', theme.id)
stripForm.append('frameColor', '#120B24')
stripForm.append('authorName', 'Host')
stripForm.append('stickerData', '[]')
file(stripForm, 'strip', 's.png')
for (let i = 0; i < 4; i += 1) file(stripForm, 'frames', `f${i}.png`)
const strip = await json(await fetch(STRIPS, { method: 'POST', headers: auth, body: stripForm }))
ok('strip retains four source frames', strip.framesData?.length === 4, String(strip.framesData?.length))
ok('strip reports itself editable', strip.editable === true)
ok('edit token minted', typeof strip.editToken === 'string' && strip.editToken.length > 10)
ok('edit token hash never leaves the server', !('editTokenHash' in strip))

const patchForm = new FormData()
patchForm.append('themeId', theme.id)
patchForm.append('frameColor', '#EAF9FF')
patchForm.append('stickerData', '[]')
file(patchForm, 'strip', 's2.png')
const patched = await json(
  await fetch(`${STRIPS}/${strip.id}`, { method: 'PATCH', headers: auth, body: patchForm }),
)
ok('edit applied', patched.frameColor === '#EAF9FF', patched.frameColor)
ok('share link is stable across edits', patched.shareSlug === strip.shareSlug)
ok('edit does not disturb the frames', patched.framesData.length === 4)

const stranger = await fetch(`${STRIPS}/${strip.id}`, { method: 'DELETE' })
ok('a stranger cannot delete a strip', stranger.status === 403, `got ${stranger.status}`)

const removed = await fetch(`${STRIPS}/${strip.id}`, { method: 'DELETE', headers: auth })
ok('owner can delete a strip', removed.ok, `got ${removed.status}`)
const gone = await fetch(`${STRIPS}/${strip.shareSlug}`)
ok('deleted strip is really gone', gone.status === 404, `got ${gone.status}`)

// --- world deletion is host-only --------------------------------------------
const guest = await json(
  await fetch(`${BASE}/worlds/code/${world.world.code}/members`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ displayName: 'Guest' }),
  }),
)
const guestDelete = await fetch(`${BASE}/worlds/${world.world.id}`, {
  method: 'DELETE',
  headers: { authorization: `Bearer ${guest.memberToken}` },
})
ok('a guest cannot delete the World', guestDelete.status === 403, `got ${guestDelete.status}`)

const hostDelete = await fetch(`${BASE}/worlds/${world.world.id}`, { method: 'DELETE', headers: auth })
ok('host can delete the World', hostDelete.ok, `got ${hostDelete.status}`)
const worldGone = await fetch(`${BASE}/worlds/${world.world.id}/state`, { headers: auth })
ok('deleted World is really gone', worldGone.status === 404 || worldGone.status === 401, `got ${worldGone.status}`)
